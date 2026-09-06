-- ============================================================
-- MommyOffice — mo_home_config migration
-- Run once in Supabase Dashboard → SQL Editor
-- Session 15 — 2026-09-06
-- ============================================================

CREATE TABLE IF NOT EXISTS mo_home_config (
  id                      INT PRIMARY KEY DEFAULT 1,
  -- Hero section
  hero_title_mn           TEXT DEFAULT 'Монголын эмэгтэйчүүдэд зориулсан №1 платформ',
  hero_title_en           TEXT DEFAULT 'Mongolia''s #1 Women''s Platform',
  hero_subtitle_mn        TEXT DEFAULT 'Мэдлэг эзэмш. Амьдралаа сайжруул. Мөрөөлдөө биелүүл.',
  hero_subtitle_en        TEXT DEFAULT 'Learn. Grow. Achieve.',
  hero_badge_text         TEXT DEFAULT '🇲🇳 MONGOLIA #1 PLATFORM',
  hero_cover_image_url    TEXT,
  hero_youtube_id         TEXT,
  hero_primary_cta_text   TEXT DEFAULT 'Үзэх',
  hero_primary_cta_href   TEXT DEFAULT '/mn/courses',
  hero_secondary_cta_text TEXT DEFAULT 'Дэлгэрэнгүй',
  hero_secondary_cta_href TEXT DEFAULT '/mn/articles',
  -- Section visibility
  show_courses_section    BOOLEAN DEFAULT TRUE,
  show_articles_section   BOOLEAN DEFAULT TRUE,
  show_videos_section     BOOLEAN DEFAULT TRUE,
  show_shop_section       BOOLEAN DEFAULT FALSE,
  -- Meta
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce singleton: only one row allowed (id is always 1)
-- INSERT the seed row; if it already exists, do nothing
INSERT INTO mo_home_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS: allow admin (service role) to read and write; block anon writes
ALTER TABLE mo_home_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read home config"
  ON mo_home_config FOR SELECT
  USING (true);

-- Service role bypasses RLS automatically — no extra policy needed for writes.
