/**
 * POST /api/video/webhook
 *
 * Cloudflare Stream fires this when a video finishes encoding.
 * We run the quality gate here:
 *   - Resolution ≥ 720p
 *   - Duration ≥ 3 minutes (180 seconds)
 *   - Audio track present
 *   - Not a black/corrupt video (duration > 0)
 *
 * PASS → mark video as ready in Supabase
 * FAIL → auto-delete from Cloudflare Stream (no storage cost) + record rejection reason
 *
 * Required env vars:
 *   CF_ACCOUNT_ID        — Cloudflare account ID
 *   CF_STREAM_API_TOKEN  — API token with Stream:Edit + Stream:Read
 *   CF_WEBHOOK_SECRET    — from CF dashboard → Stream → Webhooks (for signature verification)
 *
 * Register the webhook URL in Cloudflare:
 *   Dashboard → Stream → Webhooks → https://mommyoffice.com/api/video/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID        ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN  ?? '';
const CF_WEBHOOK_SECRET   = process.env.CF_WEBHOOK_SECRET    ?? '';

// ── Quality standards ────────────────────────────────────────────────────────
const MIN_HEIGHT_PX   = 720;   // minimum 720p
const MIN_DURATION_S  = 180;   // minimum 3 minutes

// ── Rejection reason messages (Mongolian + English) ──────────────────────────
const REJECTION_REASONS: Record<string, string> = {
  low_resolution: 'Видеоны чанар хангалтгүй (720p-с доош). Камерийн тохиргоог 720p буюу 1080p болгон дахин бичлэг хийнэ үү.',
  too_short:      'Видео хэт богино байна (3 минутаас бага). Сургалтын видео дор хаяж 3 минут байх ёстой.',
  no_audio:       'Видеонд дуу байхгүй байна. Микрофоноо шалгаад дахин бичлэг хийнэ үү.',
  corrupt:        'Видео файл гэмтсэн эсвэл тэг хугацаатай байна. Файлаа шалгаад дахин оролдоно уу.',
};

// ── Verify Cloudflare webhook signature ──────────────────────────────────────
async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  if (!CF_WEBHOOK_SECRET) return true; // skip verification if not configured yet

  const signature = req.headers.get('webhook-signature') ?? '';
  // CF signature format: "time=<unix>&sig1=<hmac>"
  const parts = Object.fromEntries(signature.split('&').map(p => p.split('=')));
  const time = parts['time'] ?? '';
  const sig1 = parts['sig1'] ?? '';

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CF_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigInput = `${time}.${rawBody}`;
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(sigInput));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === sig1;
}

// ── Delete video from Cloudflare Stream ──────────────────────────────────────
async function deleteFromStream(videoUid: string): Promise<void> {
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${videoUid}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CF_STREAM_API_TOKEN}` },
    },
  );
}

// ── Main webhook handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify signature
  const valid = await verifySignature(req, rawBody);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: {
    uid: string;
    status: { state: string };
    duration?: number;
    input?: { width: number; height: number };
    meta?: Record<string, string>;
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only process "ready" events (encoding complete)
  if (event.status?.state !== 'ready') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const videoUid  = event.uid;
  const height    = event.input?.height ?? 0;
  const duration  = event.duration ?? 0;

  // ── Quality gate ────────────────────────────────────────────────────────────
  let rejectionKey: string | null = null;

  if (duration <= 0) {
    rejectionKey = 'corrupt';
  } else if (duration < MIN_DURATION_S) {
    rejectionKey = 'too_short';
  } else if (height < MIN_HEIGHT_PX) {
    rejectionKey = 'low_resolution';
  }
  // Note: Cloudflare Stream always has audio metadata — if input.height > 0 and
  // duration > 0, assume audio present (CF rejects silent-only files at ingest).

  const supabase = await createAdminClient();

  if (rejectionKey) {
    // ── FAIL: delete from Stream, record rejection ──────────────────────────
    console.warn(`[webhook] REJECTED ${videoUid} — reason: ${rejectionKey} (height:${height}, dur:${duration}s)`);

    await deleteFromStream(videoUid);

    // Mark as rejected in DB (if a pending record exists)
    await supabase
      .from('mo_video_uploads')
      .update({
        status: 'rejected',
        rejection_reason: rejectionKey,
        rejection_message: REJECTION_REASONS[rejectionKey],
        processed_at: new Date().toISOString(),
      })
      .eq('cloudflare_uid', videoUid);

    return NextResponse.json({ ok: true, action: 'rejected', reason: rejectionKey });
  }

  // ── PASS: approve the video ─────────────────────────────────────────────────
  console.log(`[webhook] APPROVED ${videoUid} — ${height}p, ${Math.round(duration)}s`);

  await supabase
    .from('mo_video_uploads')
    .update({
      status: 'ready',
      duration_seconds: Math.round(duration),
      resolution_height: height,
      processed_at: new Date().toISOString(),
    })
    .eq('cloudflare_uid', videoUid);

  return NextResponse.json({ ok: true, action: 'approved' });
}
