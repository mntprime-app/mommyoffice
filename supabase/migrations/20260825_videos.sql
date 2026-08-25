-- MommyOffice: mo_videos table
-- Phase 1: free YouTube embeds (youtube_id)
-- Phase 2: paid CF Stream (cloudflare_stream_id)

CREATE TABLE IF NOT EXISTS mo_videos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mn             TEXT NOT NULL,
  title_en             TEXT,
  slug                 TEXT UNIQUE,
  description_mn       TEXT,
  description_en       TEXT,

  -- Video sources (mutually exclusive per video_type)
  youtube_id           TEXT,              -- free content: YouTube video ID only (not full URL)
  cloudflare_stream_id TEXT,              -- paid content: CF Stream video ID

  -- Display
  thumbnail_url        TEXT,              -- optional override; falls back to YT thumb
  duration_text        TEXT DEFAULT '0 мин',
  category             TEXT NOT NULL DEFAULT 'Бизнес & Санхүү',

  -- Discovery
  view_count           INTEGER NOT NULL DEFAULT 0,
  is_published         BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE, -- hero spotlight
  placement            TEXT NOT NULL DEFAULT 'normal', -- 'hero' | 'trending' | 'normal'
  video_type           TEXT NOT NULL DEFAULT 'free',   -- 'free' | 'paid'

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Fast queries for public page rows
CREATE INDEX IF NOT EXISTS idx_videos_published_created
  ON mo_videos (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_published_views
  ON mo_videos (is_published, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_videos_category
  ON mo_videos (is_published, category, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_videos_featured
  ON mo_videos (is_published, is_featured)
  WHERE is_featured = TRUE;

-- Valid categories (informational — enforced in admin UI, not DB constraint to allow flexibility)
-- 'Бизнес & Санхүү'
-- 'Эрүүл мэнд & Гоо сайхан'
-- 'Хүүхдийн хүмүүжил & Гэр бүл'
-- 'Хувийн хөгжил & Карьер'
-- 'Гэрийн менежмент & Лайфстайл'
