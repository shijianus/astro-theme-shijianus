import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';
import {
  getEffectiveAuthConfig,
  exchangeEpomailAuthorizationCode,
  directEpomailAuthorize,
  getUserBySessionToken,
  invalidateSession,
  authenticateLocalReader,
} from '../_lib/auth-service.ts';

function extractSessionToken(request: Request, body?: any): string {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = request.headers.get('x-auth-token') || request.headers.get('x-comment-session-token');
  if (customHeader) return customHeader.trim();
  if (body && typeof body.token === 'string') return body.token.trim();
  return '';
}

export async function onRequest(context: { request: Request; env: AppEnv; params?: { action?: string | string[] } }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '');

  // 1. GET /api/auth/config (or /api/auth)
  if ((pathname === '/api/auth/config' || pathname === '/api/auth') && request.method === 'GET') {
    const config = getEffectiveAuthConfig(env, request.url);
    return jsonResponse(request, env, {
      ok: true,
      mode: config.mode,
      providers: ['epomail', 'local'],
      epomail: {
        baseUrl: config.epomail.baseUrl,
        clientId: config.epomail.clientId,
        authorizeUrl: config.epomail.authorizeUrl,
        redirectUri: config.epomail.redirectUri,
        scope: config.epomail.scope,
      },
      adminApp: config.adminApp,
    });
  }

  // 2. POST /api/auth/epomail/token (OAuth 2.0 Authorization Code Exchange)
  if (pathname === '/api/auth/epomail/token' && request.method === 'POST') {
    try {
      const body = await safeReadJson<{ code: string; redirectUri?: string }>(request);
      if (!body?.code) {
        return jsonResponse(request, env, { ok: false, error: '缺少 authorization_code 参数' }, { status: 400 });
      }

      const session = await exchangeEpomailAuthorizationCode(
        body.code,
        body.redirectUri || '',
        env,
        request.url
      );

      return jsonResponse(request, env, {
        ok: true,
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
        message: 'Epomail OAuth 授权登录成功',
      });
    } catch (err: any) {
      console.error('[Auth API] Epomail token exchange error:', err);
      return jsonResponse(request, env, { ok: false, error: err?.message || 'OAuth 授权码交换失败' }, { status: 500 });
    }
  }

  // 3. POST /api/auth/epomail/authorize (Direct in-drawer Epomail Auth via Admin App)
  if (pathname === '/api/auth/epomail/authorize' && request.method === 'POST') {
    try {
      const body = await safeReadJson<{ email: string; password?: string; code?: string }>(request);
      if (!body?.email) {
        return jsonResponse(request, env, { ok: false, error: '请输入有效的 Epomail 账号' }, { status: 400 });
      }

      const session = await directEpomailAuthorize(body, env, request.url);

      return jsonResponse(request, env, {
        ok: true,
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
        message: 'Epomail 授权成功 (APP 外接方案)',
      });
    } catch (err: any) {
      console.error('[Auth API] Direct Epomail authorize error:', err);
      return jsonResponse(request, env, { ok: false, error: err?.message || 'Epomail 授权验证失败' }, { status: 400 });
    }
  }

  // 4. GET /api/auth/user (Current authenticated session profile)
  if (pathname === '/api/auth/user' && request.method === 'GET') {
    try {
      const token = extractSessionToken(request);
      if (!token) {
        return jsonResponse(request, env, { ok: false, error: '未提供会话令牌 (Unauthorized)' }, { status: 401 });
      }

      const user = await getUserBySessionToken(token, env);
      if (!user) {
        return jsonResponse(request, env, { ok: false, error: '会话已过期或无效' }, { status: 401 });
      }

      return jsonResponse(request, env, { ok: true, user });
    } catch (err: any) {
      return jsonResponse(request, env, { ok: false, error: err?.message || '获取用户信息失败' }, { status: 500 });
    }
  }

  // 5. POST /api/auth/logout (Revoke session)
  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    try {
      const body = await safeReadJson<{ token?: string }>(request);
      const token = extractSessionToken(request, body);
      if (token) {
        await invalidateSession(token, env);
      }
      return jsonResponse(request, env, { ok: true, message: '已成功退出登录' });
    } catch (err: any) {
      return jsonResponse(request, env, { ok: false, error: err?.message || '退出失败' }, { status: 500 });
    }
  }

  // 6. POST /api/auth/local (Local reader identity creation or login)
  if (pathname === '/api/auth/local' && request.method === 'POST') {
    try {
      const body = await safeReadJson<{ name: string; email: string; website?: string; avatar?: string }>(request);
      if (!body?.name) {
        return jsonResponse(request, env, { ok: false, error: '昵称不能为空' }, { status: 400 });
      }

      const session = await authenticateLocalReader(body, env);

      return jsonResponse(request, env, {
        ok: true,
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
        message: '本地身份创建成功',
      });
    } catch (err: any) {
      return jsonResponse(request, env, { ok: false, error: err?.message || '本地身份验证失败' }, { status: 400 });
    }
  }

  return jsonResponse(request, env, { ok: false, error: `Auth API route not found: ${request.method} ${pathname}` }, { status: 404 });
}
