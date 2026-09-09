/**
 * POST /api/admin/approve-video
 *
 * Marks a lesson video as approved in the DB.
 * Looks up the lesson by stream_id (robust — no fragile array index dependency).
 *
 * Body: { courseId: string, streamId: string }
 * Returns: { ok: true } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type OutlineLesson = { title: string; stream_id?: string; video_status?: string; [key: string]: unknown };
type OutlineModule  = { title: string; lessons: OutlineLesson[] };

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: `Lesson with stream_id ${streamId} not found in course outline` }, { status: 404 });
  }

  // Mark approved
  outline[foundMi].lessons[foundLi] = { ...outline[foundMi].lessons[foundLi], video_status: 'approved' };

  const { error: updateErr } = await supabase
    .from('mo_courses')
    .update({ course_outline_mn: outline, updated_at: new Date().toISOString() })
    .eq('id', courseId);

  if (updateErr) {
    console.error('[approve-video] DB update error', updateErr);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
