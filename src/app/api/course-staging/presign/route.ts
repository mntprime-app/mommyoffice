/**
 * POST /api/course-staging/presign
 *
 * Generates a Supabase Storage signed upload URL for course lesson video staging.
 * The browser uploads directly to Supabase Storage — file never passes through Vercel.
 *
 * Required:
 *   SUPABASE_SERVICE_ROLE_KEY  (already in .env.local)
 *   NEXT_PUBLIC_SUPABASE_URL   (already in .env.local)
 *   Supabase Storage bucket: "course-staging" (private, create in Supabase dashboard)
 *
 * Body: { filename: string, contentType: string, courseId: string, mi: number, li: number }
 * Returns: { token: string, storagePath: string, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'course-staging';

export async function POST(req: NextRequest) {
  let body: { filename?: string; contentType?: string; courseId?: string; mi?: number; li?: number } = {};
  try { body = await req.json(); } catch { /* empty body */ }

  const { filename, contentType, courseId, mi, li } = body;
  if (!filename || !courseId || mi === undefined || li === undefined) {
    return NextResponse.json({ error: 'filename, courseId, mi, li required' }, { status: 400 });
  }

  const ext = filename.split('.').pop() ?? 'mp4';
  const storagePath = `courses/${courseId}/module-${mi}/lesson-${li}/${Date.now()}.${ext}`;

  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error('[course-staging/presign]', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create signed upload URL. Ensure the "course-staging" bucket exists in Supabase Storage.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ token: data.token, storagePath: data.path });
}
