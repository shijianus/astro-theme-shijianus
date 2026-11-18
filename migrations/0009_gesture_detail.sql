-- Migration: 0009_gesture_detail.sql
-- Extend comments table for Gesture / SubGesture hierarchy, edit_count, views_count, and add scoped boosts & subscriptions tables.

-- 1. Extend comments table for Gesture (parent_id IS NULL) & SubGesture (parent_id IS NOT NULL)
ALTER TABLE comments ADD COLUMN title TEXT DEFAULT NULL;
ALTER TABLE comments ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE comments ADD COLUMN reply_to_id TEXT DEFAULT NULL;
ALTER TABLE comments ADD COLUMN edit_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN views_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_comments_reply_to_id ON comments (reply_to_id);

-- 2. Unified scoped Boost table
--    - gesture_id IS NULL: Home plaza site-wide Boost
--    - gesture_id IS NOT NULL: Scoped to specific Gesture (OP) or SubGesture (floor reply)
CREATE TABLE IF NOT EXISTS boosts (
  id TEXT PRIMARY KEY,
  gesture_id TEXT DEFAULT NULL,
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_boosts_gesture_id ON boosts (gesture_id, created_at);

-- 3. Gesture subscription notifications table
CREATE TABLE IF NOT EXISTS gesture_subscriptions (
  gesture_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  subscribed INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (gesture_id, user_id)
);
