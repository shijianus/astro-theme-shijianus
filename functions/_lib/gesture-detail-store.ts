// Detail-only additions; the public comment and Boost store stays unchanged.
import type { AppEnv, D1DatabaseLike } from './types';
import { memoryBoostsStore, memoryFallbackStore, ensureGestureTables as ensureSharedTables,
  mapRowToClientComment as mapSharedComment, type RawBoostRow, type RawCommentRow } from './gesture-shared.ts';
import { gestureTimestamp } from '../../src/lib/gesture-text.ts';
export * from './gesture-shared.ts';

export const memoryLinkVisits = new Map<string, Map<string, Set<string>>>();
const ensured = new WeakSet<object>();
export async function ensureGestureTables(db?: D1DatabaseLike) {
  await ensureSharedTables(db);
  if (!db || ensured.has(db)) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS gesture_link_visits (
    gesture_id TEXT NOT NULL, link_key TEXT NOT NULL, visitor_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gesture_id, link_key, visitor_hash)
  )`).run();
  ensured.add(db);
}
export function mapRowToClientComment(row: RawCommentRow, isAdmin = false, currentUserId = '', floorIndex?: number) {
  return { ...mapSharedComment(row, isAdmin, currentUserId, floorIndex),
    createdAt: gestureTimestamp(row.created_at), updatedAt: gestureTimestamp(row.updated_at) };
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

