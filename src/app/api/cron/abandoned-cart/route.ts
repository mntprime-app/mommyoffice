/**
 * Abandoned Cart Email Cron — POST /api/cron/abandoned-cart
 *
 * Triggered by Vercel Cron every hour (see vercel.json).
 * Sends 2-stage reminders for pending orders:
 *   • 1h  — 55–115 min after order created_at
 *   • 24h — 23–25 hours after order created_at
 *
 * Safety:
 *   - Checks mo_order_reminders to prevent duplicate sends
 *   - Re-checks order status before sending (skips if paid)
 *   - Only sends for is_published courses (respects admin visibility toggle)
 *   - Protected by CRON_SECRET header
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAbandonedCartEmail, ReminderType } from '@/lib/email-abandoned-cart';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mommyoffice.com';

// 2-stage windows — each ~60 min wide so a cron running hourly catches each order once
const REMINDER_WINDOWS: Array<{ type: ReminderType; minMin: number; maxMin: number }> = [
  { type: '1h',  minMin: 55,   maxMin: 115  }, // 55–115 min after order
  { type: '24h', minMin: 1380, maxMin: 1500 }, // 23–25 hours after order
];

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get('x-cron-secret') ??
    new URL(req.url).searchParams.get('cron_secret');

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, number> = { sent: 0, skipped: 0, errors: 0 };
  const now = new Date();

  for (const window of REMINDER_WINDOWS) {
    const minAgo = new Date(now.getTime() - window.maxMin * 60 * 1000).toISOString();
    const maxAgo = new Date(now.getTime() - window.minMin * 60 * 1000).toISOString();

    // Pending orders in this time window — join course to check is_published
    const { data: orders, error: ordersErr } = await supabase
      .from('mo_orders')
      .select(`
        id,
        buyer_email,
        buyer_name,
        course_id,
        created_at,
        mo_courses!inner (
          title_mn,
          price,
          is_published
        )
      `)
      .eq('status', 'pending')
      .gte('created_at', minAgo)
      .lte('created_at', maxAgo);

    if (ordersErr) {
      console.error(`[abandoned-cart] DB error (${window.type}):`, ordersErr);
      results.errors++;
      continue;
    }

    if (!orders || orders.length === 0) continue;

    for (const order of orders) {
      const course = (order as any).mo_courses as {
        title_mn: string;
        price: number;
        is_published: boolean;
      } | null;

      // Skip unpublished courses (admin visibility toggle)
      if (!course?.is_published) {
        results.skipped++;
        continue;
      }

      // Skip if this reminder type was already sent for this order
      const { data: existing } = await supabase
        .from('mo_order_reminders')
        .select('id')
        .eq('order_id', order.id)
        .eq('reminder_type', window.type)
        .maybeSingle();

      if (existing) {
        results.skipped++;
        continue;
      }

      // Re-check order status (race condition guard — user may have paid since query)
      const { data: freshOrder } = await supabase
        .from('mo_orders')
        .select('status')
        .eq('id', order.id)
        .single();

      if (freshOrder?.status !== 'pending') {
        results.skipped++;
        continue;
      }

      // Resume URL — links to /checkout/resume page (creates fresh QPay invoice on arrival)
      const resumeUrl = `${SITE_URL}/mn/checkout/resume?order_id=${order.id}`;

      const sent = await sendAbandonedCartEmail(window.type, {
        buyerEmail: order.buyer_email,
        buyerName:  order.buyer_name ?? '',
        courseTitle: course.title_mn,
        coursePrice: course.price,
        resumeUrl,
      });

      if (sent) {
        // Record to prevent duplicate sends
        await supabase.from('mo_order_reminders').insert({
          order_id: order.id,
          reminder_type: window.type,
        });
        results.sent++;
      } else {
        results.errors++;
      }
    }
  }

  console.log('[abandoned-cart] cron complete:', results);
  return NextResponse.json({ ok: true, ...results });
}
