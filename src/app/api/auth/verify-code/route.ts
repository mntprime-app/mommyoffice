/**
 * BUG-071: Verify 6-digit OTP code and return course access.
 * POST { email, code } → { courses } | { error }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Course = { courseId: string; courseSlug: string; courseTitleMn: string; coverImageUrl: string | null };

export async function POST(req: NextRequest) {
  // IP-based rate limit: max 10 verify attempts per IP per 15 minutes
  const ip = getClientIp(req as unknown as Request);
  const { limited } = checkRateLimit(`verify:${ip}`, 10, 15 * 60 * 1000);
  if (limited) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode  = String(code).trim();

    // Find a valid, unused, unexpired code
    const now = new Date().toISOString();
    const { data: authCode, error: lookupErr } = await supabaseAdmin
      .from('mo_auth_codes')
      .select('id, expires_at, used_at')
      .eq('email', normalizedEmail)
      .eq('code', normalizedCode)
      .is('used_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupErr) {
      console.error('[verify-code] DB lookup error:', lookupErr);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }

    if (!authCode) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    }

    // Mark code as used (single-use)
    await supabaseAdmin
      .from('mo_auth_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authCode.id);

    // Fetch course access by email
    const { data: tokens, error: tokensErr } = await supabaseAdmin
      .from('mo_access_tokens')
      .select(`
        course_id,
        mo_courses!inner (
          id,
          slug,
          title_mn,
          cover_image_url
        )
      `)
      .eq('email', normalizedEmail)
      .or('expires_at.is.null,expires_at.gt.' + now);

    if (tokensErr) {
      console.error('[verify-code] tokens lookup error:', tokensErr);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }

    // Deduplicate by course_id
    const seen = new Set<string>();
    const courses: Course[] = [];
    for (const row of (tokens ?? [])) {
      const c = row.mo_courses as { id: string; slug: string; title_mn: string; cover_image_url: string | null } | null;
      if (!c || seen.has(row.course_id)) continue;
      seen.add(row.course_id);
      courses.push({
        courseId:      c.id,
        courseSlug:    c.slug,
        courseTitleMn: c.title_mn,
        coverImageUrl: c.cover_image_url ?? null,
      });
    }

    // Set a secure HTTP-only session cookie so server components can verify identity
    const res = NextResponse.json({ courses });
    res.cookies.set('mo_user_email', normalizedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    console.error('[verify-code] Unexpected error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
