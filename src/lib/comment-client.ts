export type CommentRole = 'reader' | 'admin';
export type CommentStatus = 'published' | 'pinned' | 'limited';

export type CommentIdentity = {
  id: string;
  name: string;
  email: string;
  website: string;
  avatar: string;
  role: CommentRole;
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

export function readCommentIdentity() {
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

export function createDemoLocalThread(slug: string): StoredComment[] {
  const admin = createPresetCommentIdentity('admin');
  const reader = createPresetCommentIdentity('reader');
  const observerId = 'shijianus-local-observer';
  const now = Date.now();

  return [
    {
      id: `demo-root-${slug}-reader`,
      authorId: reader.id,
      name: reader.name,
      email: reader.email,
      website: reader.website,
      avatar: '',
      message: '先用管理员账号测试一遍实际流程会更稳，尤其是置顶、限制、编辑、删除和追评这些管理动作。',
      createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
      likes: [admin.id],
      status: 'published',
    },
    {
      id: `demo-root-${slug}-observer`,
      authorId: observerId,
      name: '布局观察者',
      email: 'observer@local.shijianus.test',
      website: '',
      avatar: '',
      message: '我更关心移动端排版，特别是评论区、文章头图和侧栏在手机上的折叠是否自然。',
      createdAt: new Date(now - 1000 * 60 * 24).toISOString(),
      likes: [],
      status: 'published',
    },
    {
      id: `demo-reply-${slug}-observer`,
      authorId: observerId,
      name: '布局观察者',
      email: 'observer@local.shijianus.test',
      website: '',
      avatar: '',
      message: '@站点读者 同意。建议先载入演示评论，再切换管理员账号验证整套交互是否顺手。',
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      parentId: `demo-root-${slug}-reader`,
      quoteId: `demo-root-${slug}-reader`,
      likes: [],
      status: 'published',
    },
  ];
}

export function readLocalThread(slug: string) {
  try {
    const parsed = safeParse<StoredComment[]>(window.localStorage.getItem(`${COMMENT_THREAD_PREFIX}${slug}`));
    return Array.isArray(parsed) ? parsed.map(normaliseComment).filter(Boolean) as StoredComment[] : [];
  } catch {
    return [];
  }
}

export function readAllLocalThreads() {
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
  return name.trim().slice(0, 1).toUpperCase() || 'U';
}
