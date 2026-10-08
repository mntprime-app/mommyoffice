/**
 * TEST ONLY — Send a sample abandoned-cart reminder to a fixed address.
 * Protected by CRON_SECRET header. Remove or gate behind NODE_ENV check
 * once testing is complete.
 *
 * Usage (PowerShell):
 *   $secret = (Get-Content .env.local | Select-String "CRON_SECRET").ToString().Split("=",2)[1].Trim()
 *   Invoke-RestMethod -Uri "https://mommyoffice.com/api/test/send-reminder" `
 *     -Method POST `
 *     -Headers @{ "x-cron-secret" = $secret } `
 *     -ContentType "application/json" `
 *     -Body '{"type":"1h"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedCartEmail } from '@/lib/email-abandoned-cart';

export async function POST(req: NextRequest) {
  // Auth guard — same secret as the real cron endpoint
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = body.type === '24h' ? '24h' : '1h';

  const ok = await sendAbandonedCartEmail(type, {
    buyerEmail: 'amaraa2434@gmail.com',
    buyerName: 'Амараа',
    courseTitle: 'Англи хэлний үндэс — Easy English',
    coursePrice: 29900,
    resumeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com'}/mn/checkout/resume?order_id=test-preview-001`,
  });

  if (!ok) {
    return NextResponse.json({ error: 'Brevo send failed — check Vercel logs' }, { status: 500 });
  }

  return NextResponse.json({ sent: true, type, to: 'amaraa2434@gmail.com' });
}
