-- ==============================================================================
-- Migration 0005: User Accounts & Sessions (Single DB & Dual DB Modes)
-- ==============================================================================

-- 1. 用户基础表 (Users Table)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'reader',       -- 'admin' | 'reader' | 'visitor'
  provider TEXT NOT NULL DEFAULT 'epomail',  -- 'epomail' | 'local'
  external_id TEXT DEFAULT NULL,            -- Epomail User ID or OAuth Sub
  bio TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);

-- 2. 会话管理表 (User Sessions Table)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
