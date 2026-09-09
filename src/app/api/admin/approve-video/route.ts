/**
 * POST /api/admin/approve-video
 *
 * Enterprise staging pipeline: Supabase Storage → Cloudflare Stream → Delete staging file.
 *
 * Steps:
 *  1. Load course → get lesson's storagePath (r2_key) and filename
 *  2. Generate 1-hour signed GET URL so CF Stream can pull the file
 *  3. POST to CF Stream /stream/copy → receive stream_id
 *  4. Update course_outline_mn: set stream_id + video_status='approved', clear r2_key
 *  5. Delete staging file from Supabase Storage (keeps storage at ~0 MB)
 *
 * Required env vars:
 *   CF_ACCOUNT_ID, CF_STREAM_API_TOKEN (already in .env.local)
 *
 * Body: { courseId: string, moduleIdx: number, lessonIdx: number }
 * Returns: { streamId: string } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'course-staging';
const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID       ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN ?? '';
const ALLOWED_ORIGINS     = ['mommyoffice.com', 'www.mommyoffice.com', 'mommyoffice-smoky.vercel.app'];

type OutlineLesson = {
  title: string;
  stream_id?: string;
  r2_key?: string;
  r2_filename?: string;
  video_status?: string;
};
type OutlineModule = { title: string; lessons: OutlineLesson[] };

export async function POST(req: NextRequest) {
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
    return NextResponse.json({ error: 'CF_ACCOUNT_ID / CF_STREAM_API_TOKEN not configured' }, { status: 503 });
  }

  let body: { courseId?: string; moduleIdx?: number; lessonIdx?: number } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { courseId, moduleIdx, lessonIdx } = body;
  if (!courseId || moduleIdx === undefined || lessonIdx === undefined) {
    return NextResponse.json({ error: 'courseId, moduleIdx, lessonIdx required' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // 1. Load course outline
  const { data: course, error: courseErr } = await supabase
    .from('mo_courses')
    .select('course_outline_mn')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const outline: OutlineModule[] = Array.isArray(course.course_outline_mn)
    ? (course.course_outline_mn as OutlineModule[])
    : [];

  const lesson = outline[moduleIdx]?.lessons[lessonIdx];
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const storagePath = lesson.r2_key;
  const filename    = lesson.r2_filename ?? 'video';
  if (!storagePath) {
    return NextResponse.json({ error: 'No staged video found for this lesson' }, { status: 400 });
  }

  // 2. Generate signed GET URL (1 hour) so CF Stream can pull the file
  const { data: signedData, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (signErr || !signedData?.signedUrl) {
    console.error('[approve-video] signed URL error', signErr);
    return NextResponse.json({ error: 'Could not generate staging URL' }, { status: 500 });
  }

  // 3. POST to CF Stream "copy from URL"
  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/copy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_STREAM_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: signedData.signedUrl,
        meta: { name: filename },
        allowedOrigins: ALLOWED_ORIGINS,
      }),
    },
  );

  const cfJson = await cfRes.json();
  if (!cfRes.ok || !cfJson.result?.uid) {
    console.error('[approve-video] CF Stream error', cfJson);
    return NextResponse.json(
      { error: cfJson.errors?.[0]?.message ?? 'Cloudflare Stream encoding failed' },
      { status: 500 },
    );
  }

  const streamId: string = cfJson.result.uid;

  // 4. Update outline: set stream_id, video_status='approved', clear staging fields
  outline[moduleIdx].lessons[lessonIdx] = {
    ...lesson,
    stream_id: streamId,
    video_status: 'approved',
    r2_key: undefined,
    r2_filename: undefined,
  };

  const { error: updateErr } = await supabase
    .from('mo_courses')
    .update({ course_outline_mn: outline, updated_at: new Date().toISOString() })
    .eq('id', courseId);

  if (updateErr) {
    console.error('[approve-video] DB update error', updateErr);
    // Don't fail — stream_id is valid, just log it
  }

  // 5. Delete staging file immediately to keep Supabase storage at ~0 MB
  const { error: delErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (delErr) console.warn('[approve-video] staging delete warning', delErr);

  return NextResponse.json({ streamId });
}
