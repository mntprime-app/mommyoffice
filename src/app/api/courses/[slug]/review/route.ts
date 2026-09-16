/**
 * POST /api/courses/[slug]/review  — submit a star rating + optional text review
 * GET  /api/courses/[slug]/review  — check if the current user already reviewed this course
 *
 * Security:
 *   - Reads `mo_user_email` HTTP-only cookie (same gate as /api/stream/token)
 *   - Verifies active enrollment in mo_access_tokens before accepting a review
 *   - One review per user per course (upsert on user_email + course_id unique index)
 *   - Auto-approved (is_approved = true) for launch; flip to false post-launch
 *     for manual moderation if needed.
 *
 * Non-regression: this file is new. It does not import or modify any existing
 * route, component, or middleware.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── helpers ────────────────────────────────────────────────────────────────────
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// ── GET — did this user already review? ────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const userEmail = req.cookies.get('mo_user_email')?.value ?? null;
  if (!userEmail) return NextResponse.json({ existing: null });

  const supabase = await getSupabase();

  const { data: course } = await supabase
    .from('mo_courses')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (!course) return NextResponse.json({ existing: null });

  const { data } = await supabase
    .from('mo_reviews')
    .select('rating, review_text')
    .eq('course_id', course.id)
    .eq('user_email', userEmail)
    .maybeSingle();

  return NextResponse.json({ existing: data ?? null });
}

// ── POST — submit (or update) a review ────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Auth gate — identical pattern to /api/stream/token
  const userEmail = req.cookies.get('mo_user_email')?.value ?? null;
  if (!userEmail) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
  }

  // Parse body
  let body: { rating?: unknown; review_text?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Буруу хүсэлт' }, { status: 400 }); }

  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Үнэлгээ 1–5 байх ёстой' }, { status: 400 });
  }
  const reviewText = String(body.review_text ?? '').trim().slice(0, 1000) || null;

  const supabase = await getSupabase();

  // Resolve slug → course id
  const { data: course } = await supabase
    .from('mo_courses')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (!course) {
    return NextResponse.json({ error: 'Сургалт олдсонгүй' }, { status: 404 });
  }

  // Enrollment gate — must have active access token
  const now = new Date().toISOString();
  const { data: access } = await supabase
    .from('mo_access_tokens')
    .select('id')
    .eq('email', userEmail)
    .eq('course_id', course.id)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)
    .maybeSingle();

  if (!access) {
    return NextResponse.json({ error: 'Энэ сургалтад бүртгэлгүй байна' }, { status: 403 });
  }

  // Derive display name from email (before the @)
  const reviewerName = userEmail.split('@')[0];

  // Upsert — one review per user per course
  // Requires: unique index on (user_email, course_id) — see SQL migration below
  const { error: upsertErr } = await supabase
    .from('mo_reviews')
    .upsert(
      {
        course_id:     course.id,
        user_email:    userEmail,
        reviewer_name: reviewerName,
        rating,
        review_text:   reviewText,
        is_approved:   true,   // auto-approve for launch; flip to false for moderation
      },
      { onConflict: 'user_email,course_id' },
    );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // Recalculate aggregate rating on mo_courses
  const { data: allReviews } = await supabase
    .from('mo_reviews')
    .select('rating')
    .eq('course_id', course.id)
    .eq('is_approved', true);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await supabase
      .from('mo_courses')
      .update({
        rating:       Math.round(avg * 10) / 10,
        rating_count: allReviews.length,
      })
      .eq('id', course.id);
  }

  return NextResponse.json({ success: true });
}
