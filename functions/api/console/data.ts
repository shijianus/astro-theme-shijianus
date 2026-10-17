import { jsonResponse, optionsResponse } from '../../_lib/http';
import type { AppEnv } from '../../_lib/types';
import metricsSnapshot from '../../../public/data/console-metrics.json';

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      request,
      env,
      { ok: false, error: 'Method Not Allowed' },
      { status: 405 },
    );
  }

  try {
    const url = new URL(request.url);
    const assetUrl = new URL('/data/console-metrics.json', url.origin);

    let baseData: any = null;
    const assetBinding = (env as any)?.ASSETS;
    if (assetBinding && typeof assetBinding.fetch === 'function') {
      try {
        const res = await assetBinding.fetch(new Request(assetUrl.toString()));
        if (res && res.ok) {
          baseData = await res.json();
        }
      } catch {
        // Fallback gracefully to bundled snapshot
      }
    }

    if (!baseData || !baseData.ok) {
      baseData = JSON.parse(JSON.stringify(metricsSnapshot));
    }

    const now = new Date();
    const START_DATE = new Date('2024-01-01T00:00:00Z');
    const dynamicUptimeDays = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

    if (baseData && baseData.stats) {
      baseData.stats.uptimeDays = dynamicUptimeDays;
    }
    baseData.servedAt = now.toISOString();

    return jsonResponse(
      request,
      env,
      baseData,
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      },
    );
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};

