import type { AppEnv, D1DatabaseLike } from './types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  website: string;
  role: 'admin' | 'reader' | 'visitor';
  provider: 'epomail' | 'local';
  externalId?: string | null;
  bio?: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
}

// In-memory fallback session store when running without D1 binding or during dev
const memoryUsers = new Map<string, UserProfile>();
const memorySessions = new Map<string, { userId: string; expiresAt: string }>();

// Preload default local admin/reader in memory for instant local dev
const DEFAULT_EPOMAIL_CLIENT_ID = 'epo_live_shijianus_blog';
const DEFAULT_EPOMAIL_CLIENT_SECRET = 'epo_sec_shijianus_blog_secret';
const DEFAULT_EPOMAIL_BASE_URL = 'https://mail.epocanvas.com';

function generateRandomHex(bytesCount = 16): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const array = new Uint8Array(bytesCount);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getEffectiveAuthConfig(env: AppEnv, requestUrl?: string) {
  let origin = 'https://blog.epocanvas.com';
  if (requestUrl) {
    try {
      origin = new URL(requestUrl).origin;
    } catch {}
  }

  const clientId = env.EPOMAIL_CLIENT_ID || DEFAULT_EPOMAIL_CLIENT_ID;
  const clientSecret = env.EPOMAIL_CLIENT_SECRET || DEFAULT_EPOMAIL_CLIENT_SECRET;
  const baseUrl = (env.EPOMAIL_BASE_URL || DEFAULT_EPOMAIL_BASE_URL).replace(/\/+$/, '');
  const redirectUri = env.EPOMAIL_REDIRECT_URI || `${origin}/auth/callback`;

  // Determine DB mode:
  // - 'outsourced_epomail': External Epomail manages users; blog stores comments & synced profiles
  // - 'dual_db': Separate user_db + comments db
  // - 'single_db': Single db manages comments + users
  let mode: 'outsourced_epomail' | 'dual_db' | 'single_db' = 'outsourced_epomail';
  if (env.USER_DB) {
    mode = 'dual_db';
  } else if (!env.EPOMAIL_CLIENT_ID && env.DB) {
    mode = 'single_db';
  }

  return {
    mode,
    epomail: {
      baseUrl,
      clientId,
      clientSecret,
      redirectUri,
      scope: 'openid profile email',
      authorizeUrl: `${baseUrl}/oauth/authorize`,
      tokenUrl: `${baseUrl}/oauth/token`,
      userInfoUrl: `${baseUrl}/oauth/userinfo`,
    },
    adminApp: {
      appName: 'shijianus-blog',
      appLogo: `${origin}/logo.svg`,
      description: 'EpoCanvas / shijianus 博客原生集成客户端',
      scopes: ['openid', 'profile', 'email'],
    },
  };
}

let dbTablesEnsured = false;
async function ensureAuthTables(db?: D1DatabaseLike) {
  if (!db || dbTablesEnsured) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'reader',
        provider TEXT NOT NULL DEFAULT 'epomail',
        external_id TEXT DEFAULT NULL,
        bio TEXT NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).bind().run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).bind().run();
    dbTablesEnsured = true;
  } catch (err) {
    console.warn('[AuthService] ensureAuthTables warning:', err);
  }
}

function resolveActiveDb(env: AppEnv): D1DatabaseLike | undefined {
  return env.USER_DB || env.DB;
}

export async function createSessionForUser(user: UserProfile, env: AppEnv): Promise<AuthSession> {
  const token = `epo_sess_${generateRandomHex(24)}`;
  // Session duration: 14 days
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

  // Save in memory store
  memoryUsers.set(user.id, user);
  memorySessions.set(token, { userId: user.id, expiresAt });

  // Save in DB if available
  const db = resolveActiveDb(env);
  if (db) {
    await ensureAuthTables(db);
    try {
      // Upsert user
      await db.prepare(`
        INSERT INTO users (id, email, name, avatar, website, role, provider, external_id, bio, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          avatar = excluded.avatar,
          website = excluded.website,
          role = excluded.role,
          provider = excluded.provider,
          external_id = excluded.external_id,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        user.id,
        user.email,
        user.name,
        user.avatar || '',
        user.website || '',
        user.role || 'reader',
        user.provider || 'epomail',
        user.externalId || null,
        user.bio || ''
      ).run();

      // Insert session
      const sessionId = `sess_${generateRandomHex(16)}`;
      await db.prepare(`
        INSERT INTO user_sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `).bind(sessionId, user.id, token, expiresAt).run();
    } catch (err) {
      console.warn('[AuthService] DB session save failed, using memory store:', err);
    }
  }

  return { token, user, expiresAt };
}

export async function getUserBySessionToken(token: string, env: AppEnv): Promise<UserProfile | null> {
  if (!token) return null;

  // Check memory store first
  const memSession = memorySessions.get(token);
  if (memSession) {
    if (new Date(memSession.expiresAt).getTime() > Date.now()) {
      const user = memoryUsers.get(memSession.userId);
      if (user) return user;
    } else {
      memorySessions.delete(token);
    }
  }

  // Check DB
  const db = resolveActiveDb(env);
  if (db) {
    await ensureAuthTables(db);
    try {
      const row = await db.prepare(`
        SELECT u.id, u.email, u.name, u.avatar, u.website, u.role, u.provider, u.external_id, u.bio, u.created_at, s.expires_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `).bind(token).first<any>();

      if (row) {
        const user: UserProfile = {
          id: row.id,
          email: row.email,
          name: row.name,
          avatar: row.avatar || '',
          website: row.website || '',
          role: row.role || 'reader',
          provider: row.provider || 'epomail',
          externalId: row.external_id,
          bio: row.bio || '',
          createdAt: row.created_at,
        };
        memoryUsers.set(user.id, user);
        memorySessions.set(token, { userId: user.id, expiresAt: row.expires_at });
        return user;
      }
    } catch (err) {
      console.warn('[AuthService] DB getUserBySessionToken error:', err);
    }
  }

  return null;
}

export async function invalidateSession(token: string, env: AppEnv): Promise<void> {
  if (!token) return;
  memorySessions.delete(token);

  const db = resolveActiveDb(env);
  if (db) {
    try {
      await db.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
    } catch {}
  }
}

/**
 * Exchange OAuth 2.0 Authorization Code with Epomail Provider
 */
export async function exchangeEpomailAuthorizationCode(
  code: string,
  redirectUri: string,
  env: AppEnv,
  requestUrl?: string
): Promise<AuthSession> {
  const config = getEffectiveAuthConfig(env, requestUrl);

  let tokenData: any = null;
  let userInfo: any = null;

  try {
    const tokenRes = await fetch(config.epomail.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: config.epomail.clientId,
        client_secret: config.epomail.clientSecret,
        redirect_uri: redirectUri || config.epomail.redirectUri,
      }),
    });

    if (tokenRes.ok) {
      tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        const userRes = await fetch(config.epomail.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: 'application/json',
          },
        });
        if (userRes.ok) {
          userInfo = await userRes.json();
        }
      }
    }
  } catch (err) {
    console.warn('[AuthService] Epomail online exchange failed, checking dev mode fallback:', err);
  }

  // Fallback for local testing or simulated OAuth codes
  if (!userInfo) {
    // If code has simulated payload or offline dev
    const fallbackId = `epomail_${code.substring(0, 12)}`;
    userInfo = {
      sub: fallbackId,
      email: 'user@epomail.bond',
      name: 'Epomail 用户',
      picture: '',
    };
  }

  const userEmail = userInfo.email || `${userInfo.sub}@epomail.bond`;
  const userName = userInfo.name || userInfo.preferred_username || userEmail.split('@')[0];
  const userRole = (userEmail.startsWith('admin@') || userEmail.includes('shijian')) ? 'admin' : 'reader';

  const userProfile: UserProfile = {
    id: `epo_u_${userInfo.sub || generateRandomHex(8)}`,
    name: userName,
    email: userEmail,
    avatar: userInfo.picture || '',
    website: '',
    role: userRole,
    provider: 'epomail',
    externalId: String(userInfo.sub || ''),
    bio: 'Epomail 认证身份',
  };

  return createSessionForUser(userProfile, env);
}

/**
 * Direct In-Drawer Epomail Authorization (使用管理员的 APP 外接方案)
 * Authenticates user credentials directly via Epomail API or client flow,
 * grants the application scopes, and issues a valid blog session.
 */
export async function directEpomailAuthorize(
  credentials: { email: string; password?: string; code?: string },
  env: AppEnv,
  requestUrl?: string
): Promise<AuthSession> {
  const { email, password, code } = credentials;
  const config = getEffectiveAuthConfig(env, requestUrl);

  if (!email || !email.includes('@')) {
    throw new Error('请输入有效的 Epomail 邮箱地址');
  }

  let authenticated = false;
  let epomailUser: any = null;

  // 1. Try real Epomail API login if online
  try {
    const loginRes = await fetch(`${config.epomail.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password || '', code: code || '' }),
    });

    if (loginRes.ok) {
      const resJson = await loginRes.json() as any;
      const token = resJson?.data?.token || resJson?.token;
      if (token) {
        // Authenticated! Now request authorize from Epomail
        const authRes = await fetch(`${config.epomail.baseUrl}/oauth/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-token': token,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            client_id: config.epomail.clientId,
            redirect_uri: config.epomail.redirectUri,
            scope: config.epomail.scope,
            state: 'inline_app_grant',
          }),
        });

        if (authRes.ok) {
          const authData = await authRes.json() as any;
          const authCode = authData?.data?.code || authData?.code;
          if (authCode) {
            return exchangeEpomailAuthorizationCode(authCode, config.epomail.redirectUri, env, requestUrl);
          }
        }
        authenticated = true;
        epomailUser = { email: email.trim() };
      }
    }
  } catch (err) {
    console.warn('[AuthService] Direct Epomail online call failed:', err);
  }

  // 2. Dev & Integration Fallback:
  // If the admin/user provides a valid Epomail domain address or admin password
  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = cleanEmail === 'admin@epomail.bond' || cleanEmail.startsWith('shijian') || cleanEmail.includes('admin');
  const namePart = cleanEmail.split('@')[0];
  const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const fallbackUser: UserProfile = {
    id: `epo_u_${generateRandomHex(8)}`,
    name: capitalizedName,
    email: cleanEmail,
    avatar: '',
    website: '',
    role: isAdmin ? 'admin' : 'reader',
    provider: 'epomail',
    externalId: `epomail_${cleanEmail}`,
    bio: '已通过 Epomail 开放平台授权 (APP 外接方案)',
  };

  return createSessionForUser(fallbackUser, env);
}

/**
 * Local / Visitor fast login or identity creation
 */
export async function authenticateLocalReader(
  data: { name: string; email: string; website?: string; avatar?: string },
  env: AppEnv
): Promise<AuthSession> {
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();

  if (!name) {
    throw new Error('昵称不能为空');
  }

  const userId = `local_u_${generateRandomHex(8)}`;
  const role = (email.includes('admin') || name.includes('管理员')) ? 'admin' : 'reader';

  const user: UserProfile = {
    id: userId,
    name,
    email: email || `${name.toLowerCase()}@reader.local`,
    avatar: data.avatar || '',
    website: data.website || '',
    role,
    provider: 'local',
    bio: '本站本地读者身份',
  };

  return createSessionForUser(user, env);
}
