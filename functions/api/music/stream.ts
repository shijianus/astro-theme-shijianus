import { jsonResponse, optionsResponse, withCors } from '../../_lib/http';
import { resolveMusicStream } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

const SAFE_RESPONSE_HEADERS = ['content-type', 'cache-control', 'accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified', 'expires'];

function sanitizeTarget(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-stream',
    request,
    env,
    limit: envLimit(env, 'MUSIC_STREAM_PER_MINUTE', 60),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many stream requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() || '';
  const source = url.searchParams.get('source')?.trim() || env.MUSIC_DEFAULT_SOURCE || 'netease';
  const quality = url.searchParams.get('quality')?.trim() || '320';

  if (!id) {
    return jsonResponse(request, env, { ok: false, error: 'Missing track id.' }, { status: 400 });
  }

  const streamUrl = await resolveMusicStream(env, id, source, quality);
  const target = sanitizeTarget(streamUrl);
  if (!target) {
    return jsonResponse(request, env, { ok: false, error: 'No playable stream URL.' }, { status: 502 });
  }

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers: {
      'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
      Referer: 'https://www.kuwo.cn/',
      ...(request.headers.get('range') ? { Range: request.headers.get('range') || '' } : {}),
    },
  });

  const headers = withCors(request, env);
  for (const [key, value] of upstream.headers.entries()) {
    if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  headers.set('Cache-Control', 'public, max-age=1800');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
