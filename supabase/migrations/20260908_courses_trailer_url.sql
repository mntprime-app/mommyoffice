-- Add trailer_url column to mo_courses (was in schema definition but not created in DB)
ALTER TABLE mo_courses ADD COLUMN IF NOT EXISTS trailer_url TEXT;
