import { jsonResponse, optionsResponse } from '../../_lib/http';
import { fetchMusicLyrics } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-lyric',
    request,
    env,
    limit: envLimit(env, 'MUSIC_LYRIC_PER_MINUTE', 40),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many lyric requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() || '';
  const source = url.searchParams.get('source')?.trim() || env.MUSIC_DEFAULT_SOURCE || 'netease';
  if (!id) {
    return jsonResponse(request, env, { ok: false, error: 'Missing track id.' }, { status: 400 });
  }

  const lyric = await fetchMusicLyrics(env, id, source);
  return jsonResponse(request, env, { ok: true, lyric });
}
