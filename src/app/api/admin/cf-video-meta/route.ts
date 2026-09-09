/**
 * GET /api/admin/cf-video-meta?streamId=xxx
 *
 * BUG-062: Backfill metadata for existing CF Stream videos that were uploaded
 * before BUG-061 introduced file_name/file_size capture. Returns the original
 * filename (from TUS Upload-Metadata) and file size from the CF Stream API.
 *
 * Response: { name: string, size: number, duration: number, readyToStream: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID        ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN  ?? '';

export async function GET(req: NextRequest) {
  const streamId = req.nextUrl.searchParams.get('streamId')?.trim();
  if (!streamId) {
    return NextResponse.json({ error: 'streamId required' }, { status: 400 });
  }
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
    return NextResponse.json({ error: 'CF_ACCOUNT_ID / CF_STREAM_API_TOKEN not configured' }, { status: 503 });
  }

  let cfRes: Response;
  try {
    cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${streamId}`,
      {
        headers: { 'Authorization': `Bearer ${CF_STREAM_API_TOKEN}` },
        // Cache for 1 hour at the Next.js fetch layer — video metadata is stable
        next: { revalidate: 3600 },
      },
    );
  } catch (err) {
    console.error('[cf-video-meta] fetch error:', err);
    return NextResponse.json({ error: 'Network error reaching CF Stream' }, { status: 502 });
  }

  if (cfRes.status === 404) {
    return NextResponse.json({ error: 'Video not found in CF Stream' }, { status: 404 });
  }
  if (!cfRes.ok) {
    const body = await cfRes.text().catch(() => '');
    console.error('[cf-video-meta] CF error', cfRes.status, body.slice(0, 200));
    return NextResponse.json({ error: `CF Stream error ${cfRes.status}` }, { status: 502 });
  }

  let data: Record<string, unknown>;
  try {
    data = await cfRes.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from CF Stream' }, { status: 502 });
  }

  const result = data?.result as Record<string, unknown> | undefined;
  const meta   = result?.meta   as Record<string, unknown> | undefined;

  return NextResponse.json({
    name:          (meta?.name          as string)  || '',
    size:          (result?.size        as number)  || 0,
    duration:      (result?.duration    as number)  || 0,
    readyToStream: Boolean(result?.readyToStream),
  });
}
