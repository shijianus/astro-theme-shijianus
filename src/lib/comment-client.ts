export type CommentRole = 'reader' | 'admin' | 'visitor';
export type CommentStatus = 'published' | 'pinned' | 'flagged' | 'deleted' | 'limited';
export type PostType = 'comment' | 'boost' | 'emoji';

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
  bio?: string;
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
export async function fetchComments(slug: string, sort: 'hot' | 'new' = 'new'): Promise<BlogComment[]> {
  try {
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}&sort=${sort}`);
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
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.sessionToken ? { 'X-Comment-Session-Token': params.sessionToken } : {}),
      },
      body: JSON.stringify({
        action: 'create',
        slug: params.slug,
        message: params.message,
        postType: params.postType || 'comment',
        parentId: params.parentId || undefined,
        quoteId: params.quoteId || undefined,
        quote: params.quote || undefined,
        sessionToken: params.sessionToken,
        showLocation: params.showLocation,
        authorId: params.author?.id,
        authorName: params.author?.name || '访客',
        authorEmail: params.author?.email || '',
        authorAvatar: params.author?.avatar || '',
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

