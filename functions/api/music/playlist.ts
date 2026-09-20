import { jsonResponse, optionsResponse } from '../../_lib/http';
import { getCuratedPlaylist } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-playlist',
    request,
    env,
    limit: envLimit(env, 'MUSIC_SEARCH_PER_MINUTE', 30),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many playlist requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  try {
    const tracks = await getCuratedPlaylist(env);
    return jsonResponse(request, env, { ok: true, count: tracks.length, tracks });
  } catch {
    return jsonResponse(request, env, { ok: false, error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
