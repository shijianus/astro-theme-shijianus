import type { AppEnv } from './types';

function resolveAllowedOrigins(env: AppEnv) {
  return (env.ALLOW_ORIGINS || '*')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveOrigin(request: Request, env: AppEnv) {
  const allowedOrigins = resolveAllowedOrigins(env);
  if (allowedOrigins.includes('*')) return '*';

  const origin = request.headers.get('origin') || '';
  if (!origin) return allowedOrigins[0] || '*';
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*';
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
