/**
 * POST /api/admin/reject-video
 *
 * Deletes a lesson video from Cloudflare Stream and clears stream_id / video_status in the DB.
 * Used when admin rejects (pending) or replaces (approved) a lesson video.
 *
 * Looks up the lesson by stream_id (robust — no fragile array index dependency).
 * CF Stream DELETE is idempotent (404 is treated as success so re-runs are safe).
 *
 * Body: { courseId: string, streamId: string }
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
  [key: string]: unknown;
};
type OutlineModule = { title: string; lessons: OutlineLesson[] };

export async function POST(req: NextRequest) {
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
    return NextResponse.json({ error: 'CF_ACCOUNT_ID / CF_STREAM_API_TOKEN not configured' }, { status: 503 });
  }

  let body: { courseId?: string; streamId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { courseId, streamId } = body;
  if (!courseId || !streamId) {
    return NextResponse.json({ error: 'courseId and streamId required' }, { status: 400 });
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

  // Find lesson by stream_id (robust against client/DB index mismatches)
  let foundMi = -1, foundLi = -1;
  for (let mi = 0; mi < outline.length; mi++) {
    const lessons = outline[mi]?.lessons ?? [];
    for (let li = 0; li < lessons.length; li++) {
      if (lessons[li].stream_id === streamId) { foundMi = mi; foundLi = li; break; }
    }
    if (foundMi >= 0) break;
  }

  if (foundMi < 0) {
    // Lesson not in DB outline — may have not been saved yet. Still delete from CF Stream.
    console.warn('[reject-video] stream_id not found in DB outline, deleting from CF Stream anyway');
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

  // Clear stream_id and video_status in DB (only if we found the lesson)
  if (foundMi >= 0) {
    const lesson = outline[foundMi].lessons[foundLi];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stream_id: _s, video_status: _v, ...lessonRest } = lesson;
    outline[foundMi].lessons[foundLi] = lessonRest as OutlineLesson;

    const { error: updateErr } = await supabase
      .from('mo_courses')
      .update({ course_outline_mn: outline, updated_at: new Date().toISOString() })
      .eq('id', courseId);

    if (updateErr) {
      // CF delete succeeded — DB failed. Log it; stream is already gone.
      console.error('[reject-video] DB update error (CF delete already succeeded)', updateErr);
    }
  }

  return NextResponse.json({ ok: true });
}
