CREATE TABLE IF NOT EXISTS rate_limits (
  namespace TEXT NOT NULL,
  bucket TEXT NOT NULL,
  actor_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (namespace, bucket, actor_hash)
);

CREATE TABLE IF NOT EXISTS provider_token_states (
  provider TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_suffix TEXT NOT NULL,
  cooldown_until INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_status INTEGER,
  last_error TEXT NOT NULL DEFAULT '',
  last_used_at INTEGER NOT NULL DEFAULT 0,
  last_success_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (provider, token_hash)
);

CREATE TABLE IF NOT EXISTS ai_summary_cache (
  cache_key TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
