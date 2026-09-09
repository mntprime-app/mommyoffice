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
  accessUrl: string,
  isLifetime: boolean,
  expiryDate: string | null
) {
  const accessNote = isLifetime
    ? 'Насан туршийн хандалт — дахин төлбөр шаардахгүй.'
    : `Хандалтын хугацаа: ${expiryDate} хүртэл.`;

  const fromName  = process.env.FROM_NAME  || 'MommyOffice';
  const fromEmail = process.env.FROM_EMAIL || 'hello@mommyoffice.com';

  const htmlContent = `<!DOCTYPE html>
<html lang="mn">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:40px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:32px;">
    <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Mommy<span style="color:#00B5AD;">Office</span></div>
    <div style="font-size:13px;color:#6b7280;margin-top:6px;">Таны хувийн сургалтын орчин</div>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">
    <div style="height:4px;background:linear-gradient(90deg,#00B5AD 0%,#06d6cd 100%);"></div>
    <div style="padding:40px 36px;">

      <!-- Icon -->
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;background:rgba(0,181,173,0.12);border:1px solid rgba(0,181,173,0.3);border-radius:16px;padding:16px 20px;font-size:36px;line-height:1;">🎉</div>
      </div>

      <!-- Heading -->
      <h1 style="margin:0 0 8px;text-align:center;font-size:22px;font-weight:800;color:#ffffff;">
        Таны сургалт бэлэн боллоо!
      </h1>
      <p style="margin:0 0 6px;text-align:center;font-size:15px;font-weight:600;color:#00B5AD;">${courseTitle}</p>
      <p style="margin:0 0 28px;text-align:center;font-size:14px;color:#9ca3af;line-height:1.6;">
        Төлбөр амжилттай хүлээн авагдлаа. Доорх товчийг дарж нэвтрэх кодоо аваарай.
      </p>

      <!-- CTA button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${accessUrl}" style="display:inline-block;background:linear-gradient(90deg,#00B5AD,#06d6cd);color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.2px;">
          Хичээлдээ нэвтрэх →
        </a>
      </div>

      <!-- Steps -->
      <div style="background:rgba(0,181,173,0.06);border:1px solid rgba(0,181,173,0.18);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#00B5AD;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Хандах алхамууд</div>
        ${[
          'Дээрх товч дарж нэвтрэх хуудас руу орно уу',
          `И-мэйл хаягаа оруулна уу — <strong style="color:#e5e5e5">${email}</strong>`,
          '6 оронт кодоо аваад нэвтэрнэ үү',
        ].map((step, i) => `
        <div style="padding:8px 0;${i < 2 ? 'border-bottom:1px solid rgba(0,181,173,0.1);' : ''}">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <div style="width:22px;height:22px;border-radius:11px;background:#00B5AD;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#ffffff;">${i + 1}</div>
            </td>
            <td style="vertical-align:middle;font-size:13px;color:#d1d5db;">${step}</td>
          </tr></table>
        </div>`).join('')}
      </div>

      <!-- Access note -->
      <div style="background:rgba(0,181,173,0.06);border:1px solid rgba(0,181,173,0.15);border-radius:8px;padding:12px 16px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#6b7280;">✅ ${accessNote}</p>
      </div>

      <div style="text-align:center;">
        <p style="font-size:12px;color:#4b5563;margin:0;line-height:1.6;">
          Энэ и-мэйлийг хүсээгүй бол үл тоомсорлоно уу.
        </p>
      </div>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-top:28px;">
    <p style="font-size:12px;color:#374151;margin:0;line-height:1.8;">
      © 2024 MommyOffice &nbsp;·&nbsp;
      <a href="mailto:info.mommyoffice@gmail.com" style="color:#00B5AD;text-decoration:none;">info.mommyoffice@gmail.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email }],
        subject: `Таны худалдаж авсан сургалтын эрх — ${courseTitle}`,
        htmlContent,
      }),
    });
  } catch (e) {
    console.error('[qpay/check] Brevo send failed:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com';

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('mo_orders')
      .select('id, status, qpay_invoice_id, course_id, buyer_email, amount, access_token, user_id')
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
      });

      const email = String(order.buyer_email);
      const orderUserId = (order as Record<string, unknown>).user_id as string | null;

      // ── Scenario B: logged-in user — already has mo_session ──────────────
      if (orderUserId) {
        await supabase.from('mo_enrollments').upsert({
          course_id: String(order.course_id),
          email: email,
          order_id: orderId,
          user_id: orderUserId,
        }, { onConflict: 'email,course_id' });

        // Send confirmation email even for logged-in users
        if (course) {
          const accessUrl = `${siteUrl}/mn/access?email=${encodeURIComponent(email)}`;
          await sendWelcomeEmail(email, String(course.title_mn), accessUrl, isLifetime, expiryDateStr);
        }

        return NextResponse.json({
          ok: true,
          paid: true,
          accessUrl: `${siteUrl}/mn/my-courses`,
        });
      }

      // ── Scenario A: guest checkout — passwordless OTP flow ───────────────
      // Access link pre-fills their email on /mn/access so they just request a code
      const accessUrl = `${siteUrl}/mn/access?email=${encodeURIComponent(email)}`;

      if (course) {
        await sendWelcomeEmail(
          email,
          String(course.title_mn),
          accessUrl,
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
