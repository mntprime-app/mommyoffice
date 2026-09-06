-- ============================================================
-- MommyOffice — Slug integrity: backfill + NOT NULL + UNIQUE
-- Run once in Supabase Dashboard → SQL Editor
-- Session 16 — 2026-09-06
-- ============================================================

-- Step 1: Backfill NULL/empty slugs
-- Uses title_en for Latin-safe slugs; falls back to UUID (always unique)
UPDATE mo_videos
SET slug = CASE
  WHEN title_en IS NOT NULL AND trim(title_en) != '' THEN
    trim(both '-' from
      regexp_replace(
        regexp_replace(lower(trim(title_en)), '[^a-z0-9]+', '-', 'g'),
        '-{2,}', '-', 'g'
      )
    ) || '-' || substring(id::text, 1, 6)
  ELSE
    id::text  -- UUID is always unique; admin can rename via edit form later
END
WHERE slug IS NULL OR trim(slug) = '';

-- Step 2: Safety net — catch any remaining empty slugs
UPDATE mo_videos
SET slug = id::text
WHERE slug IS NULL OR trim(slug) = '';

-- Step 3: Add UNIQUE constraint (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mo_videos_slug_unique' AND conrelid = 'mo_videos'::regclass
  ) THEN
    ALTER TABLE mo_videos ADD CONSTRAINT mo_videos_slug_unique UNIQUE (slug);
  END IF;
END$$;

-- Step 4: Enforce NOT NULL
ALTER TABLE mo_videos ALTER COLUMN slug SET NOT NULL;
