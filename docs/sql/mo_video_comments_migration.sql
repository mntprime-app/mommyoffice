-- ============================================================
-- MommyOffice — Video Comments migration
-- Run once in Supabase Dashboard → SQL Editor
-- Session 16 — 2026-09-06
-- ============================================================

-- 1. Add comments_enabled column to mo_videos (default ON)
ALTER TABLE mo_videos
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT TRUE;

-- 2. Create mo_video_comments table
CREATE TABLE IF NOT EXISTS mo_video_comments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id        UUID        NOT NULL REFERENCES mo_videos(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email      TEXT,
  user_name       TEXT,
  body            TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookup by video
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON mo_video_comments(video_id);

-- 4. RLS
ALTER TABLE mo_video_comments ENABLE ROW LEVEL SECURITY;

-- Public can read all comments
CREATE POLICY "Public can read comments"
  ON mo_video_comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Auth users can insert comments"
  ON mo_video_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own comments
CREATE POLICY "Users can delete own comments"
  ON mo_video_comments FOR DELETE
  USING (auth.uid() = user_id);
