/**
 * POST /api/admin/delete-staged-video
 * @deprecated — Supabase staging bucket removed (BUG-066). Route kept as stub to avoid 404s.
 * All video management now uses /api/admin/reject-video (CF Stream DELETE) instead.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Supabase staging bucket deprecated. Use /api/admin/reject-video instead.' },
    { status: 410 },
  );
}
