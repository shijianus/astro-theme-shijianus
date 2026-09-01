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

  return jsonResponse(
    request,
    env,
    {
      country,
      isMainland,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
