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
// Authoritative Epomail Domain: Only mail.epocanvas.com is authorized to attest admin status
export const AUTHORITATIVE_EPOMAIL_DOMAIN = 'mail.epocanvas.com';
export const CANONICAL_ADMIN_EMAIL = 'admin@epomail.bond';

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

function decodeJwtPayload(jwt?: string): any {
  if (!jwt || typeof jwt !== 'string') return null;
  try {
    const parts = jwt.split('.');
    if (parts.length >= 2) {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      if (typeof atob === 'function') {
        return JSON.parse(atob(base64));
      }
      if (typeof Buffer !== 'undefined') {
        return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
      }
    }
  } catch {}
  return null;
}

/**
 * Validates whether the given base URL points to the authoritative Epomail server (mail.epocanvas.com).
 * Any third-party, self-hosted, or rogue Epomail instances are considered non-authoritative.
 */
export function isAuthoritativeEpomailServer(baseUrl: string, env: AppEnv): boolean {
  try {
    const url = new URL(baseUrl);
    const trustedHost = (env.EPOMAIL_AUTHORITATIVE_HOST || AUTHORITATIVE_EPOMAIL_DOMAIN).toLowerCase();
    return url.hostname.toLowerCase() === trustedHost;
  } catch {
    return false;
  }
}

/**
 * Strictly verifies whether an authenticated Epomail user qualifies for the 'admin' role.
 * Security Rules:
 * 1. The OAuth issuer MUST be the official mail.epocanvas.com instance (third-party instances NEVER get admin).
 * 2. If id_token has an 'iss' claim, it must match mail.epocanvas.com.
 * 3. The user must either have explicit server-attested admin privileges (is_admin: true or role: 'admin')
 *    from mail.epocanvas.com, OR match the configured canonical admin email (e.g. admin@epomail.bond).
 */
export function verifyEpomailAdminPrivilege(options: {
  baseUrl: string;
  userEmail: string;
  idClaims?: any;
  userInfo?: any;
  env: AppEnv;
}): boolean {
  // 1. MUST authenticate against the authoritative Epomail domain (mail.epocanvas.com)
  if (!isAuthoritativeEpomailServer(options.baseUrl, options.env)) {
    return false;
  }

  // 2. If id_token has an iss (issuer) claim, verify it points to the authoritative domain
  if (options.idClaims?.iss) {
    try {
      const issUrl = new URL(options.idClaims.iss);
      const trustedHost = (options.env.EPOMAIL_AUTHORITATIVE_HOST || AUTHORITATIVE_EPOMAIL_DOMAIN).toLowerCase();
      if (issUrl.hostname.toLowerCase() !== trustedHost) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const email = (options.userEmail || '').trim().toLowerCase();
  if (!email) return false;

  // 3. Cryptographically / server-attested admin flag from mail.epocanvas.com
  const hasServerAdminAttestation = Boolean(
    options.idClaims?.is_admin === true ||
    options.idClaims?.role === 'admin' ||
    options.userInfo?.is_admin === true ||
    options.userInfo?.role === 'admin'
  );

  // 4. Primary canonical admin email (default 'admin@epomail.bond', or custom env.ADMIN_EMAIL)
  const configuredAdminEmail = (options.env.ADMIN_EMAIL || CANONICAL_ADMIN_EMAIL).trim().toLowerCase();
  const isCanonicalAdmin = email === configuredAdminEmail;

  // Admin role is granted IF AND ONLY IF:
  // - The request is authenticated by authoritative mail.epocanvas.com
  // - AND (mail.epocanvas.com explicitly attests admin status OR it's the verified canonical admin email)
  return hasServerAdminAttestation || isCanonicalAdmin;
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

  // Security guard: Only epomail provider with verified authority can have 'admin' role.
  // Local readers or any other providers are strictly downgrade-guarded to 'reader'.
  let safeRole: 'admin' | 'reader' | 'visitor' = 'reader';
  if (user.provider === 'epomail' && user.role === 'admin') {
    safeRole = 'admin';
  } else if (user.role === 'visitor') {
    safeRole = 'visitor';
  }

  let finalUserId = user.id;

  // Save in DB if available
  const db = resolveActiveDb(env);
  if (db) {
    await ensureAuthTables(db);
    try {
      // 1. Check if user with this email already exists to preserve stable primary key ID
      const existing = await db
        .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
        .bind(user.email)
        .first<{ id: string }>();

      if (existing?.id) {
        finalUserId = existing.id;
      }

      // 2. Upsert user safely by email conflict
      await db
        .prepare(`
          INSERT INTO users (id, email, name, avatar, website, role, provider, external_id, bio, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            avatar = excluded.avatar,
            website = excluded.website,
            role = excluded.role,
            provider = excluded.provider,
            external_id = excluded.external_id,
            bio = excluded.bio,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(
          finalUserId,
          user.email,
          user.name,
          user.avatar || '',
          user.website || '',
          safeRole,
          user.provider || 'epomail',
          user.externalId || null,
          user.bio || ''
        )
        .run();

      // 3. Insert session
      const sessionId = `sess_${generateRandomHex(16)}`;
      await db
        .prepare(`
          INSERT INTO user_sessions (id, user_id, token, expires_at)
          VALUES (?, ?, ?, ?)
        `)
        .bind(sessionId, finalUserId, token, expiresAt)
        .run();
    } catch (err) {
      console.warn('[AuthService] DB session save failed, using memory store:', err);
    }
  }

  const finalUser: UserProfile = { ...user, id: finalUserId, role: safeRole };

  // Save in memory store
  memoryUsers.set(finalUser.id, finalUser);
  memorySessions.set(token, { userId: finalUser.id, expiresAt });

  return { token, user: finalUser, expiresAt };
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
          role: (row.role === 'admin' && row.provider === 'epomail') ? 'admin' : (row.role === 'visitor' ? 'visitor' : 'reader'),
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

export async function updateUserProfile(
  token: string,
  updates: { name?: string; avatar?: string; website?: string; bio?: string },
  env: AppEnv
): Promise<UserProfile> {
  const currentUser = await getUserBySessionToken(token, env);
  if (!currentUser) {
    throw new Error('未登录或会话已失效');
  }

  const updatedUser: UserProfile = {
    ...currentUser,
    name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : currentUser.name,
    avatar: updates.avatar !== undefined ? updates.avatar.trim() : currentUser.avatar,
    website: updates.website !== undefined ? updates.website.trim() : currentUser.website,
    bio: updates.bio !== undefined ? updates.bio.trim() : currentUser.bio,
  };

  // Update in memory
  memoryUsers.set(updatedUser.id, updatedUser);

  // Update in DB if available
  const db = resolveActiveDb(env);
  if (db) {
    try {
      await db.prepare(`
        UPDATE users
        SET name = ?, avatar = ?, website = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        updatedUser.name,
        updatedUser.avatar,
        updatedUser.website,
        updatedUser.bio || '',
        updatedUser.id
      ).run();
    } catch (err) {
      console.warn('[AuthService] DB updateUserProfile error:', err);
    }
  }

  return updatedUser;
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
  const cleanRedirectUri = (redirectUri || config.epomail.redirectUri || '').replace(/\/+$/, '');

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
        redirect_uri: cleanRedirectUri,
      }),
    });

    if (tokenRes.ok) {
      tokenData = await tokenRes.json();
      // 1. First parse id_token if present (OIDC standard)
      if (tokenData?.id_token) {
        const idClaims = decodeJwtPayload(tokenData.id_token);
        if (idClaims && (idClaims.email || idClaims.sub)) {
          userInfo = {
            sub: idClaims.sub,
            email: idClaims.email,
            name: idClaims.name || idClaims.preferred_username,
            picture: idClaims.picture || '',
            is_admin: idClaims.is_admin,
            role: idClaims.role,
            iss: idClaims.iss,
          };
        }
      }

      // 2. Fallback to userInfoUrl if id_token claims were missing or need enrichment
      if (tokenData?.access_token && (!userInfo || !userInfo.email || userInfo.is_admin === undefined)) {
        try {
          const userRes = await fetch(config.epomail.userInfoUrl, {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/json',
            },
          });
          if (userRes.ok) {
            const fetchedUser = await userRes.json();
            userInfo = {
              sub: fetchedUser.sub || userInfo?.sub,
              email: fetchedUser.email || userInfo?.email,
              name: fetchedUser.name || fetchedUser.preferred_username || userInfo?.name,
              picture: fetchedUser.picture || fetchedUser.avatar || userInfo?.picture || '',
              is_admin: fetchedUser.is_admin ?? userInfo?.is_admin,
              role: fetchedUser.role || userInfo?.role,
              iss: fetchedUser.iss || userInfo?.iss,
            };
          }
        } catch (e) {
          console.warn('[AuthService] UserInfo fetch warning:', e);
        }
      }
    } else {
      const errText = await tokenRes.text().catch(() => '');
      console.warn(`[AuthService] Epomail token exchange HTTP ${tokenRes.status}:`, errText);
    }
  } catch (err) {
    console.warn('[AuthService] Epomail online exchange network warning:', err);
  }

  // Fallback for local testing or simulated OAuth codes
  if (!userInfo) {
    const isDevMode = env.IS_DEV === 'true' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
    if (!isDevMode) {
      throw new Error('Epomail OAuth 认证失败：授权码无效或无法连接到认证服务器');
    }
    const fallbackId = `epomail_${code.substring(0, 12)}`;
    userInfo = {
      sub: fallbackId,
      email: 'user@epomail.bond',
      name: 'Epomail 用户',
      picture: '',
    };
  }

  const userEmail = (userInfo.email || `${userInfo.sub}@epomail.bond`).toLowerCase();
  const userName = userInfo.name || userInfo.preferred_username || userEmail.split('@')[0];

  const parsedIdClaims = tokenData?.id_token ? decodeJwtPayload(tokenData.id_token) : undefined;
  const isAdmin = verifyEpomailAdminPrivilege({
    baseUrl: config.epomail.baseUrl,
    userEmail,
    idClaims: parsedIdClaims || (userInfo.iss ? { iss: userInfo.iss, is_admin: userInfo.is_admin, role: userInfo.role } : undefined),
    userInfo,
    env,
  });
  const userRole: 'admin' | 'reader' = isAdmin ? 'admin' : 'reader';
  const deterministicId = userInfo.sub
    ? `epo_u_${userInfo.sub}`
    : `epo_u_${userEmail.replace(/[^a-z0-9]/g, '_')}`;

  const userProfile: UserProfile = {
    id: deterministicId,
    name: userName,
    email: userEmail,
    avatar: userInfo.picture || '',
    website: '',
    role: userRole,
    provider: 'epomail',
    externalId: String(userInfo.sub || ''),
    bio: isAdmin ? 'Epomail 认证站长 (Administrator)' : 'Epomail 认证身份',
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
  let onlineFailed = false;
  let onlineErrorMsg = '';

  try {
    const loginRes = await fetch(`${config.epomail.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password || '', code: code || '' }),
    }).catch(async () => {
      return fetch(`${config.epomail.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password || '', code: code || '' }),
      });
    });

    if (loginRes.ok) {
      const resJson = (await loginRes.json()) as any;
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
          const authData = (await authRes.json()) as any;
          const authCode = authData?.data?.code || authData?.code;
          if (authCode) {
            return exchangeEpomailAuthorizationCode(authCode, config.epomail.redirectUri, env, requestUrl);
          }
        }
        authenticated = true;
        epomailUser = { email: email.trim() };
      } else if (resJson?.code !== 0 && (resJson?.message || resJson?.error)) {
        onlineFailed = true;
        onlineErrorMsg = resJson.message || resJson.error;
      }
    } else {
      onlineFailed = true;
      const errBody = (await loginRes.json().catch(() => null)) as any;
      onlineErrorMsg = errBody?.message || errBody?.error || `HTTP ${loginRes.status}`;
    }
  } catch (err) {
    console.warn('[AuthService] Direct Epomail online call failed:', err);
  }

  const isDevMode = env.IS_DEV === 'true' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

  if (onlineFailed && !isDevMode) {
    throw new Error(`Epomail 授权失败: ${onlineErrorMsg || '邮箱或密码错误'}`);
  }

  // 2. Dev & Integration Fallback (Strictly confined to dev/test environments):
  if (!isDevMode) {
    throw new Error('无法连接到 Epomail 认证服务器，请使用 Epomail OAuth 网页授权登录');
  }

  const cleanEmail = email.trim().toLowerCase();
  const isAuthoritative = isAuthoritativeEpomailServer(config.epomail.baseUrl, env);
  const configuredAdminEmail = (env.ADMIN_EMAIL || CANONICAL_ADMIN_EMAIL).trim().toLowerCase();
  const isAdmin = isAuthoritative && cleanEmail === configuredAdminEmail;

  const namePart = cleanEmail.split('@')[0];
  const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const deterministicId = `epo_u_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  const fallbackUser: UserProfile = {
    id: deterministicId,
    name: capitalizedName,
    email: cleanEmail,
    avatar: '',
    website: '',
    role: isAdmin ? 'admin' : 'reader',
    provider: 'epomail',
    externalId: `epomail_${cleanEmail}`,
    bio: isAdmin ? 'Epomail 认证站长 (APP 外接方案)' : '已通过 Epomail 开放平台授权 (APP 外接方案)',
  };

  return createSessionForUser(fallbackUser, env);
}

/**
 * Local / Visitor fast login or identity creation
 * Note: Local readers are STRICTLY confined to the 'reader' role.
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

  const userId = `local_u_${email ? email.replace(/[^a-z0-9]/g, '_') : generateRandomHex(8)}`;
  // Local readers can NEVER possess the admin role!
  const role: 'reader' = 'reader';

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

export interface UserLevelInfo {
  email: string;
  level: number;
  levelCode: 'lv0' | 'lv1' | 'lv2' | 'lv3';
  levelName: string;
  badge: string;
  mappedEpomailRole: 'user_lv0' | 'user_lv1' | 'user_base';
  epomailRoleName: string;
  stats: {
    registeredDays: number;
    commentCount: number;
    likesReceived: number;
    readingMinutes: number;
    articlesRead: number;
  };
  benefits: {
    epomailStorageQuotaMb: number;
    epomailDailySendLimit: number;
    epomailAllowAttachment: boolean;
    description: string;
  };
  nextLevelHint: string;
  allTiers: Array<{
    level: number;
    levelName: string;
    badge: string;
    requirements: string;
    benefits: string;
    achieved: boolean;
  }>;
}

export async function calculateUserLevel(email: string, env: AppEnv): Promise<UserLevelInfo> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const db = resolveActiveDb(env);

  let registeredDays = 0;
  let commentCount = 0;
  let likesReceived = 0;

  if (db) {
    try {
      await ensureAuthTables(db);
      const userRow = await db
        .prepare('SELECT created_at FROM users WHERE email = ? LIMIT 1')
        .bind(cleanEmail)
        .first<{ created_at: string }>();

      if (userRow?.created_at) {
        const createdAtTime = new Date(userRow.created_at).getTime();
        if (!isNaN(createdAtTime)) {
          registeredDays = Math.max(0, Math.floor((Date.now() - createdAtTime) / (1000 * 3600 * 24)));
        }
      }

      const commentStats = await db
        .prepare(`
          SELECT COUNT(*) as total_comments, COALESCE(SUM(likes_count), 0) as total_likes 
          FROM comments 
          WHERE author_email = ? AND status != 'deleted'
        `)
        .bind(cleanEmail)
        .first<{ total_comments: number; total_likes: number }>();

      if (commentStats) {
        commentCount = Number(commentStats.total_comments || 0);
        likesReceived = Number(commentStats.total_likes || 0);
      }
    } catch (e) {
      console.warn('[calculateUserLevel] DB stats query warning:', e);
    }
  }

  const readingMinutes = Math.min(9999, registeredDays * 5 + commentCount * 15 + likesReceived * 2);
  const articlesRead = Math.min(999, Math.floor(registeredDays * 0.8 + commentCount * 2 + 1));

  let level = 0;
  let levelCode: 'lv0' | 'lv1' | 'lv2' | 'lv3' = 'lv0';
  let levelName = '认证书友';
  let badge = 'LV.0 认证书友';
  let mappedEpomailRole: 'user_lv0' | 'user_lv1' | 'user_base' = 'user_lv0';
  let epomailRoleName = '普通用户 LV.0';
  let nextLevelHint = '加入 10 天并在博客发表 3 条讨论评论，即可晋升 LV.1 并解锁 EpoMail 附件发送！';

  if (registeredDays >= 180 && likesReceived >= 100) {
    level = 3;
    levelCode = 'lv3';
    levelName = '终身学者';
    badge = 'LV.3 终身学者';
    mappedEpomailRole = 'user_lv1';
    epomailRoleName = '普通用户 LV.3 (至尊书友)';
    nextLevelHint = '恭喜！已达成最高荣誉学者等级！';
  } else if (registeredDays >= 90 && (likesReceived >= 30 || commentCount >= 20)) {
    level = 2;
    levelCode = 'lv2';
    levelName = '资深贡献者';
    badge = 'LV.2 资深贡献者';
    mappedEpomailRole = 'user_lv1';
    epomailRoleName = '普通用户 LV.2 (核心书友)';
    nextLevelHint = `距 LV.3 还需注册满 180 天 (当前 ${registeredDays} 天) 且累计获赞 100 个 (当前 ${likesReceived} 赞)`;
  } else if (registeredDays >= 10 && (commentCount >= 3 || (articlesRead >= 10 && readingMinutes >= 100))) {
    level = 1;
    levelCode = 'lv1';
    levelName = '活跃学者';
    badge = 'LV.1 活跃学者';
    mappedEpomailRole = 'user_lv1';
    epomailRoleName = '普通用户 LV.1';
    nextLevelHint = `距 LV.2 还需注册满 90 天 (当前 ${registeredDays} 天) 且累计获赞 30 个 (当前 ${likesReceived} 赞)`;
  }

  const epomailStorageQuotaMb = level >= 1 ? 25 : 10;
  const epomailDailySendLimit = level >= 1 ? 10 : 8;
  const epomailAllowAttachment = level >= 1;

  const allTiers = [
    {
      level: 0,
      levelName: '认证书友 (LV.0)',
      badge: 'LV.0 认证书友',
      requirements: '注册并绑定 blog.epomail.com 账号',
      benefits: 'EpoMail 10MB 配额，每日 8 封邮件，纯文本极速收发',
      achieved: true,
    },
    {
      level: 1,
      levelName: '活跃学者 (LV.1)',
      badge: 'LV.1 活跃学者',
      requirements: '注册满 10 天，发表 3 条有效讨论评论或累计阅读 100 分钟',
      benefits: 'EpoMail 25MB 配额，每日 10 封发信，解锁附件发送权限',
      achieved: level >= 1,
    },
    {
      level: 2,
      levelName: '资深贡献者 (LV.2)',
      badge: 'LV.2 资深贡献者',
      requirements: '注册满 90 天，获得 30 个点赞或发表 20 条优质讨论',
      benefits: 'EpoMail 50MB 配额，每日 20 封发信，支持大附件与优先通道',
      achieved: level >= 2,
    },
    {
      level: 3,
      levelName: '终身学者 (LV.3)',
      badge: 'LV.3 终身学者',
      requirements: '注册满 180 天，累计获得 100 个点赞',
      benefits: 'EpoMail 100MB 配额，每日 50 封发信，全功能至尊特权',
      achieved: level >= 3,
    },
  ];

  return {
    email: cleanEmail,
    level,
    levelCode,
    levelName,
    badge,
    mappedEpomailRole,
    epomailRoleName,
    stats: {
      registeredDays,
      commentCount,
      likesReceived,
      readingMinutes,
      articlesRead,
    },
    benefits: {
      epomailStorageQuotaMb,
      epomailDailySendLimit,
      epomailAllowAttachment,
      description: epomailAllowAttachment
        ? `${epomailStorageQuotaMb}MB 存储空间，每日 ${epomailDailySendLimit} 封发件，解锁附件发送能力`
        : `${epomailStorageQuotaMb}MB 存储空间，每日 ${epomailDailySendLimit} 封发件，仅纯文本`,
    },
    nextLevelHint,
    allTiers,
  };
}

