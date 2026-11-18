import type { AppEnv } from './types';
import { memoryBoostsStore, memoryFallbackStore } from './gesture-shared.ts';
import { gestureTimestamp } from '../../src/lib/gesture-text.ts';
import type { RawCommentRow, RawBoostRow } from './gesture-shared.ts';

// Exact identifiers and timestamps from the retired welcome-thread initializer.
export const welcomeId = 'pinned_welcome_official';
const originalReplies = new Map([
  ['reply_floor_2_official', '2026-08-03T09:20:00.000Z'],
  ['reply_floor_3_official', '2026-08-03T11:45:00.000Z'],
  ['reply_floor_4_official', '2026-08-03T14:10:00.000Z'],
  ['reply_floor_5_official', '2026-08-04T10:00:00.000Z'],
]);
const originalBoosts = new Map([
  ['boost_detail_op_1', '2026-08-03T08:30:00.000Z'],
  ['boost_detail_op_2', '2026-08-03T09:05:00.000Z'],
  ['boost_detail_sub_3', '2026-08-03T12:00:00.000Z'],
]);
const starterVotes: Record<string, Record<string, string>> = {
  [welcomeId]: { reader_alice: '👍', reader_lanfeng: '👍', reader_xiwang: '❤️', reader_bob: '🚀', reader_carol: '💡' },
  reply_floor_2_official: { reader_lanfeng: '👍', reader_xiwang: '❤️' },
  reply_floor_3_official: { reader_alice: '🚀', reader_carol: '❤️' },
  reply_floor_4_official: { reader_alice: '👍' },
  reply_floor_5_official: { reader_alice: '👍', admin: '💡' },
};
export const isStarterBoost = (b: RawBoostRow) => originalBoosts.get(b.id) === b.created_at;

export function welcomeContent(row: RawCommentRow) {
  if (row.id !== welcomeId || row.created_at !== '2026-08-03T08:15:00.000Z' || row.author_role !== 'admin') return row;
  const base = { ...row, views_count: Math.max(0, (row.views_count || 0) - 1280), edit_count: Math.max(0, (row.edit_count || 0) - 2) };
  if (row.updated_at === '2026-08-04T10:30:00.000Z') {
    const suffix = '相关参考：[博客功能与内容格式指南](/posts/content-formats-and-markup-mastery/) 与 [社区规范与等级体系](/community/identity-levels-and-badges/)。';
    if (base.message.endsWith(suffix)) base.message = base.message.slice(0,-suffix.length);
  }
  return stripStarterVotes(base);
}

function stripStarterVotes(row: RawCommentRow) {
  let rx;
  try { rx = JSON.parse(row.reactions || '{}'); } catch { return row; }
  const users: Record<string,string> = {};
  const summary: Record<string,number> = {};
  for (const [actor, value] of Object.entries(rx.users || {})) {
    if (starterVotes[row.id]?.[actor] === value || typeof value !== 'string') continue;
    users[actor] = value;
    summary[value] = (summary[value] || 0) + 1;
  }
  return { ...row, reactions: JSON.stringify({ ...rx, summary, users }), likes_count: Object.keys(users).length };
}

export function welcomeReplies(rows: RawCommentRow[], boosts: Record<string, RawBoostRow[]>) {
  const byId = new Map(rows.map(row => [row.id, row]));
  const keep = new Set<string>();
  const pending = rows.filter(row => originalReplies.get(row.id) !== row.updated_at ||
    stripStarterVotes(row).likes_count > 0 || boosts[row.id]?.some(b => !isStarterBoost(b)));
  // A real reply or quote can still refer back to a starter floor. Keep its entire context.
  while (pending.length) {
    const row = pending.pop()!;
    if (keep.has(row.id)) continue;
    keep.add(row.id);
    for (const id of [row.reply_to_id, row.quote_id]) if (id && byId.has(id)) pending.push(byId.get(id)!);
  }
  return rows.filter(row => keep.has(row.id)).map(row => originalReplies.has(row.id) ? stripStarterVotes(row) : row);
}

export async function fetchThreadBoosts(db: AppEnv['DB'] | undefined, rootId: string) {
  const rows = db
    ? (await db.prepare(`
        SELECT * FROM boosts WHERE gesture_id = ? OR gesture_id IN (
          SELECT id FROM comments WHERE parent_id = ? AND status IN ('published', 'pinned') AND post_type != 'boost'
        ) ORDER BY julianday(created_at), id
      `).bind(rootId, rootId).all<RawBoostRow>()).results || []
    : [...memoryBoostsStore.values()].filter(boost => {
        if (boost.gesture_id === rootId) return true;
        const post = boost.gesture_id && memoryFallbackStore.get(boost.gesture_id);
        return post && post.parent_id === rootId && post.post_type !== 'boost' && ['published', 'pinned'].includes(post.status);
      }).sort((a, b) => Date.parse(gestureTimestamp(a.created_at)) - Date.parse(gestureTimestamp(b.created_at)) || a.id.localeCompare(b.id));
  const grouped: Record<string, RawBoostRow[]> = {};
  for (const row of rows) {
    if (row.gesture_id) (grouped[row.gesture_id] ||= []).push(row);
  }
  return grouped;
}

export async function welcomeReplyCount(db?: AppEnv['DB']) {
  const rows = db ? (await db.prepare("SELECT * FROM comments WHERE parent_id=? AND post_type!='boost' AND status IN ('published','pinned')").bind(welcomeId).all<RawCommentRow>()).results || []
    : [...memoryFallbackStore.values()].filter(r => r.parent_id === welcomeId && r.post_type !== 'boost' && ['published','pinned'].includes(r.status));
  const boosts = await fetchThreadBoosts(db, welcomeId);
  return welcomeReplies(rows, boosts).length;
}
