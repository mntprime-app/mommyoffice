/**
 * GET /api/admin/staging-preview?path=courses/...
 *
 * Generates a short-lived Supabase Storage signed download URL for
 * admin preview of a staged (pending) lesson video. Redirects to it.
 *
 * Query: path — the storagePath saved in the lesson's r2_key field
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'course-staging';
const EXPIRY = 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, EXPIRY);

  if (error || !data?.signedUrl) {
    console.error('[staging-preview]', error);
    return NextResponse.json({ error: error?.message ?? 'Could not generate preview URL' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
