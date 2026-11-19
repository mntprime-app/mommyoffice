/**
 * POST /api/advertise/contact
 * Sends the advertise contact form to info.mommyoffice@gmail.com via Brevo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';

// Rate-limit: max 3 submissions per IP per 15 min
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX       = 3;
const ipMap          = new Map<string, { count: number; first: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const rec = ipMap.get(ip);
  if (!rec || now - rec.first > RATE_WINDOW_MS) {
    ipMap.set(ip, { count: 1, first: now });
    return true;
  }
  if (rec.count >= RATE_MAX) return false;
  rec.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const { name, phone, email, message } = await req.json() as {
      name?: string; phone?: string; email?: string; message?: string;
    };

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'message_too_long' }, { status: 400 });
    }

    // Fetch the recipient email from site settings (fallback to env)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await supabase
      .from('mo_site_settings')
      .select('value')
      .eq('key', 'advertise_contact_email')
      .single();
    const toEmail = data?.value || 'info.mommyoffice@gmail.com';

    const fromEmail = process.env.FROM_EMAIL || 'hello@mommyoffice.com';
    const fromName  = process.env.FROM_NAME  || 'MommyOffice';

    const htmlContent = `
<!DOCTYPE html>
<html lang="mn">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#111;border-radius:12px;overflow:hidden;border:1px solid #1e1e1e;">
        <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #1e1e1e;">
          <img src="https://mommyoffice.com/whitelogo.png" alt="MommyOffice" height="34" style="display:block;height:34px;width:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#00B5AD;">Шинэ сурталчилгааны асуулга</p>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#fff;">Захиалгын мэдээлэл</h1>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0 0 2px;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:1px;">Нэр</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#e5e5e5;">${escHtml(name)}</p>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0 0 2px;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:1px;">Имэйл</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#00B5AD;">${escHtml(email)}</p>
            </td></tr>
            ${phone ? `<tr><td style="padding:12px 0;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0 0 2px;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:1px;">Утас</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#e5e5e5;">${escHtml(phone)}</p>
            </td></tr>` : ''}
            <tr><td style="padding:12px 0;">
              <p style="margin:0 0 8px;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:1px;">Мессэж</p>
              <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.7;white-space:pre-wrap;">${escHtml(message)}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#0a0a0a;border-top:1px solid #1e1e1e;">
          <p style="margin:0;font-size:12px;color:#374151;">mommyoffice.com · Сурталчилгааны асуулга</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender:      { name: fromName, email: fromEmail },
        to:          [{ email: toEmail }],
        replyTo:     { email: email.trim(), name: name.trim() },
        subject:     `Сурталчилгааны асуулга: ${name.trim()} — MommyOffice`,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error('[advertise/contact] Brevo error:', brevoRes.status, errText);
      return NextResponse.json({ error: 'send_failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[advertise/contact] Unexpected error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
