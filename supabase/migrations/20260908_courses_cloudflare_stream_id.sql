-- Add cloudflare_stream_id column to mo_courses for course trailer/promo video
ALTER TABLE mo_courses ADD COLUMN IF NOT EXISTS cloudflare_stream_id TEXT;
