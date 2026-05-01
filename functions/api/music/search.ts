import { jsonResponse, optionsResponse } from '../../_lib/http';
import { searchMusic } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-search',
    request,
    env,
    limit: envLimit(env, 'MUSIC_SEARCH_PER_MINUTE', 30),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many music searches.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const source = url.searchParams.get('source')?.trim() || env.MUSIC_DEFAULT_SOURCE || 'netease';
  const count = Math.max(1, Math.min(20, Number.parseInt(url.searchParams.get('count') || '8', 10) || 8));
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);

  if (!q) {
    return jsonResponse(request, env, { ok: false, error: 'Missing search query.' }, { status: 400 });
  }

  const tracks = await searchMusic(env, q, source, count, page);
  return jsonResponse(request, env, { ok: true, q, source, tracks });
}
