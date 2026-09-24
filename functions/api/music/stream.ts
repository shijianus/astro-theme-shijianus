import { jsonResponse, optionsResponse, withCors } from '../../_lib/http.ts';
import { resolveMusicStream } from '../../_lib/music-provider.ts';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit.ts';
import type { AppEnv } from '../../_lib/types';

const SAFE_RESPONSE_HEADERS = ['content-type', 'cache-control', 'accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified', 'expires'];

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === 'metadata.google.internal' ||
    host === 'instance-data' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    return true;
  }

  // IPv6 loopback and link-local
  if (host === '::1' || host === '[::1]' || host.startsWith('fe80:') || host.startsWith('[fe80:')) {
    return true;
  }

  // IPv4 checks (Loopback, Link-Local/Metadata, RFC1918 Private, CGNAT)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const octets = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
    if (octets.some((o) => o > 255)) return true;

    // 127.0.0.0/8 Loopback
    if (octets[0] === 127) return true;
    // 0.0.0.0/8
    if (octets[0] === 0) return true;
    // 169.254.0.0/16 Link-local / Cloud metadata
    if (octets[0] === 169 && octets[1] === 254) return true;
    // 10.0.0.0/8 Private
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 Private
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16 Private
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 100.64.0.0/10 Carrier-grade NAT
    if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;
  }

  return false;
}

function sanitizeTarget(rawUrl: string, baseOrigin?: string) {
  try {
    const parsed = rawUrl.startsWith('/') && baseOrigin ? new URL(rawUrl, baseOrigin) : new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (isPrivateOrLoopbackHost(parsed.hostname)) return null;
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
  if (streamUrl.startsWith('/')) {
    const headers = withCors(request, env);
    headers.set('Location', streamUrl);
    return new Response(null, { status: 302, headers });
  }

  const target = sanitizeTarget(streamUrl, request.url);
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
