/**
 * GET /api/stream/token?videoId=<cloudflare_stream_id>
 *
 * SECURITY MODEL:
 *   Access is controlled entirely by this Supabase enrollment gate.
 *   CF-level signed JWTs have been removed from the production path.
 *
 *   WHY: `crypto.subtle.sign()` never throws on a wrong key — it produces a
 *   structurally valid JWT signed with the wrong private key. CF's public-key
 *   check then silently rejects it showing "This content is blocked." This is
 *   undetectable server-side without an extra round-trip to CF. The Vercel env
 *   var holding the JWK is fragile — any edit in the Vercel UI can corrupt it
 *   without warning. After two separate incidents of this, CF JWT signing is
 *   removed from this path. (See registry: BUG-089 and BUG-089 regression.)
 *
 *   SECURITY GUARANTEE (without CF JWTs):
 *   1. This endpoint returns 401 if no `mo_user_email` cookie.
 *   2. Returns 403 if the user is not enrolled in a course containing this videoId.
 *   3. Video IDs (cloudflare_stream_id) are NEVER returned to the student in any
 *      other API response — they only exist in the admin panel. A student who
 *      passes this gate cannot share a videoId they never saw.
 *   4. requireSignedURLs is disabled on CF videos (run disable-signed-urls.ps1).
 *
 *   POST-LAUNCH: Re-enable CF signed tokens once key management is stable.
 *   See registry "Restoring signed tokens" SOP for the correct procedure.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  // ── Enrollment gate ────────────────────────────────────────────────────────
  // Read the HTTP-only session cookie set by /api/auth/verify-code
  const userEmail = req.cookies.get('mo_user_email')?.value ?? null;
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user has a valid, non-expired access token for a course that contains
  // this videoId (either as course-level cloudflare_stream_id or a lesson stream_id).
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const now = new Date().toISOString();

  const { data: courseMatch } = await supabase
    .from('mo_access_tokens')
    .select(`course_id, mo_courses!inner(cloudflare_stream_id)`)
    .eq('email', userEmail)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(50);

  const enrolledCourseIds = (courseMatch ?? []).map((r) => r.course_id);
  let authorized = false;

  if (enrolledCourseIds.length > 0) {
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('id, cloudflare_stream_id, course_outline_mn')
      .in('id', enrolledCourseIds);

    for (const course of courses ?? []) {
      // Match course-level cloudflare_stream_id
      if (course.cloudflare_stream_id === videoId) { authorized = true; break; }

      // Match lesson-level stream_id inside course_outline_mn JSON
      try {
        const outline = typeof course.course_outline_mn === 'string'
          ? JSON.parse(course.course_outline_mn)
          : course.course_outline_mn;
        if (Array.isArray(outline)) {
          for (const mod of outline) {
            for (const lesson of (mod?.lessons ?? [])) {
              if (lesson?.stream_id === videoId) { authorized = true; break; }
            }
            if (authorized) break;
          }
        }
      } catch { /* ignore JSON parse errors */ }
      if (authorized) break;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ── End enrollment gate ────────────────────────────────────────────────────

  // Enrollment confirmed. Return direct CF Stream embed URL.
  // requireSignedURLs must be false on CF videos — run disable-signed-urls.ps1.
  // Unsigned direct embed. CF format: iframe.cloudflarestream.com/{videoId} — NO /iframe suffix.
  // (/iframe is only for signed customer-subdomain URLs: customer-{sub}.cloudflarestream.com/{JWT}/iframe)
  const iframeUrl = `https://iframe.cloudflarestream.com/${videoId}`;

  return NextResponse.json({ iframeUrl }, {
    // no-store: always re-validate enrollment on each lesson access — never serve
    // a cached URL to a user whose access may have since expired.
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
