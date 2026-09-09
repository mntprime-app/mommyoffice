/**
 * POST /api/admin/reject-video
 *
 * Deletes a lesson video from Cloudflare Stream and clears stream_id / video_status in the DB.
 * Used when admin rejects (pending) or replaces (approved) a lesson video.
 *
 * CF Stream DELETE is idempotent (404 is treated as success so re-runs are safe).
 *
 * Body: { courseId: string, moduleIdx: number, lessonIdx: number }
 * Returns: { ok: true } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CF_ACCOUNT_ID       = process.env.CF_ACCOUNT_ID       ?? '';
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN ?? '';

type OutlineLesson = {
  title: string;
  stream_id?: string;
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

  const streamId = lesson.stream_id;
  if (!streamId) {
    return NextResponse.json({ error: 'No CF Stream video found for this lesson' }, { status: 400 });
  }

  // Delete from Cloudflare Stream (404 = already gone, treat as success)
  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${streamId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CF_STREAM_API_TOKEN}` },
    },
  );

  if (!cfRes.ok && cfRes.status !== 404) {
    const cfText = await cfRes.text().catch(() => '');
    console.error('[reject-video] CF Stream delete error', cfRes.status, cfText.slice(0, 200));
    return NextResponse.json({ error: `CF Stream delete failed (${cfRes.status})` }, { status: 500 });
  }

  // Clear stream_id and video_status in DB
  const { stream_id: _removed_stream, video_status: _removed_status, ...lessonRest } = lesson as OutlineLesson & Record<string, unknown>;
  void _removed_stream; void _removed_status;
  outline[moduleIdx].lessons[lessonIdx] = lessonRest as OutlineLesson;

  const { error: updateErr } = await supabase
    .from('mo_courses')
    .update({ course_outline_mn: outline, updated_at: new Date().toISOString() })
    .eq('id', courseId);

  if (updateErr) {
    // CF delete succeeded — DB failed. Log it; stream is already gone.
    console.error('[reject-video] DB update error (CF delete already succeeded)', updateErr);
  }

  return NextResponse.json({ ok: true });
}
