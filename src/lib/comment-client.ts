export type CommentRole = 'reader' | 'admin' | 'visitor';
export type CommentStatus = 'published' | 'pinned' | 'flagged' | 'deleted' | 'limited';
export type PostType = 'comment' | 'boost' | 'emoji';

export { resolveGeoInfo, getFlagEmoji, type GeoItemInfo } from './geo-names';

export type CommentIdentity = {
  id: string;
  name: string;
  email: string;
  website: string;
  avatar: string;
  role: CommentRole;
  provider?: 'epomail' | 'local' | 'visitor';
  token?: string;
  epomailUserId?: string | number;
  epomailAvatar?: string;
  bio?: string;
  timezone?: string;
  location?: string;
  showLocation?: boolean;
};

export type CommentQuote = {
  id: string;
  authorName: string;
  text: string;
};

export type BlogComment = {
  id: string;
  postSlug: string;
  parentId?: string | null;
  quoteId?: string | null;
  quote?: CommentQuote | null;
  postType: PostType;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  authorWebsite?: string;
  authorRole: 'admin' | 'reader' | 'visitor';
  message: string;
  likesCount: number;
  reactions?: {
    summary: Record<string, number>;
    users: Record<string, string>;
  };
  status: 'published' | 'pinned' | 'flagged' | 'deleted';
  createdAt: string;
  updatedAt?: string;
  showLocation: boolean;
  ipCountry?: string | null;
  ipCountryName?: string | null;
  ipCountryFlag?: string | null;
  ipLocation?: string | null;
  ip?: string;
};

export type StoredComment = {
  id: string;
  authorId: string;
  name: string;
  email: string;
  website: string;
  avatar?: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  quoteId?: string;
  likes: string[];
  status: CommentStatus;
  slug?: string;
};

export const COMMENT_ACCOUNT_KEY = 'shijianus-comment-account';
export const COMMENT_ACCOUNT_LEGACY_KEY = 'shijianus-comment-identity';
export const COMMENT_THREAD_PREFIX = 'shijianus-comments:';

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function safeFetchJson<T>(res: Response): Promise<{ ok: boolean; data?: T; error?: string }> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (res.status === 404) {
      return {
        ok: false,
        error: '评论接口不存在或服务未就绪 (404 Not Found)，请确认本地开发环境正常运行',
      };
    }
    return {
      ok: false,
      error: `API 响应非 JSON 格式 (${res.status}): ${text.slice(0, 80)}`,
    };
  }
  try {
    const json = await res.json();
    return { ok: res.ok, data: json };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'JSON 解析失败' };
  }
}

export function createCommentId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normaliseWebsite(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function normaliseAvatar(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return '';
}

export function normaliseComment(
  value: Partial<StoredComment> & { id?: string; name?: string; message?: string; createdAt?: string },
) {
  if (!value.id || !value.name || !value.message || !value.createdAt) return null;

  return {
    id: value.id,
    authorId: value.authorId || `legacy-${value.email || value.name}`,
    name: value.name,
    email: value.email || '',
    website: value.website || '',
    avatar: value.avatar || '',
    message: value.message,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    parentId: value.parentId,
    quoteId: value.quoteId,
    likes: Array.isArray(value.likes) ? value.likes : [],
    status: value.status || 'published',
    slug: value.slug,
  } satisfies StoredComment;
}

export function readCommentIdentity(): CommentIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const next = safeParse<CommentIdentity>(window.localStorage.getItem(COMMENT_ACCOUNT_KEY));
    if (next) return next;

    const legacy = safeParse<CommentIdentity>(window.localStorage.getItem(COMMENT_ACCOUNT_LEGACY_KEY));
    if (!legacy) return null;

    const upgraded = {
      ...legacy,
      avatar: legacy.avatar ?? '',
    } satisfies CommentIdentity;

    writeCommentIdentity(upgraded);
    return upgraded;
  } catch {
    return null;
  }
}

export function writeCommentIdentity(identity: CommentIdentity | null) {
  if (typeof window === 'undefined') return;
  try {
    if (identity) {
      const payload = JSON.stringify(identity);
      window.localStorage.setItem(COMMENT_ACCOUNT_KEY, payload);
      window.localStorage.setItem(COMMENT_ACCOUNT_LEGACY_KEY, payload);
    } else {
      window.localStorage.removeItem(COMMENT_ACCOUNT_KEY);
      window.localStorage.removeItem(COMMENT_ACCOUNT_LEGACY_KEY);
    }
  } catch {}

  window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: identity }));
}

export function createPresetCommentIdentity(role: CommentRole): CommentIdentity {
  const isAdmin = role === 'admin';

  return {
    id: isAdmin ? 'shijianus-local-admin' : 'shijianus-local-reader',
    name: isAdmin ? '站点管理员' : '站点读者',
    email: isAdmin ? 'admin@local.shijianus.test' : 'reader@local.shijianus.test',
    website: isAdmin ? 'https://github.com/shijianus' : '',
    avatar: '',
    role,
  };
}

export function readLocalThread(slug: string): StoredComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = safeParse<StoredComment[]>(window.localStorage.getItem(`${COMMENT_THREAD_PREFIX}${slug}`));
    return Array.isArray(parsed) ? (parsed.map(normaliseComment).filter(Boolean) as StoredComment[]) : [];
  } catch {
    return [];
  }
}

export function readAllLocalThreads(): (StoredComment & { slug: string })[] {
  if (typeof window === 'undefined') return [];
  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(COMMENT_THREAD_PREFIX))
      .flatMap((key) => {
        const slug = key.slice(COMMENT_THREAD_PREFIX.length);
        return readLocalThread(slug).map((comment) => ({
          ...comment,
          slug,
        }));
      });
  } catch {
    return [];
  }
}

export function getCommentInitials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '访';
}

// ----------------------------------------------------
// Real API Client Methods for Cloudflare D1 Backend
// ----------------------------------------------------
export async function fetchComments(
  slug: string,
  sort: 'hot' | 'new' = 'new',
  auth?: { token?: string; adminToken?: string }
): Promise<BlogComment[]> {
  try {
    const headers: Record<string, string> = {};
    if (auth?.adminToken) {
      headers['X-Admin-Token'] = auth.adminToken;
    }
    if (auth?.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
      headers['X-Comment-Session-Token'] = auth.token;
    }
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}&sort=${sort}`, {
      headers,
    });
    const result = await safeFetchJson<{ ok: boolean; comments: BlogComment[] }>(res);
    if (result.ok && result.data && Array.isArray(result.data.comments)) {
      return result.data.comments;
    }
    return [];
  } catch (err) {
    console.warn('[CommentClient] Failed to fetch comments:', err);
    return [];
  }
}

export async function createComment(params: {
  slug: string;
  message: string;
  postType?: PostType;
  parentId?: string | null;
  quoteId?: string | null;
  quote?: CommentQuote | null;
  sessionToken?: string;
  showLocation?: boolean;
  author?: CommentIdentity | null;
}): Promise<{ ok: boolean; comment?: BlogComment; sessionToken?: string; error?: string }> {
  try {
    const effectiveToken = params.sessionToken || params.author?.token;
    const effectiveShowLocation =
      params.showLocation !== undefined
        ? params.showLocation
        : params.author?.showLocation !== false;

    // Fallback avatar for admin if missing
    let effectiveAvatar = params.author?.avatar || '';
    if (!effectiveAvatar && params.author?.role === 'admin') {
      effectiveAvatar = '/media/shijianus/avatar.jpg';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (effectiveToken) {
      headers['X-Comment-Session-Token'] = effectiveToken;
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'create',
        slug: params.slug,
        message: params.message,
        postType: params.postType || 'comment',
        parentId: params.parentId || undefined,
        quoteId: params.quoteId || undefined,
        quote: params.quote || undefined,
        sessionToken: effectiveToken,
        showLocation: effectiveShowLocation,
        authorId: params.author?.id,
        authorName: params.author?.name || (params.author?.role === 'admin' ? 'shijianus' : '访客'),
        authorEmail: params.author?.email || '',
        authorAvatar: effectiveAvatar,
        authorWebsite: params.author?.website || '',
        authorRole: params.author?.role || 'visitor',
      }),
    });

    const parsed = await safeFetchJson<{ ok: boolean; comment?: BlogComment; sessionToken?: string; error?: string }>(res);
    if (!parsed.ok || !parsed.data) {
      return { ok: false, error: parsed.error || (parsed.data as any)?.error || `请求失败 (${res.status})` };
    }
    return parsed.data;
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接失败' };
  }
}

export async function editComment(params: {
  id: string;
  message: string;
  sessionToken: string;
  adminToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.sessionToken ? { 'X-Comment-Session-Token': params.sessionToken } : {}),
        ...(params.adminToken ? { 'X-Admin-Token': params.adminToken } : {}),
      },
      body: JSON.stringify({
        action: 'edit',
        id: params.id,
        message: params.message,
        sessionToken: params.sessionToken,
        adminToken: params.adminToken,
      }),
    });

    const parsed = await safeFetchJson<{ ok: boolean; error?: string; message?: string }>(res);
    if (!parsed.ok || !parsed.data) {
      return { ok: false, error: parsed.error || (parsed.data as any)?.error || `修改失败 (${res.status})` };
    }
    return parsed.data;
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接失败' };
  }
}

export async function deleteComment(params: {
  id: string;
  sessionToken: string;
  adminToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.sessionToken ? { 'X-Comment-Session-Token': params.sessionToken } : {}),
        ...(params.adminToken ? { 'X-Admin-Token': params.adminToken } : {}),
      },
      body: JSON.stringify({
        action: 'delete',
        id: params.id,
        sessionToken: params.sessionToken,
        adminToken: params.adminToken,
      }),
    });

    const parsed = await safeFetchJson<{ ok: boolean; error?: string; message?: string }>(res);
    if (!parsed.ok || !parsed.data) {
      return { ok: false, error: parsed.error || (parsed.data as any)?.error || `删除失败 (${res.status})` };
    }
    return parsed.data;
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接失败' };
  }
}

export async function likeComment(params: {
  id: string;
  emoji?: string;
  author?: CommentIdentity | null;
}): Promise<{
  ok: boolean;
  likesCount?: number;
  reactions?: { summary: Record<string, number>; users: Record<string, string> };
  userReaction?: string | null;
  error?: string;
}> {
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'like',
        id: params.id,
        emoji: params.emoji || '👍',
        authorId: params.author?.id,
        authorRole: params.author?.role || 'visitor',
      }),
    });
    const parsed = await safeFetchJson<{
      ok: boolean;
      likesCount?: number;
      reactions?: { summary: Record<string, number>; users: Record<string, string> };
      userReaction?: string | null;
      error?: string;
    }>(res);
    if (!parsed.ok || !parsed.data) {
      return { ok: false, error: parsed.error || (parsed.data as any)?.error || `请求失败 (${res.status})` };
    }
    return parsed.data;
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接失败' };
  }
}

export interface PublicAuthConfig {
  ok: boolean;
  mode: 'outsourced_epomail' | 'dual_db' | 'single_db';
  providers: string[];
  epomail: {
    baseUrl: string;
    clientId: string;
    authorizeUrl: string;
    redirectUri: string;
    scope: string;
  };
  adminApp: {
    appName: string;
    appLogo: string;
    description: string;
    scopes: string[];
  };
}

export async function fetchAuthConfig(): Promise<PublicAuthConfig | null> {
  try {
    const res = await fetch('/api/auth/config');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function exchangeEpomailCode(
  code: string,
  redirectUri?: string
): Promise<{ ok: boolean; user?: CommentIdentity; token?: string; error?: string }> {
  try {
    const defaultRedirect = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';
    const cleanRedirectUri = (redirectUri || defaultRedirect).replace(/\/+$/, '');
    const res = await fetch('/api/auth/epomail/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: cleanRedirectUri }),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.ok || !data.user) {
      return { ok: false, error: data?.error || 'OAuth 授权码交换失败' };
    }
    const token = data.token || '';
    const epomailAvatar = data.user.avatar || '';
    const identity: CommentIdentity = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.avatar || '',
      website: data.user.website || '',
      role: data.user.role || 'reader',
      provider: 'epomail',
      token,
      epomailUserId: data.user.externalId || data.user.id,
      epomailAvatar,
      bio: data.user.bio,
    };
    writeCommentIdentity(identity);
    if (token && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('shijianus-auth-token', token);
      } catch {}
    }
    return { ok: true, user: identity, token };
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络通信异常' };
  }
}

export async function directEpomailLogin(credentials: {
  email: string;
  password?: string;
  code?: string;
}): Promise<{ ok: boolean; user?: CommentIdentity; error?: string }> {
  try {
    const res = await fetch('/api/auth/epomail/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.ok || !data.user) {
      return { ok: false, error: data?.error || 'Epomail 授权验证失败' };
    }
    const epomailAvatar = data.user.avatar || '';
    const identity: CommentIdentity = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.avatar || '',
      website: data.user.website || '',
      role: data.user.role || 'reader',
      provider: 'epomail',
      token: data.token,
      epomailUserId: data.user.externalId,
      epomailAvatar,
      bio: data.user.bio,
    };
    writeCommentIdentity(identity);
    return { ok: true, user: identity };
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接异常' };
  }
}

export async function loginLocalReader(data: {
  name: string;
  email: string;
  website?: string;
  avatar?: string;
}): Promise<{ ok: boolean; user?: CommentIdentity; error?: string }> {
  try {
    const res = await fetch('/api/auth/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = (await res.json()) as any;
    if (!resData.ok || !resData.user) {
      return { ok: false, error: resData?.error || '创建本地身份失败' };
    }
    const identity: CommentIdentity = {
      id: resData.user.id,
      name: resData.user.name,
      email: resData.user.email,
      avatar: resData.user.avatar || '',
      website: resData.user.website || '',
      role: resData.user.role || 'reader',
      provider: 'local',
      token: resData.token,
    };
    writeCommentIdentity(identity);
    return { ok: true, user: identity };
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接异常' };
  }
}

export async function logoutAuthAccount(token?: string): Promise<boolean> {
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token }),
      });
    }
  } catch {}
  writeCommentIdentity(null);
  return true;
}

export async function uploadCommentImage(file: File): Promise<{
  ok: boolean;
  url?: string;
  id?: string;
  name?: string;
  size?: number;
  type?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    const result = await safeFetchJson<{
      ok: boolean;
      url: string;
      id?: string;
      name?: string;
      size?: number;
      type?: string;
      error?: string;
    }>(res);

    if (!result.ok || !result.data?.ok || !result.data.url) {
      return { ok: false, error: result.data?.error || result.error || '图片上传失败' };
    }

    return {
      ok: true,
      url: result.data.url,
      id: result.data.id,
      name: result.data.name,
      size: result.data.size,
      type: result.data.type,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || '网络连接超时或图片上传异常' };
  }
}

export async function updateAuthProfile(updates: {
  avatar?: string;
  name?: string;
  website?: string;
  bio?: string;
  timezone?: string;
  location?: string;
  showLocation?: boolean;
}): Promise<{ ok: boolean; user?: CommentIdentity; error?: string }> {
  try {
    const current = readCommentIdentity();
    const token = current?.token || (typeof window !== 'undefined' ? window.localStorage.getItem('shijianus-auth-token') : '');

    let updatedIdentity: CommentIdentity | null = null;

    if (token) {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        const data = (await res.json()) as any;
        if (res.ok && data.ok && data.user) {
          updatedIdentity = {
            ...current!,
            name: data.user.name ?? current?.name ?? '',
            avatar: data.user.avatar ?? current?.avatar ?? '',
            website: data.user.website ?? current?.website ?? '',
            bio: data.user.bio ?? current?.bio ?? '',
            timezone: updates.timezone !== undefined ? updates.timezone : (data.user.timezone ?? current?.timezone ?? ''),
            location: updates.location !== undefined ? updates.location : (data.user.location ?? current?.location ?? ''),
            showLocation: updates.showLocation !== undefined ? updates.showLocation : (current?.showLocation ?? true),
            token,
          };
        }
      } catch (err) {
        console.warn('[CommentClient] Server profile update failed, falling back to local:', err);
      }
    }

    if (!updatedIdentity && current) {
      updatedIdentity = {
        ...current,
        name: updates.name !== undefined ? updates.name : current.name,
        avatar: updates.avatar !== undefined ? updates.avatar : current.avatar,
        website: updates.website !== undefined ? updates.website : current.website,
        bio: updates.bio !== undefined ? updates.bio : current.bio,
        timezone: updates.timezone !== undefined ? updates.timezone : current.timezone,
        location: updates.location !== undefined ? updates.location : current.location,
        showLocation: updates.showLocation !== undefined ? updates.showLocation : (current.showLocation ?? true),
      };
    }

    if (updatedIdentity) {
      writeCommentIdentity(updatedIdentity);
      return { ok: true, user: updatedIdentity };
    }

    return { ok: false, error: '未找到有效登录会话' };
  } catch (err: any) {
    return { ok: false, error: err?.message || '更新个人资料失败' };
  }
}

export type UserInteractionNotification = {
  id: string;
  type: 'reply' | 'like' | 'boost' | 'quote';
  title: string;
  actorName: string;
  actorAvatar?: string;
  actorRole?: 'admin' | 'reader' | 'visitor';
  message: string;
  postSlug: string;
  commentId: string;
  createdAt: string;
  parentMessage?: string;
};

export async function fetchUserFeed(params: {
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  sessionToken?: string;
}): Promise<{
  ok: boolean;
  userComments: BlogComment[];
  notifications: UserInteractionNotification[];
  error?: string;
}> {
  try {
    const query = new URLSearchParams();
    query.set('action', 'user_feed');
    if (params.authorId) query.set('author_id', params.authorId);
    if (params.authorName) query.set('author_name', params.authorName);
    if (params.authorEmail) query.set('email', params.authorEmail);
    if (params.sessionToken) query.set('session_token', params.sessionToken);

    const headers: Record<string, string> = {};
    if (params.sessionToken) {
      headers['X-Comment-Session-Token'] = params.sessionToken;
    }

    const res = await fetch(`/api/comments?${query.toString()}`, { headers });
    const result = await safeFetchJson<{
      ok: boolean;
      userComments?: BlogComment[];
      notifications?: UserInteractionNotification[];
      error?: string;
    }>(res);

    if (result.ok && result.data) {
      return {
        ok: true,
        userComments: Array.isArray(result.data.userComments) ? result.data.userComments : [],
        notifications: Array.isArray(result.data.notifications) ? result.data.notifications : [],
      };
    }
    return { ok: false, userComments: [], notifications: [], error: result.error };
  } catch (err: any) {
    console.warn('[CommentClient] fetchUserFeed network error:', err);
    return { ok: false, userComments: [], notifications: [], error: err?.message };
  }
}

export const USER_PREFERENCES_KEY = 'shijianus-user-preferences';

export interface UserPreferences {
  broadcastNotify: boolean;
  personalNotify: boolean;
  defaultCommentSort: 'new' | 'hot';
  showLocation: boolean;
  collapseReplies: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  broadcastNotify: true,
  personalNotify: true,
  defaultCommentSort: 'new',
  showLocation: true,
  collapseReplies: true,
  soundEffects: true,
  reducedMotion: false,
};

export function readUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_USER_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(USER_PREFERENCES_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_USER_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const next = { ...readUserPreferences(), ...prefs };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('shijianus:preferences-change', { detail: next }));
    } catch {}
  }
  return next;
}

