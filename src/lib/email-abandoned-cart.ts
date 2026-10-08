/**
 * Abandoned cart email templates for MommyOffice.
 * 2-stage reminder system: 1 hour and 24 hours after pending order creation.
 * Fully dynamic — variables populated from mo_orders + mo_courses at runtime.
 * Style: matches MommyOffice brand (dark bg, teal accent).
 */

export type ReminderType = '1h' | '24h';

export interface ReminderContext {
  buyerEmail: string;
  buyerName: string;   // may be empty string — use fallback 'Та' where needed
  courseTitle: string; // mo_courses.title_mn
  coursePrice: number; // mo_courses.price (MNT, whole tugriks)
  resumeUrl: string;   // /mn/checkout/resume?order_id=[id]
}

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function wrapInLayout(body: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MommyOffice</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <img src="https://mommyoffice.com/logo.png"
               alt="MommyOffice" height="44"
               style="display:block;height:44px;width:auto;max-width:220px;border:0;" border="0" />
          <div style="font-size:13px;color:#6b7280;margin-top:10px;">Таны хувийн сургалтын орчин</div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">
          <div style="height:4px;background:linear-gradient(90deg,#00B5AD 0%,#06d6cd 100%);"></div>
          <div style="padding:40px 36px;">
            ${body}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="font-size:12px;color:#374151;margin:0;line-height:1.8;">
            © 2026 MommyOffice &nbsp;·&nbsp;
            <a href="mailto:info.mommyoffice@gmail.com" style="color:#00B5AD;text-decoration:none;">info.mommyoffice@gmail.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── CTA button ────────────────────────────────────────────────────────────────
function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0 20px;">
    <a href="${url}"
       style="display:inline-block;background:linear-gradient(90deg,#00B5AD,#06d6cd);color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
      ${text}
    </a>
  </div>`;
}

// ── 1 HOUR reminder ───────────────────────────────────────────────────────────
function build1h(ctx: ReminderContext): { subject: string; html: string } {
  const name = ctx.buyerName || 'Та';
  const subject = `Таны захиалга хүлээгдэж байна: ${ctx.courseTitle}`;
  const preheader = 'Төлбөр хийгдээгүй байна. Та доорх холбоосоор орж захиалгаа баталгаажуулна уу.';

  const body = `
    <h1 style="margin:0 0 20px;text-align:left;font-size:20px;font-weight:800;color:#ffffff;line-height:1.4;">
      Эрхэм хүндэт ${name} танд энэ өдрийн мэнд хүргэе!
    </h1>

    <p style="margin:0 0 16px;font-size:14px;color:#d1d5db;line-height:1.8;">
      Та манай <strong style="color:#ffffff;">"${ctx.courseTitle}"</strong> бүтээгдэхүүн/сургалтын захиалгыг эхлүүлсэн боловч төлбөр хараахан төлөгдөөгүй байна.
    </p>

    <p style="margin:0 0 28px;font-size:14px;color:#d1d5db;line-height:1.8;">
      Хэрэв танд захиалга баталгаажуулахад ямар нэгэн хүндрэл гарсан эсвэл тусламж хэрэгтэй бол манай
      <a href="https://m.me/mommyoffice" style="color:#00B5AD;text-decoration:none;">Facebook Messenger</a>-ээр холбогдоорой.
      Бид туслахад үргэлж бэлэн байх болно.
    </p>

    <!-- Order summary -->
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;margin-bottom:8px;">
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">Сонгосон үйлчилгээ</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:14px;font-weight:600;color:#ffffff;padding-right:12px;">${ctx.courseTitle}</td>
          <td align="right" style="font-size:14px;font-weight:700;color:#00B5AD;white-space:nowrap;">${ctx.coursePrice.toLocaleString('mn-MN')} ₮</td>
        </tr>
      </table>
    </div>

    ${ctaButton('Төлбөр төлж дуусгах', ctx.resumeUrl)}

    <p style="text-align:center;font-size:12px;color:#4b5563;margin:0;line-height:1.6;">
      Та энэ и-мэйлийг хүсээгүй бол үл тоомсорлоно уу.
    </p>
  `;

  return { subject, html: wrapInLayout(body, preheader) };
}

// ── 24 HOUR reminder ─────────────────────────────────────────────────────────
function build24h(ctx: ReminderContext): { subject: string; html: string } {
  const name = ctx.buyerName || 'Та';
  const subject = `"${ctx.courseTitle}" — Таны захиалга хүлээгдэж байна`;
  const preheader = 'Таны сонирхсон бүтээгдэхүүн/сургалтын мэдээллийг сануулж байна.';

  const body = `
    <h1 style="margin:0 0 20px;text-align:left;font-size:20px;font-weight:800;color:#ffffff;line-height:1.4;">
      Эрхэм хүндэт ${name} танд энэ өдрийн мэнд хүргэе!
    </h1>

    <p style="margin:0 0 16px;font-size:14px;color:#d1d5db;line-height:1.8;">
      Та өмнө нь манай <strong style="color:#ffffff;">"${ctx.courseTitle}"</strong> үйлчилгээг сонирхож, захиалга эхлүүлсэн билээ.
      Тухайн захиалгыг баталгаажуулах холбоос маань идэвхтэй хэвээр байна.
    </p>

    <p style="margin:0 0 28px;font-size:14px;color:#d1d5db;line-height:1.8;">
      Дэлгэрэнгүй мэдээлэл болон бусад зүйлийг тодруулахыг хүсвэл
      <a href="https://m.me/mommyoffice" style="color:#00B5AD;text-decoration:none;">Facebook Messenger</a>-ээр
      дамжуулан бидэнтэй холбогдоорой.
    </p>

    <!-- Price -->
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;margin-bottom:8px;">
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">Үнэ</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:14px;font-weight:600;color:#ffffff;padding-right:12px;">${ctx.courseTitle}</td>
          <td align="right" style="font-size:14px;font-weight:700;color:#00B5AD;white-space:nowrap;">${ctx.coursePrice.toLocaleString('mn-MN')} ₮</td>
        </tr>
      </table>
    </div>

    ${ctaButton('Захиалгыг үргэлжлүүлэх', ctx.resumeUrl)}

    <p style="text-align:center;font-size:12px;color:#4b5563;margin:0;line-height:1.6;">
      Жич: Хэрэглэгч та энэхүү мэдээллийг авах шаардлагагүй гэж үзвэл энэ мессежийг үл тоомсорлоно уу.
    </p>
  `;

  return { subject, html: wrapInLayout(body, preheader) };
}

// ── Public API ────────────────────────────────────────────────────────────────
export function buildAbandonedCartEmail(
  type: ReminderType,
  ctx: ReminderContext
): { subject: string; html: string } {
  switch (type) {
    case '1h':  return build1h(ctx);
    case '24h': return build24h(ctx);
  }
}

/**
 * Send one abandoned-cart reminder via Brevo.
 * Returns true on success, false on failure.
 */
export async function sendAbandonedCartEmail(
  type: ReminderType,
  ctx: ReminderContext
): Promise<boolean> {
  const { subject, html } = buildAbandonedCartEmail(type, ctx);

  const fromEmail = process.env.FROM_EMAIL || 'hello@mommyoffice.com';
  const fromName  = process.env.FROM_NAME  || 'MommyOffice';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: ctx.buyerEmail, name: ctx.buyerName || undefined }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[abandoned-cart] Brevo error (${type}):`, res.status, err);
    return false;
  }
  return true;
}
