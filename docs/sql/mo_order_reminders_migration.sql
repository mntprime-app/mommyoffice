-- ============================================================
-- MommyOffice — Abandoned Cart Reminders Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── mo_order_reminders ───────────────────────────────────────
-- Tracks which reminder emails have been sent per order.
-- Prevents duplicate sends if cron fires multiple times.
create table if not exists mo_order_reminders (
  id           uuid         primary key default gen_random_uuid(),
  order_id     uuid         not null references mo_orders(id) on delete cascade,
  reminder_type text        not null,  -- '1h' | '24h' | '3d'
  sent_at      timestamptz  not null default now(),
  unique (order_id, reminder_type)     -- one send per type per order
);

create index if not exists mo_order_reminders_order_idx on mo_order_reminders(order_id);

alter table mo_order_reminders enable row level security;

-- Service role only (cron route uses service role key)
create policy "Admin full access to order_reminders"
  on mo_order_reminders for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ── Verify ───────────────────────────────────────────────────
-- select * from mo_order_reminders limit 5;
