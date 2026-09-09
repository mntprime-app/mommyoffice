/**
 * POST /api/access/by-email
 *
 * BUG-068: Email-first course access — industry standard (Netflix / Udemy pattern).
 * Takes the buyer's email and returns all active course purchases linked to it.
 * The client then redirects to /mn/courses/[slug]/learn (single course) or
 * shows a course-picker list (multiple purchases).
 *
 * Body: { email: string }
 * Returns: { courses: Array<{ courseSlug, courseTitleMn, courseId }> }
 *
 * No tokens are exposed to the client — the learn page has no enrollment gate
 * so the slug is sufficient to start watching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json() as { email?: unknown };
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'И-мэйл хаяг буруу байна' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  // All active tokens for this email (lifetime = expires_at IS NULL, timed = not yet expired)
  const { data: tokens, error } = await supabase
    .from('mo_access_tokens')
    .select('token, course_id, expires_at')
    .eq('email', email)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    console.error('[by-email] Supabase error:', error.message);
    return NextResponse.json({ error: 'Сервер алдаа гарлаа' }, { status: 500 });
  }

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ courses: [] });
  }

  // Deduplicate by course_id (re-purchases, duplicate webhooks, etc.)
  const seenCourseIds = new Set<string>();
  const uniqueTokens = tokens.filter((t) => {
    if (seenCourseIds.has(String(t.course_id))) return false;
    seenCourseIds.add(String(t.course_id));
    return true;
  });

  const courseIds = uniqueTokens.map((t) => String(t.course_id));

  const { data: courses } = await supabase
    .from('mo_courses')
    .select('id, title_mn, slug')
    .in('id', courseIds);

  const courseMap = Object.fromEntries((courses ?? []).map((c) => [String(c.id), c]));

  const result = uniqueTokens
    .map((t) => {
      const c = courseMap[String(t.course_id)];
      if (!c) return null;
      return {
        courseId:      String(t.course_id),
        courseSlug:    String(c.slug),
        courseTitleMn: String(c.title_mn),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ courses: result });
}
