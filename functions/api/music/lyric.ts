import { jsonResponse, optionsResponse } from '../../_lib/http';
import { fetchHighPrecisionLyrics } from '../../_lib/music-provider';
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
    limit: envLimit(env, 'MUSIC_LYRIC_PER_MINUTE', 60),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many lyric requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() || '';
  const source = url.searchParams.get('source')?.trim() || env.MUSIC_DEFAULT_SOURCE || 'netease';
  const title = (url.searchParams.get('title') || url.searchParams.get('name'))?.trim() || '';
  const artist = (url.searchParams.get('artist') || url.searchParams.get('singer'))?.trim() || '';
  const q = (url.searchParams.get('q') || url.searchParams.get('keyword'))?.trim() || '';
  const durationStr = url.searchParams.get('duration');
  const duration = durationStr ? parseFloat(durationStr) : undefined;

  if (!id && !title && !artist && !q) {
    return jsonResponse(request, env, { ok: false, error: 'Missing track id, title, artist or q parameter.' }, { status: 400 });
  }

  const payload = await fetchHighPrecisionLyrics(env, { id, source, title, artist, q, duration });

  return jsonResponse(request, env, {
    ...payload,
    // 向前兼容历史调用
    lyric: payload.rawLyric,
    lrc: payload.rawLyric,
    parsed: payload.lines,
  });
}

