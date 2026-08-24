import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

async function getQPayToken(): Promise<string> {
  const username = process.env.QPAY_USERNAME!;
  const password = process.env.QPAY_PASSWORD!;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch('https://merchant.qpay.mn/v2/auth/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error('QPay auth failed');
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function sendWelcomeEmail(
  email: string,
  courseTitle: string,
  welcomeUrl: string,
  isLifetime: boolean,
  expiryDate: string | null
) {
  const accessNote = isLifetime
    ? 'Насан туршийн хандалт — дахин төлбөр шаардахгүй.'
    : `Хандалтын хугацаа: ${expiryDate} хүртэл.`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.FROM_NAME || 'Mommyoffice',
          email: process.env.FROM_EMAIL || 'hello@mommyoffice.com',
        },
        to: [{ email }],
        subject: `🎉 ${courseTitle} — Тавтай морил!`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
            <div style="background:#00B5AD;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">MommyOFFICE</h1>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
              <h2 style="color:#111;margin-top:0;font-size:20px">${courseTitle} хичээлд тавтай морил! 🎉</h2>
              <p style="color:#4b5563;line-height:1.7;font-size:15px">
                Та амжилттай бүртгүүллээ. Доорх товчийг дарж хичээлдээ нэвтэрч эхэлнэ үү.
              </p>
              <div style="text-align:center;margin:32px 0">
                <a href="${welcomeUrl}"
                  style="background:#00B5AD;color:#fff;padding:16px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
                  Хичээл эхлүүлэх →
                </a>
              </div>
              <div style="background:#f0fdf9;border:1px solid #99f6e4;border-radius:8px;padding:14px 16px;margin-bottom:20px">
                <p style="margin:0;font-size:13px;color:#065f46">✅ ${accessNote}</p>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
                Асуулт байвал <a href="mailto:info.mommyoffice@gmail.com" style="color:#00B5AD">info.mommyoffice@gmail.com</a> хаягт холбогдоно уу.
              </p>
            </div>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.error('Brevo send failed:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice-smoky.vercel.app';

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('mo_orders')
      .select('id, status, qpay_invoice_id, course_id, buyer_email, amount, access_token')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Already paid — return immediately
    if (order.status === 'paid' && order.access_token) {
      return NextResponse.json({
        ok: true,
        paid: true,
        accessUrl: `${siteUrl}/mn/my-courses`,
      });
    }

    // Ask QPay
    const token = await getQPayToken();
    const checkRes = await fetch('https://merchant.qpay.mn/v2/payment/check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object_type: 'INVOICE',
        object_id: order.qpay_invoice_id,
        offset: { page_number: 1, page_limit: 100 },
      }),
    });

    if (!checkRes.ok) {
      return NextResponse.json({ ok: true, paid: false });
    }

    const checkData = await checkRes.json() as { count: number; paid_amount: number };

    if (checkData.count > 0 && checkData.paid_amount >= order.amount) {
      const accessToken = randomUUID();

      // Fetch course (include access_duration_days)
      const { data: course } = await supabase
        .from('mo_courses')
        .select('title_mn, slug, access_duration_days')
        .eq('id', String(order.course_id))
        .single();

      // Determine expiry: null = lifetime
      const durationDays = (course as Record<string, unknown> | null)?.access_duration_days as number | null;
      const isLifetime = !durationDays || durationDays === 0;
      let expiresAt: string | null = null;
      let expiryDateStr: string | null = null;
      if (!isLifetime) {
        const d = new Date();
        d.setDate(d.getDate() + durationDays!);
        expiresAt = d.toISOString();
        expiryDateStr = d.toISOString().split('T')[0];
      }

      // 1. Update order status
      await supabase.from('mo_orders').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        access_token: accessToken,
      }).eq('id', orderId);

      // 2. Upsert enrollment
      await supabase.from('mo_enrollments').upsert({
        course_id: String(order.course_id),
        email: String(order.buyer_email),
        order_id: orderId,
      }, { onConflict: 'email,course_id' });

      // 3. Create access token (null expires_at = lifetime)
      await supabase.from('mo_access_tokens').insert({
        email: String(order.buyer_email),
        course_id: String(order.course_id),
        token: accessToken,
        expires_at: expiresAt,
        used: false,
      });

      // 4. Create / ensure Supabase Auth user exists
      const email = String(order.buyer_email);
      let welcomeUrl = `${siteUrl}/mn/my-courses`;

      try {
        // Try to create user (noop if already exists)
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            source: 'mommyoffice_payment',
            enrolled_at: new Date().toISOString(),
          },
        });
      } catch {
        // User likely already exists — that's fine
      }

      try {
        // Generate magic link → /welcome page (handles password setup)
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: `${siteUrl}/mn/welcome` },
        });
        const actionLink = (linkData as Record<string, unknown> | null)?.properties as Record<string, unknown> | undefined;
        if (actionLink?.action_link) {
          welcomeUrl = String(actionLink.action_link);
        }
      } catch (e) {
        console.error('Magic link generation failed:', e);
        // Fall back to /my-courses
        welcomeUrl = `${siteUrl}/mn/my-courses`;
      }

      // 5. Send welcome email
      if (course) {
        await sendWelcomeEmail(
          email,
          String(course.title_mn),
          welcomeUrl,
          isLifetime,
          expiryDateStr
        );
      }

      return NextResponse.json({
        ok: true,
        paid: true,
        accessUrl: `${siteUrl}/mn/my-courses`,
      });
    }

    return NextResponse.json({ ok: true, paid: false });
  } catch (err) {
    console.error('QPay check error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
