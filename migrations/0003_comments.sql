-- Migration: 0003_comments.sql
-- Create comments table for native blog commenting system

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_slug TEXT NOT NULL,
  parent_id TEXT,
  quote_id TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT DEFAULT '',
  author_avatar TEXT DEFAULT '',
  author_website TEXT DEFAULT '',
  author_role TEXT DEFAULT 'visitor',
  message TEXT NOT NULL,
  session_token TEXT,
  ip TEXT,
  ip_location TEXT,
  user_agent TEXT,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments (post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);
