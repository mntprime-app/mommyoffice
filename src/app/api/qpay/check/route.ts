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

async function sendAccessEmail(email: string, courseTitle: string, accessUrl: string) {
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
        subject: `🎉 ${courseTitle} — Хичээлд нэвтрэх холбоос`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <div style="background:#00B5AD;padding:20px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px">Mommyoffice</h1>
            </div>
            <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
              <h2 style="color:#1a1a2e;margin-top:0">${courseTitle} хичээлд тавтай морил! 🎉</h2>
              <p style="color:#4b5563;line-height:1.6">
                Та амжилттай бүртгүүллээ. Доорх товчийг дарж хичээлдээ нэвтрэн орно уу.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="${accessUrl}"
                  style="background:#00B5AD;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
                  Хичээл эхлүүлэх →
                </a>
              </div>
              <p style="color:#9ca3af;font-size:13px;text-align:center">
                Энэ холбоос 30 хоног хүчинтэй. Хуваалцахгүй байна уу.
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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com';
      return NextResponse.json({
        ok: true,
        paid: true,
        accessUrl: `${siteUrl}/mn/access/${String(order.access_token)}`,
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
      // Payment confirmed — update order, create enrollment, send email
      const accessToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

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

      // 3. Create access token
      await supabase.from('mo_access_tokens').insert({
        email: String(order.buyer_email),
        course_id: String(order.course_id),
        token: accessToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

      // 4. Fetch course title for email
      const { data: course } = await supabase
        .from('mo_courses')
        .select('title_mn, slug')
        .eq('id', String(order.course_id))
        .single();

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com';
      const accessUrl = `${siteUrl}/mn/access/${accessToken}`;

      if (course) {
        await sendAccessEmail(String(order.buyer_email), String(course.title_mn), accessUrl);
      }

      return NextResponse.json({ ok: true, paid: true, accessUrl });
    }

    return NextResponse.json({ ok: true, paid: false });
  } catch (err) {
    console.error('QPay check error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
