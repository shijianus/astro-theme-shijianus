import { jsonResponse, optionsResponse, withCors } from '../../_lib/http';
import { resolveMusicPic } from '../../_lib/music-provider';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit';
import type { AppEnv } from '../../_lib/types';

const DEFAULT_COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#425aef"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="24" fill="url(#g)"/>
  <circle cx="150" cy="150" r="70" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
  <path d="M140 115v50a18 18 0 1 1-14-17.5V125h36v25a18 18 0 1 1-14-17.5V115z" fill="#ffffff"/>
</svg>`;

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const rate = await enforceRateLimit({
    namespace: 'music-cover',
    request,
    env,
    limit: envLimit(env, 'MUSIC_COVER_PER_MINUTE', 60),
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(request, env, { ok: false, error: 'Too many cover requests.', resetAt: rate.resetAt }, { status: 429 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() || '';
  const picId = url.searchParams.get('picId')?.trim() || '';
  const source = url.searchParams.get('source')?.trim() || env.MUSIC_DEFAULT_SOURCE || 'netease';

  // 1. 如果 picId 本身已经是完整 HTTP 链接，直接返回 302 重定向
  if (picId.startsWith('http://') || picId.startsWith('https://')) {
    return Response.redirect(picId, 302);
  }

  // 2. 通过提供商解析真实图片地址
  const resolvedUrl = await resolveMusicPic(env, id, picId, source);
  if (resolvedUrl && (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://'))) {
    return Response.redirect(resolvedUrl, 302);
  }

  // 3. 兜底返回高质量 SVG 封面
  const headers = withCors(request, env);
  headers.set('Content-Type', 'image/svg+xml');
  headers.set('Cache-Control', 'public, max-age=86400');
  return new Response(DEFAULT_COVER_SVG, { status: 200, headers });
}
