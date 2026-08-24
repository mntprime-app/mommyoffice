import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch access tokens for this email (admin bypasses RLS)
    const { data: tokens, error } = await supabase
      .from('mo_access_tokens')
      .select('course_id, expires_at, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ ok: true, enrollments: [] });
    }

    // Fetch courses separately
    const courseIds = [...new Set(tokens.map(t => t.course_id as string))];
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('id, slug, title_mn, cover_image_url, price')
      .in('id', courseIds);

    const courseMap = Object.fromEntries((courses || []).map(c => [c.id, c]));

    const enrollments = tokens.map(t => ({
      course_id: t.course_id as string,
      enrolled_at: t.created_at as string,
      expires_at: t.expires_at as string | null,
      mo_courses: courseMap[t.course_id as string] || null,
    }));

    return NextResponse.json({ ok: true, enrollments });
  } catch (err) {
    console.error('my-enrollments error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
