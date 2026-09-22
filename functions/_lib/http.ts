import type { AppEnv } from './types';

function resolveAllowedOrigins(env: AppEnv) {
  return (env?.ALLOW_ORIGINS || '*')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveOrigin(request: Request, env: AppEnv) {
  const origin = request.headers.get('origin') || '';
  if (!origin) return '*';

  try {
    const requestUrl = new URL(request.url);
    if (origin === requestUrl.origin) return origin; // Same-origin is ALWAYS permitted
    const originUrl = new URL(origin);
    if (
      originUrl.hostname === 'epocanvas.com' ||
      originUrl.hostname.endsWith('.epocanvas.com') ||
      originUrl.hostname.endsWith('.pages.dev') ||
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === '0.0.0.0'
    ) {
      return origin;
    }
  } catch {}

  const allowedOrigins = resolveAllowedOrigins(env);
  if (allowedOrigins.includes('*')) return origin;
  if (allowedOrigins.includes(origin)) return origin;
  return origin || allowedOrigins[0] || '*';
}

export function withCors(request: Request, env: AppEnv, init?: HeadersInit) {
  const headers = new Headers(init);
  const origin = resolveOrigin(request, env);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Shijianus-Device-Id, X-Comment-Session-Token, X-Admin-Token, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
}

export function jsonResponse(request: Request, env: AppEnv, payload: unknown, init: ResponseInit = {}) {
  const headers = withCors(request, env, init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

export function textResponse(request: Request, env: AppEnv, body: string, init: ResponseInit = {}) {
  const headers = withCors(request, env, init.headers);
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(body, {
    ...init,
    headers,
  });
}

export function optionsResponse(request: Request, env: AppEnv) {
  return new Response(null, {
    status: 204,
    headers: withCors(request, env),
  });
}

export async function safeReadJson<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
