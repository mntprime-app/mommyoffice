-- ─────────────────────────────────────────────────────────────────────────────
-- Video ratings: columns on mo_videos + mo_video_ratings table + trigger
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add rating counter columns to mo_videos
ALTER TABLE mo_videos
  ADD COLUMN IF NOT EXISTS upvotes_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS super_likes_count INTEGER NOT NULL DEFAULT 0;

-- 2. Per-user ratings (one row per user per video, upsertable)
CREATE TABLE IF NOT EXISTS mo_video_ratings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id     UUID        NOT NULL REFERENCES mo_videos(id)  ON DELETE CASCADE,
  rating_type  TEXT        NOT NULL CHECK (rating_type IN ('up', 'down', 'super')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

-- 3. RLS — users manage only their own rows
ALTER TABLE mo_video_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ratings" ON mo_video_ratings;
CREATE POLICY "Users can manage own ratings" ON mo_video_ratings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Trigger function — keep counter columns in sync
CREATE OR REPLACE FUNCTION sync_video_rating_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  vid UUID;
BEGIN
  vid := COALESCE(NEW.video_id, OLD.video_id);
  UPDATE mo_videos SET
    upvotes_count     = (SELECT COUNT(*) FROM mo_video_ratings WHERE video_id = vid AND rating_type = 'up'),
    downvotes_count   = (SELECT COUNT(*) FROM mo_video_ratings WHERE video_id = vid AND rating_type = 'down'),
    super_likes_count = (SELECT COUNT(*) FROM mo_video_ratings WHERE video_id = vid AND rating_type = 'super')
  WHERE id = vid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_video_rating_counts ON mo_video_ratings;
CREATE TRIGGER trg_video_rating_counts
  AFTER INSERT OR UPDATE OR DELETE ON mo_video_ratings
  FOR EACH ROW EXECUTE FUNCTION sync_video_rating_counts();
