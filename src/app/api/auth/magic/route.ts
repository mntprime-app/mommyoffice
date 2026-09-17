/**
 * /api/auth/magic — one-click post-purchase login
 *
 * Called from the link inside the QPay purchase confirmation email.
 * Validates the order's access_token (UUID generated at payment time),
 * sets the mo_user_email HTTP-only cookie, then redirects straight to
 * the course learn page — no OTP entry required.
 *
 * Query params:
 *   t     — access_token UUID (from mo_orders.access_token)
 *   order — order UUID (mo_orders.id)
 *   slug  — course slug (for the redirect URL)
 *   locale — locale, defaults to 'mn'
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token  = searchParams.get('t');
  const orderId = searchParams.get('order');
  const slug   = searchParams.get('slug');
  const locale = searchParams.get('locale') || 'mn';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com';
  const fallback = `${siteUrl}/${locale}/access`;

  // Validate required params
  if (!token || !orderId || !slug) {
    return NextResponse.redirect(`${fallback}?error=invalid_link`);
  }

  try {
    const supabase = await createAdminClient();

    // Look up the order: must be paid and token must match
    const { data: order, error } = await supabase
      .from('mo_orders')
      .select('id, status, buyer_email, access_token')
      .eq('id', orderId)
      .eq('access_token', token)
      .eq('status', 'paid')
      .maybeSingle();

    if (error) {
      console.error('[magic] DB error:', error);
      return NextResponse.redirect(`${fallback}?error=server_error`);
    }

    if (!order) {
      // Token invalid, already used redirect, or order not paid
      return NextResponse.redirect(`${fallback}?error=invalid_link`);
    }

    const email = String(order.buyer_email).toLowerCase().trim();
    const learnUrl = `${siteUrl}/${locale}/courses/${slug}/learn`;

    // Set the same mo_user_email cookie that OTP verify-code sets
    const res = NextResponse.redirect(learnUrl);
    res.cookies.set('mo_user_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches OTP flow
    });

    return res;
  } catch (err) {
    console.error('[magic] Unexpected error:', err);
    return NextResponse.redirect(`${fallback}?error=server_error`);
  }
}
