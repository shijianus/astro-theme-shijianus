-- Migration: 0004_comment_reactions.sql
-- Add reactions JSON column to comments table for rich emoji interactions and ranking

ALTER TABLE comments ADD COLUMN reactions TEXT DEFAULT '{}';
