import { jsonResponse, optionsResponse } from '../../_lib/http';
import { randomMusic } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-random',
    request,
    env,
    limit: envLimit(env, 'MUSIC_SEARCH_PER_MINUTE', 30),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many music requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const count = Math.max(1, Math.min(12, Number.parseInt(url.searchParams.get('count') || '6', 10) || 6));
  const result = await randomMusic(env, count);
  return jsonResponse(request, env, { ok: true, ...result });
}
