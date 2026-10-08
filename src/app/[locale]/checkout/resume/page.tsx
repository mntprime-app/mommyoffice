/**
 * /[locale]/checkout/resume?order_id=xxx
 *
 * Abandoned-cart resume page — linked from reminder emails.
 * Server creates a fresh QPay invoice (reusing the same order_id so the
 * callback URL stays valid), updates mo_orders, then renders the QR
 * directly via ResumeCheckoutView (no re-entry of buyer details).
 *
 * Safety checks:
 *   - Order must exist and have status = 'pending'
 *   - Course must exist and be is_published = true
 *   - If already paid → redirect to /mn/my-courses
 */
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ResumeCheckoutView } from '@/components/ui/ResumeCheckoutView';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getQPayToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.QPAY_USERNAME!}:${process.env.QPAY_PASSWORD!}`
  ).toString('base64');
  const res = await fetch('https://merchant.qpay.mn/v2/auth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`QPay auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

interface ResumePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order_id?: string }>;
}

export default async function ResumeCheckoutPage({ params, searchParams }: ResumePageProps) {
  const { locale } = await params;
  const { order_id } = await searchParams;

  if (!order_id) notFound();

  // ── Fetch order ────────────────────────────────────────────────────────────
  const { data: order } = await supabase
    .from('mo_orders')
    .select('id, status, course_id, buyer_name, buyer_email, buyer_phone, amount')
    .eq('id', order_id)
    .single();

  if (!order) notFound();

  // Already paid → send to my-courses
  if (order.status === 'paid') {
    redirect(`/${locale}/my-courses`);
  }

  if (order.status !== 'pending') notFound();

  // ── Fetch course — must be published (respect admin visibility toggle) ─────
  const { data: course } = await supabase
    .from('mo_courses')
    .select('id, slug, title_mn, price')
    .eq('id', order.course_id)
    .eq('is_published', true)   // ← admin toggle check — unpublished = 404
    .single();

  if (!course) notFound();

  // ── Create fresh QPay invoice ──────────────────────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mommyoffice.com';
  let qrImage = '';
  let deepLinks: { name: string; logo: string; link: string }[] = [];

  try {
    const token = await getQPayToken();
    const invoiceRes = await fetch('https://merchant.qpay.mn/v2/invoice', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE!,
        sender_invoice_no: order.id,           // reuse same order ID
        invoice_receiver_code: 'terminal',
        invoice_description: course.title_mn,
        amount: order.amount,
        callback_url: `${siteUrl}/api/qpay/callback?order_id=${order.id}`,
      }),
      cache: 'no-store',
    });

    if (invoiceRes.ok) {
      const invoice = await invoiceRes.json() as {
        invoice_id: string;
        qr_text: string;
        qr_image: string;
        urls: { name: string; description: string; logo: string; link: string }[];
      };

      // Update the existing mo_orders row with fresh invoice details
      await supabase
        .from('mo_orders')
        .update({
          qpay_invoice_id: invoice.invoice_id,
          qpay_qr_text: invoice.qr_text,
        })
        .eq('id', order.id);

      qrImage = invoice.qr_image;
      deepLinks = (invoice.urls || []).map(u => ({
        name: u.name,
        logo: u.logo,
        link: u.link,
      }));
    }
  } catch (err) {
    console.error('[checkout/resume] QPay invoice creation failed:', err);
    // Fall through — ResumeCheckoutView handles the empty qrImage case gracefully
  }

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <ResumeCheckoutView
        locale={locale}
        orderId={order.id}
        courseTitle={course.title_mn}
        courseSlug={course.slug}
        amount={order.amount}
        buyerName={order.buyer_name ?? ''}
        buyerEmail={order.buyer_email}
        qrImage={qrImage}
        deepLinks={deepLinks}
      />
    </div>
  );
}
