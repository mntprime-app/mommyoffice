-- Trending & Placement columns for mo_articles
-- Run in Supabase SQL Editor

ALTER TABLE mo_articles
  ADD COLUMN IF NOT EXISTS is_pinned_trending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pin_rank INTEGER,
  ADD COLUMN IF NOT EXISTS placement TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Index for fast trending query
CREATE INDEX IF NOT EXISTS idx_articles_trending
  ON mo_articles (is_published, is_pinned_trending, pin_rank, view_count DESC);

-- Trending query used by the home page (hybrid logic):
-- SELECT * FROM mo_articles
-- WHERE is_published = true
-- ORDER BY
--   CASE WHEN is_pinned_trending THEN 0 ELSE 1 END,
--   pin_rank ASC NULLS LAST,
--   view_count DESC NULLS LAST
-- LIMIT 5;
