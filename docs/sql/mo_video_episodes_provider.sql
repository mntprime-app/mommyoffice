-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Dual-Provider Episode Architecture (BUG-055)
-- Run in: Supabase → SQL Editor
-- Date: 2026-09-08
-- Adds per-episode video provider support: YouTube (free) vs Cloudflare Stream (paid)
-- ═══════════════════════════════════════════════════════════════════════════

-- Add provider columns to mo_video_episodes
ALTER TABLE mo_video_episodes
  ADD COLUMN IF NOT EXISTS video_provider       TEXT    DEFAULT 'youtube'
    CHECK (video_provider IN ('youtube', 'cloudflare')),
  ADD COLUMN IF NOT EXISTS youtube_id           VARCHAR(30)  DEFAULT '',
  ADD COLUMN IF NOT EXISTS cloudflare_stream_id VARCHAR(200) DEFAULT '';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'mo_video_episodes'
  AND column_name IN ('video_provider', 'youtube_id', 'cloudflare_stream_id')
ORDER BY column_name;
