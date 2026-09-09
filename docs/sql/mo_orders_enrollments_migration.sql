-- ============================================================
-- MommyOffice — Orders + Enrollments Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. mo_orders ─────────────────────────────────────────────
create table if not exists mo_orders (
  id              uuid         primary key,            -- set by API (randomUUID)
  course_id       uuid         not null references mo_courses(id) on delete restrict,
  buyer_name      text,
  buyer_email     text         not null,
  buyer_phone     text         not null,
  amount          integer      not null,               -- MNT, whole tugriks
  qpay_invoice_id text         not null,
  qpay_qr_text    text,
  status          text         not null default 'pending',  -- pending | paid | failed
  user_id         uuid         references auth.users(id),
  paid_at         timestamptz,
  access_token    uuid,
  created_at      timestamptz  default now()
);

create index if not exists mo_orders_email_idx    on mo_orders(buyer_email);
create index if not exists mo_orders_status_idx   on mo_orders(status);
create index if not exists mo_orders_course_idx   on mo_orders(course_id);

alter table mo_orders enable row level security;

-- Service role (used by API routes) bypasses RLS automatically.
-- No public read — orders are private.
create policy "Admin full access to orders"
  on mo_orders for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ── 2. mo_enrollments ────────────────────────────────────────
create table if not exists mo_enrollments (
  id          uuid         primary key default gen_random_uuid(),
  course_id   uuid         not null references mo_courses(id) on delete restrict,
  email       text         not null,
  order_id    uuid         references mo_orders(id),
  user_id     uuid         references auth.users(id),
  created_at  timestamptz  default now(),
  unique (email, course_id)
);

create index if not exists mo_enrollments_email_idx   on mo_enrollments(email);
create index if not exists mo_enrollments_user_idx    on mo_enrollments(user_id);
create index if not exists mo_enrollments_course_idx  on mo_enrollments(course_id);

alter table mo_enrollments enable row level security;

-- Logged-in users can read their own enrollments
create policy "Users read own enrollments"
  on mo_enrollments for select
  using (user_id = auth.uid());

-- Service role can do everything (API inserts/upserts)
create policy "Admin full access to enrollments"
  on mo_enrollments for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ── 3. Fix mo_access_tokens.expires_at NOT NULL constraint ───
-- The API inserts NULL for lifetime access — the existing NOT NULL
-- constraint blocks this. Drop the constraint.
alter table mo_access_tokens
  alter column expires_at drop not null;

-- ── 4. Verify ─────────────────────────────────────────────────
-- After running, confirm with:
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name like 'mo_%'
--   order by table_name;
