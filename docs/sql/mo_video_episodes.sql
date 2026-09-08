-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Series & Multi-Episode Drama Architecture
-- Run in: Supabase → SQL Editor
-- Date: 2026-09-08
-- BUG: BUG-054
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Extend mo_videos with content type ───────────────────────────────────
ALTER TABLE mo_videos
  ADD COLUMN IF NOT EXISTS content_type  TEXT    DEFAULT 'movie'
    CHECK (content_type IN ('movie', 'series')),
  ADD COLUMN IF NOT EXISTS season_count  INTEGER DEFAULT 1;

-- ─── 2. Create mo_video_episodes table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS mo_video_episodes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id         UUID        NOT NULL REFERENCES mo_videos(id) ON DELETE CASCADE,
  season_number    INTEGER     NOT NULL DEFAULT 1,
  episode_number   INTEGER     NOT NULL,
  title            VARCHAR(200),
  duration         VARCHAR(30),           -- e.g. "42 мин"
  video_url        VARCHAR(1000),         -- HLS / MP4 / YouTube embed / CF stream ID
  thumbnail_url    VARCHAR(1000),
  description      TEXT,
  is_published     BOOLEAN     DEFAULT true,
  sort_order       INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mo_video_episodes_video_id
  ON mo_video_episodes(video_id);

CREATE INDEX IF NOT EXISTS idx_mo_video_episodes_order
  ON mo_video_episodes(video_id, season_number, episode_number);

-- RLS: allow public read of published episodes
ALTER TABLE mo_video_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Episodes: public read published"
  ON mo_video_episodes FOR SELECT
  USING (is_published = true);

-- Service-role / admin can do everything (no policy needed — service key bypasses RLS)

-- ─── 3. Add hero_content_slug to mo_home_config ──────────────────────────────
-- Admin fills this with the slug of the video featured in the home hero.
-- page.tsx uses it to fetch that video's episodes for the detail modal.
ALTER TABLE mo_home_config
  ADD COLUMN IF NOT EXISTS hero_content_slug TEXT DEFAULT '';

-- ─── 4. Verify ───────────────────────────────────────────────────────────────
SELECT
  column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('mo_videos', 'mo_video_episodes', 'mo_home_config')
  AND column_name IN (
    'content_type', 'season_count',
    'id', 'video_id', 'episode_number', 'title', 'duration',
    'hero_content_slug'
  )
ORDER BY table_name, column_name;
