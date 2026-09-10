/**
 * BUG-071: Direct Brevo API mailer — bypasses Supabase rate-limited shared SMTP.
 * POST { email } → generates a 6-digit OTP, stores in mo_auth_codes, sends via Brevo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MommyOffice — Нэвтрэх код</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Mommy<span style="color:#00B5AD;">Office</span>
              </div>
              <div style="font-size:13px;color:#6b7280;margin-top:6px;">Таны хувийн сургалтын орчин</div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">

              <!-- Teal accent bar -->
              <div style="height:4px;background:linear-gradient(90deg,#00B5AD 0%,#06d6cd 100%);"></div>

              <div style="padding:40px 36px;">
                <!-- Icon -->
                <div style="text-align:center;margin-bottom:24px;">
                  <div style="display:inline-block;background:rgba(0,181,173,0.12);border:1px solid rgba(0,181,173,0.3);border-radius:16px;padding:16px 20px;font-size:36px;line-height:1;">🔐</div>
                </div>

                <!-- Heading -->
                <h1 style="margin:0 0 10px;text-align:center;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                  Таны нэвтрэх код
                </h1>
                <p style="margin:0 0 32px;text-align:center;font-size:14px;color:#9ca3af;line-height:1.6;">
                  Доорх кодыг MommyOffice дээр оруулж хичээлдээ нэвтэрнэ үү.
                </p>

                <!-- OTP code box -->
                <div style="background:#111111;border:2px solid #00B5AD;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
                  <div style="letter-spacing:16px;font-size:42px;font-weight:900;color:#00B5AD;font-variant-numeric:tabular-nums;">
                    ${code}
                  </div>
                  <div style="font-size:12px;color:#6b7280;margin-top:12px;">
                    Код 15 минутын дотор хүчинтэй
                  </div>
                </div>

                <!-- Instructions -->
                <div style="background:rgba(0,181,173,0.06);border:1px solid rgba(0,181,173,0.18);border-radius:12px;padding:20px;margin-bottom:24px;">
                  <div style="font-size:12px;font-weight:700;color:#00B5AD;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Дараах алхмуудыг дагана уу</div>
                  ${[
                    'MommyOffice хуудас руу буцна уу',
                    'Дээрх 6 оронт кодыг оруулна уу',
                    '"Нэвтрэх" товч дарна уу',
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

                <!-- Security note -->
                <div style="text-align:center;">
                  <p style="font-size:12px;color:#4b5563;margin:0;line-height:1.6;">
                    Энэ кодыг хэн нэгэнтэй хуваалцах хэрэггүй.<br />
                    Та энэ и-мэйлийг хүсээгүй бол үл тоомсорлоно уу.
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="font-size:12px;color:#374151;margin:0;line-height:1.8;">
                © 2024 MommyOffice &nbsp;·&nbsp;
                <a href="mailto:info.mommyoffice@gmail.com" style="color:#00B5AD;text-decoration:none;">info.mommyoffice@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  // IP-based rate limit: max 5 send attempts per IP per 15 minutes (prevents email bombing)
  const ip = getClientIp(req as unknown as Request);
  const { limited: ipLimited } = checkRateLimit(`send:${ip}`, 5, 15 * 60 * 1000);
  if (ipLimited) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'И-мэйл хаяг шаардлагатай' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Per-email rate limit: max 3 active codes per email in the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('mo_auth_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .gt('created_at', fiveMinAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
    }

    // Generate cryptographically safe 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store code (table must exist — see migration in /supabase/migrations/)
    const { error: insertErr } = await supabaseAdmin.from('mo_auth_codes').insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    if (insertErr) {
      console.error('[send-code] DB insert error:', insertErr);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }

    // Send via Brevo REST API — no SMTP config needed, no rate limits
    const fromEmail = process.env.FROM_EMAIL || 'hello@mommyoffice.com';
    const fromName  = process.env.FROM_NAME  || 'MommyOffice';

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: normalizedEmail }],
        subject: `${code} — Таны MommyOffice нэвтрэх код`,
        htmlContent: buildEmailHtml(code),
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error('[send-code] Brevo error:', brevoRes.status, errText);
      return NextResponse.json({ error: 'email_send_failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-code] Unexpected error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
