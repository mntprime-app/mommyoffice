/**
 * POST /api/admin/delete-stream
 *
 * Deletes a Cloudflare Stream video by streamId only — no DB update.
 * Used by the new-course page where the course hasn't been saved yet,
 * so there is no courseId/moduleIdx/lessonIdx to look up in the DB.
 *
 * Body: { streamId: string }
 * Returns: { ok: true } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID       ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN ?? '';

export async function POST(req: NextRequest) {
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
    return NextResponse.json({ error: 'CF not configured' }, { status: 503 });
  }

  let body: { streamId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { streamId } = body;
  if (!streamId || typeof streamId !== 'string') {
    return NextResponse.json({ error: 'streamId required' }, { status: 400 });
  }

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${streamId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CF_STREAM_API_TOKEN}` },
    },
  );

  // 404 = already gone, treat as success
  if (!cfRes.ok && cfRes.status !== 404) {
    return NextResponse.json({ error: `CF Stream delete failed (${cfRes.status})` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
