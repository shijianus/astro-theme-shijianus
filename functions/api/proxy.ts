import { searchMusic, randomMusic, resolveMusicStream, fetchMusicLyrics } from '../_lib/music-provider';
import type { AppEnv } from '../_lib/types';

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const url = new URL(context.request.url);
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
        responseData = await searchMusic(context.env, name, source, count, page);
        break;
      case 'random': // Custom type for random music, similar to Solara's explore radar
        responseData = await randomMusic(context.env, count);
        break;
      case 'url':
        const streamUrl = await resolveMusicStream(context.env, id, source, br);
        responseData = { url: streamUrl };
        break;
      case 'lyric':
        const lyric = await fetchMusicLyrics(context.env, id, source);
        responseData = { lyric: lyric };
        break;
      // case 'pic': // Solara also has a 'pic' type, but for simple integration, we might not need a dedicated proxy for it
      //   // For album art, Solara usually gets pic_id and constructs URL directly or from API response
      //   break;
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

  return new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    status: status,
  });
};
