import { searchMusic, randomMusic, resolveMusicStream, fetchMusicLyrics } from '../_lib/music-provider';
import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit.ts';

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  // Rate limit legacy proxy endpoint: 30 requests per minute per IP
  const rateLimit = await enforceRateLimit({
    namespace: 'music-proxy',
    request,
    env,
    limit: envLimit(env, 'MUSIC_STREAM_MINUTE_LIMIT', 30),
    windowSeconds: 60,
    scope: 'hybrid',
  });

  if (!rateLimit.allowed) {
    return jsonResponse(
      request,
      env,
      { error: 'Music proxy request frequency exceeded limit' },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('types');
  const source = url.searchParams.get('source') || 'netease'; // Default source
  const id = url.searchParams.get('id') || '';
  const name = url.searchParams.get('name') || '';
  const br = url.searchParams.get('br') || '320'; // Bitrate/quality
  const count = parseInt(url.searchParams.get('count') || '20', 10);
  const page = parseInt(url.searchParams.get('pages') || '1', 10);

  let responseData: any;
  let status = 200;

  try {
    switch (type) {
      case 'search':
        responseData = await searchMusic(env, name, source, count, page);
        break;
      case 'random': // Custom type for random music, similar to Solara's explore radar
        responseData = await randomMusic(env, count);
        break;
      case 'url':
        const streamUrl = await resolveMusicStream(env, id, source, br);
        responseData = { url: streamUrl };
        break;
      case 'lyric':
        const lyric = await fetchMusicLyrics(env, id, source);
        responseData = { lyric: lyric };
        break;
      default:
        status = 400;
        responseData = { error: 'Invalid or missing type parameter' };
        break;
    }
  } catch (error: any) {
    console.error('Music proxy error:', error);
    status = 500;
    responseData = { error: error.message || 'Internal server error' };
  }

  return jsonResponse(request, env, responseData, { status });
};
