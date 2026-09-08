-- Migration: Add Netflix modal metadata fields to mo_home_config
-- Run in: Supabase → SQL Editor
-- Date: 2026-09-08

ALTER TABLE mo_home_config
  ADD COLUMN IF NOT EXISTS hero_is_popular   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hero_duration_text TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_year          TEXT    DEFAULT '';

-- Verify
SELECT id, hero_is_popular, hero_duration_text, hero_year FROM mo_home_config;
