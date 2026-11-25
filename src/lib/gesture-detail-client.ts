import { gestureTimestamp } from './gesture-text';
import { readCommentIdentity, type CommentIdentity } from './comment-client';

export interface ReactionDetailItem {
  emoji: string;
  count: number;
  users: Array<{ name: string; avatar?: string }>;
}

export interface GestureQuote {
  id: string;
  floorIndex?: number;
  authorName: string;
  authorAvatar?: string;
  excerpt: string;
  fullMessage?: string;
}

export interface GestureNode {
  id: string;
  postSlug: string;
  parentId?: string | null;
  replyToId?: string | null;
  quoteId?: string | null;
  quote?: GestureQuote | null;
  postType: 'gesture' | 'comment' | 'boost' | 'emoji';
  tag?: string;
  title?: string | null;
  tags?: string[];
  editCount?: number;
  viewsCount?: number;
  canManage?: boolean;
  levelLabel?: string;
  floorIndex?: number;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorWebsite?: string;
  authorRole: 'admin' | 'reader' | 'visitor';
  message: string;
  likesCount: number;
  reactions?: {
    summary: Record<string, number>;
    users: Record<string, string>;
    details?: ReactionDetailItem[];
  };
  status: 'published' | 'pinned' | 'flagged' | 'deleted';
  createdAt: string;
  updatedAt?: string;
}

export interface GestureBoost {
  id: string;
  gestureId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface GestureRelatedLink {
  id?: string;
  title: string;
  url: string;
  replyCount?: number;
  clickKey?: string;
  clickCount?: number;
  kind?: 'gesture' | 'site' | 'external';
  type: 'external' | 'gesture';
}

export interface GestureParticipant {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  count: number;
}

export interface GestureTopicMap {
  viewsCount: number;
  likesCount: number;
  linksCount: number;
  usersCount: number;
  participants: GestureParticipant[];
  estimatedReadMinutes: number;
  latestReplyAt: string;
}

export interface GestureDetailResponse {
  ok: boolean;
  gesture?: GestureNode;
  subGestures?: GestureNode[];
  boostsByGestureId?: Record<string, GestureBoost[]>;
  relatedLinks?: GestureRelatedLink[];
  topicMap?: GestureTopicMap;
  legacyFloorIds?: string[];
  subscribed?: boolean;
  error?: string;
}

const VISITOR_SESSION_KEY = 'shijianus_gesture_visitor_session';

export function getOrCreateGestureSessionToken(): string {
  const identity = readCommentIdentity();
  if (identity?.token) return identity.token;
  if (typeof window === 'undefined') return '';
  try {
    let token = window.sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!token) {
      token = `vst_${crypto.randomUUID()}`;
      window.sessionStorage.setItem(VISITOR_SESSION_KEY, token);
    }
    return token;
  } catch {
    return '';
  }
}

function buildAuthHeaders(identity?: CommentIdentity | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = identity?.token || getOrCreateGestureSessionToken();
  if (token) {
    headers['X-Comment-Session-Token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchGestureDetail(id: string, trackView = true): Promise<GestureDetailResponse> {
  const token = getOrCreateGestureSessionToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['X-Comment-Session-Token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/gestures?id=${encodeURIComponent(id)}&trackView=${trackView ? 1 : 0}`, { headers });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { ok: false, error: `HTTP ${res.status}` };
  }
  return (await res.json()) as GestureDetailResponse;
}

export async function recordGestureLinkClick(rootId: string, linkKey: string): Promise<number | undefined> {
  try {
    const response = await fetch('/api/gestures', {
      method: 'POST',
      headers: buildAuthHeaders(readCommentIdentity()),
      keepalive: true,
      body: JSON.stringify({ action: 'link_click', rootId, linkKey }),
    });
    if (!response.ok) return;
    const result = await response.json();
    return result.ok ? result.clickCount : undefined;
  } catch { /* Navigation must still work when click recording is unavailable. */ }
}

export async function replyToGesture(params: {
  rootId: string;
  replyToId?: string | null;
  message: string;
  tag?: string;
  quoteId?: string | null;
  quote?: GestureQuote | null;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; subGesture?: GestureNode; sessionToken?: string; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'reply',
      rootId: params.rootId,
      replyToId: params.replyToId || params.rootId,
      message: params.message,
      tag: params.tag || 'general',
      quoteId: params.quoteId || null,
      quote: params.quote || null,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
      authorId: params.identity?.id,
      authorName: params.identity?.name,
      authorAvatar: params.identity?.avatar,
      authorWebsite: params.identity?.website,
    }),
  });
  return (await res.json()) as any;
}

export async function createScopedBoost(params: {
  gestureId: string;
  content: string;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; boost?: GestureBoost; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'boost',
      gestureId: params.gestureId,
      content: params.content,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
      authorId: params.identity?.id,
      authorName: params.identity?.name,
      authorAvatar: params.identity?.avatar,
    }),
  });
  return (await res.json()) as any;
}

export async function reactToGesture(params: {
  id: string;
  emoji: string;
  identity?: CommentIdentity | null;
}): Promise<{
  ok: boolean;
  likesCount?: number;
  userReaction?: string | null;
  reactions?: {
    summary: Record<string, number>;
    users: Record<string, string>;
    details?: ReactionDetailItem[];
  };
  error?: string;
}> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'react',
      id: params.id,
      emoji: params.emoji,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
      authorId: params.identity?.id,
      authorName: params.identity?.name,
      authorAvatar: params.identity?.avatar,
    }),
  });
  return (await res.json()) as any;
}

export async function editGestureNode(params: {
  id: string;
  message: string;
  title?: string;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; editCount?: number; message?: string; title?: string; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'edit',
      id: params.id,
      message: params.message,
      title: params.title,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
    }),
  });
  return (await res.json()) as any;
}

export async function deleteGestureNode(params: {
  id: string;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'delete',
      id: params.id,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
    }),
  });
  return (await res.json()) as any;
}

export async function toggleGestureSubscription(params: {
  gestureId: string;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; subscribed?: boolean; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'subscribe',
      gestureId: params.gestureId,
      sessionToken: params.identity?.token || getOrCreateGestureSessionToken(),
    }),
  });
  return (await res.json()) as any;
}

export async function reportGestureNode(params: {
  id: string;
  reason?: string;
  identity?: CommentIdentity | null;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/gestures', {
    method: 'POST',
    headers: buildAuthHeaders(params.identity),
    body: JSON.stringify({
      action: 'report',
      id: params.id,
      reason: params.reason || '用户标记反馈',
    }),
  });
  return (await res.json()) as any;
}

/**
 * Formats date strictly to clean "8月 3日" style for first-published display.
 */
export function formatMonthDay(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(gestureTimestamp(iso));
    if (Number.isNaN(d.getTime())) return '—';
    const currentYear = new Date().getFullYear();
    const md = `${d.getMonth() + 1}月 ${d.getDate()}日`;
    return d.getFullYear() !== currentYear ? `${d.getFullYear()}年 ${md}` : md;
  } catch {
    return '刚刚';
  }
}

/**
 * Formats compact relative activity duration (e.g. "2天前", "5小时前", "刚刚") for timeline dock.
 */
export function formatCompactRelative(iso?: string, nowMs = Date.now()): string {
  if (!iso) return '刚刚';
  try {
    const d = new Date(gestureTimestamp(iso));
    if (Number.isNaN(d.getTime())) return '刚刚';
    const diffMs = Math.max(0, nowMs - d.getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}个月前`;
    return `${Math.floor(months / 12)}年前`;
  } catch {
    return '刚刚';
  }
}

export function formatMetricCount(num: number): string {
  if (num >= 10000) return `${(num / 1000).toFixed(1)} 千`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} 千`;
  return String(num);
}

export { resolveAuthorBadges } from './gesture-client';

export function extractOpTitle(gesture: Pick<GestureNode, 'message' | 'title'>): { title: string; bodyWithoutLeadingHeading: string } {
  const raw = gesture.message || '';
  if (gesture.title && gesture.title.trim()) {
    const stripped = raw.replace(/^#{1,6}[^\S\r\n]+([^\n]+)(?:\n+|$)/, (heading, title) => title.trim() === gesture.title?.trim() ? '' : heading).trim();
    return {
      title: gesture.title.trim(),
      bodyWithoutLeadingHeading: stripped,
    };
  }
  const headingMatch = raw.match(/^#{1,6}[^\S\r\n]+([^\n]+)/);
  if (headingMatch) {
    const title = headingMatch[1].trim();
    const stripped = raw.slice(headingMatch[0].length).trim();
    return {
      title,
      bodyWithoutLeadingHeading: stripped,
    };
  }
  const plain = raw.replace(/[#*`_>]/g, '').trim();
  return {
    title: plain.slice(0, 48) || 'Gesture 讨论',
    bodyWithoutLeadingHeading: raw,
  };
}
