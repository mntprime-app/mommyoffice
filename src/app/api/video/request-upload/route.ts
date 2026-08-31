/**
 * POST /api/video/request-upload
 *
 * Creates a Cloudflare Stream one-time TUS upload URL.
 * The teacher's browser uploads directly to Cloudflare using this URL,
 * but the teacher only sees MommyOffice branding — CF is invisible in the UI.
 *
 * Required env vars:
 *   CF_ACCOUNT_ID        — Cloudflare account ID (Dashboard → right sidebar)
 *   CF_STREAM_API_TOKEN  — API token with Stream:Edit permission
 *
 * Body (JSON):
 *   { title: string, instructorId?: string, maxDurationSeconds?: number }
 *
 * Returns:
 *   { uploadUrl: string, videoUid: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID        ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN  ?? '';

// Allowed origins — videos are restricted to these domains only
const ALLOWED_ORIGINS = [
  'mommyoffice.com',
  'www.mommyoffice.com',
  'mommyoffice-smoky.vercel.app',
];

export async function POST(req: NextRequest) {
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
    return NextResponse.json(
      { error: 'CF_ACCOUNT_ID / CF_STREAM_API_TOKEN not configured' },
      { status: 503 },
    );
  }

  let body: { title?: string; instructorId?: string; maxDurationSeconds?: number } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const maxDurationSeconds = body.maxDurationSeconds ?? 7200; // default 2 hours max
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // URL expires in 1 hour

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_STREAM_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds,
        expiry,
        meta: {
          name: body.title ?? 'MommyOffice Video',
          ...(body.instructorId ? { instructorId: body.instructorId } : {}),
        },
        requireSignedURLs: true,
        allowedOrigins: ALLOWED_ORIGINS,
      }),
    },
  );

  if (!cfRes.ok) {
    const err = await cfRes.text();
    console.error('[request-upload] Cloudflare error:', err);
    return NextResponse.json(
      { error: 'Failed to create upload URL. Please try again.' },
      { status: 500 },
    );
  }

  const cfData = await cfRes.json() as {
    result: { uid: string; uploadURL: string };
    success: boolean;
  };

  if (!cfData.success) {
    return NextResponse.json({ error: 'Cloudflare returned an error' }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl: cfData.result.uploadURL,
    videoUid: cfData.result.uid,
  });
}
