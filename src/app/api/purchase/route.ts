import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, courseId } = await req.json();

    if (!email || !courseId) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('mo_courses')
      .select('id, title_mn, price')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ ok: false, error: 'Course not found' }, { status: 404 });
    }

    // Create access token (30-day expiry)
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: tokenError } = await supabase
      .from('mo_access_tokens')
      .insert({
        email,
        course_id: courseId,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('Token insert error:', tokenError);
      return NextResponse.json({ ok: false, error: 'Could not create token' }, { status: 500 });
    }

    // Send access email via Brevo
    const accessUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com'}/mn/access/${token}`;

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: process.env.FROM_NAME || 'Mommyoffice', email: process.env.FROM_EMAIL || 'hello@mommyoffice.com' },
        to: [{ email }],
        subject: `🎉 ${course.title_mn} — Нэвтрэх холбоос`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <div style="background:#00B5AD;padding:20px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px">Mommyoffice</h1>
            </div>
            <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
              <h2 style="color:#1a1a2e;margin-top:0">${course.title_mn} хичээлд тавтай морил! 🎉</h2>
              <p style="color:#4b5563;line-height:1.6">
                Та амжилттай бүртгүүллээ. Доорх товчийг дарж хичээлдээ нэвтрэн орно уу.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="${accessUrl}" style="background:#00B5AD;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
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

    if (!brevoRes.ok) {
      const brevoErr = await brevoRes.text();
      console.error('Brevo error:', brevoErr);
      // Token was created — still return ok but log error
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Purchase API error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
