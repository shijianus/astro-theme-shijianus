-- Migration: 0007_comment_tag.sql
-- Add tag column to comments table for category/topic partitioning in guestbook and community discussions

ALTER TABLE comments ADD COLUMN tag TEXT DEFAULT 'general';
CREATE INDEX IF NOT EXISTS idx_comments_tag ON comments (tag);
