import { jsonResponse, optionsResponse } from '../_lib/http';
import type { AppEnv } from '../_lib/types';

// Fallback rates when upstream network is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  HKD: 7.80,
  CNY: 7.24,
  EUR: 0.92,
  JPY: 155.0,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.52,
  SGD: 1.34,
  CHF: 0.89,
  KRW: 1375.0,
  NZD: 1.67,
  TWD: 32.2,
  THB: 36.5,
};

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return optionsResponse();
  }

  const url = new URL(context.request.url);
  const base = (url.searchParams.get('base') || 'USD').toUpperCase();

  try {
    const upstreamUrl = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'shijianus-blog-forex/1.0',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as any;
      if (data && data.rates) {
        return new Response(JSON.stringify({
          success: true,
          base: data.base_code || base,
          rates: data.rates,
          time_last_update_utc: data.time_last_update_utc || new Date().toISOString(),
          source: 'live',
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    }
  } catch (err) {
    console.warn('[ExchangeRate API] Upstream fetch error:', err);
  }

  // Graceful Fallback
  return new Response(JSON.stringify({
    success: true,
    base: base,
    rates: FALLBACK_RATES,
    time_last_update_utc: new Date().toISOString(),
    source: 'fallback',
    warning: 'Offline fallback rates used',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
