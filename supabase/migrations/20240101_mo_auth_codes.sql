-- BUG-071: OTP codes table for direct Brevo email auth
-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mo_auth_codes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        NOT NULL,
  code        text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mo_auth_codes_email   ON mo_auth_codes (email);
CREATE INDEX IF NOT EXISTS idx_mo_auth_codes_expires ON mo_auth_codes (expires_at);

-- RLS: no public access — only service role key can read/write
ALTER TABLE mo_auth_codes ENABLE ROW LEVEL SECURITY;

-- Optional: auto-delete codes older than 1 day (keeps table clean)
-- (Run as a Supabase cron job or pg_cron if available)
-- DELETE FROM mo_auth_codes WHERE created_at < now() - interval '1 day';
