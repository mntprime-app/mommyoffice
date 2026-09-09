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

  let body: { title?: string; instructorId?: string; fileSize?: number } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const fileSize = body.fileSize;
  if (!fileSize || fileSize <= 0) {
    return NextResponse.json({ error: 'fileSize is required for TUS upload' }, { status: 400 });
  }

  const title = body.title ?? 'MommyOffice Video';

  // TUS creation: POST to /stream?direct_user=true — CF returns Location (TUS upload URL)
  // and Stream-Media-Id (the video UID). No JSON body — metadata goes in headers.
  const metadata = [
    `name ${Buffer.from(title).toString('base64')}`,
    `maxdurationseconds ${Buffer.from('7200').toString('base64')}`,
  ].join(',');

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?direct_user=true`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_STREAM_API_TOKEN}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(fileSize),
        'Upload-Metadata': metadata,
      },
    },
  );

  if (!cfRes.ok) {
    const err = await cfRes.text();
    console.error('[request-upload] Cloudflare TUS creation error:', cfRes.status, err);
    return NextResponse.json(
      { error: `Failed to create TUS upload (${cfRes.status}). Please try again.` },
      { status: 500 },
    );
  }

  const uploadUrl = cfRes.headers.get('Location');
  const videoUid  = cfRes.headers.get('Stream-Media-Id');

  if (!uploadUrl || !videoUid) {
    console.error('[request-upload] Missing Location or Stream-Media-Id headers', {
      location: uploadUrl,
      uid: videoUid,
    });
    return NextResponse.json({ error: 'Cloudflare did not return upload URL' }, { status: 500 });
  }

  return NextResponse.json({ uploadUrl, videoUid });
}
