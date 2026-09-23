-- Migration 0006: Add timezone and location columns to users table
-- Ensures user profile timezone and location settings persist across edge isolates and cold starts

ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT '';
