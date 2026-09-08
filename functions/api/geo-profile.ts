import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse } from '../_lib/http';

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  // Allow test override via query param ?country=XX or header
  const queryCountry = url.searchParams.get('country')?.trim().toUpperCase();
  const rawCountry = queryCountry || request.headers.get('cf-ipcountry') || 'GLOBAL';
  const country = rawCountry.trim().toUpperCase() || 'GLOBAL';
  const isMainland = country === 'CN';
  const city = request.headers.get('cf-ipcity') || '';
  const timezone = request.headers.get('cf-timezone') || '';
  const countryName = request.headers.get('cf-ipcountry-name') || (country === 'CN' ? '中国' : country === 'US' ? '美国' : country === 'JP' ? '日本' : country);
  const location = city ? `${countryName}·${city}` : countryName;

  return jsonResponse(
    request,
    env,
    {
      country,
      isMainland,
      city,
      timezone,
      countryName,
      location,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
