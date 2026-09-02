-- Migration: 0002_sponsorships.sql
-- Create sponsorships table for recording blog sponsorships and blessings

CREATE TABLE IF NOT EXISTS sponsorships (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  name TEXT,
  message TEXT,
  country TEXT,
  ip TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships (status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_created_at ON sponsorships (created_at);
