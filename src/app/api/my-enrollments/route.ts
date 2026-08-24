import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // PRIMARY SOURCE: mo_orders (always written on successful payment)
    // mo_access_tokens had repeated insert failures — don't rely on it alone
    const { data: orders, error: ordersError } = await supabase
      .from('mo_orders')
      .select('id, course_id, created_at, access_token, status')
      .eq('buyer_email', email)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('mo_orders query error:', ordersError);
      return NextResponse.json({ ok: false, error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ ok: true, enrollments: [] });
    }

    // Deduplicate by course_id (keep most recent order per course)
    const seen = new Set<string>();
    const uniqueOrders = orders.filter(o => {
      const id = String(o.course_id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Fetch course info
    const courseIds = uniqueOrders.map(o => String(o.course_id));
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('id, slug, title_mn, cover_image_url, price, access_duration_days')
      .in('id', courseIds);

    const courseMap = Object.fromEntries((courses || []).map(c => [String(c.id), c]));

    // Fetch expiry from mo_access_tokens (best-effort — may be empty if inserts failed)
    const accessTokenValues = uniqueOrders.map(o => o.access_token).filter(Boolean) as string[];
    let expiryMap: Record<string, string | null> = {};
    if (accessTokenValues.length > 0) {
      const { data: tokenRows } = await supabase
        .from('mo_access_tokens')
        .select('token, expires_at')
        .in('token', accessTokenValues);
      expiryMap = Object.fromEntries(
        (tokenRows || []).map(t => [String(t.token), t.expires_at as string | null])
      );
    }

    // Build enrollments — derive expiry from access_duration_days if token lookup fails
    const enrollments = uniqueOrders.map(o => {
      const course = courseMap[String(o.course_id)] || null;
      const tokenExpiry = o.access_token ? (expiryMap[String(o.access_token)] ?? undefined) : undefined;

      let expiresAt: string | null = null;
      if (tokenExpiry !== undefined) {
        expiresAt = tokenExpiry;
      } else if (course) {
        // Fallback: compute from access_duration_days
        const days = (course as Record<string, unknown>).access_duration_days as number | null;
        if (days && days > 0) {
          const d = new Date(o.created_at as string);
          d.setDate(d.getDate() + days);
          expiresAt = d.toISOString();
        }
        // else lifetime (null)
      }

      return {
        course_id: String(o.course_id),
        enrolled_at: o.created_at as string,
        expires_at: expiresAt,
        mo_courses: course,
      };
    });

    return NextResponse.json({ ok: true, enrollments });
  } catch (err) {
    console.error('my-enrollments error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
