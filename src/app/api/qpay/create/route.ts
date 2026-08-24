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
  if (!res.ok) throw new Error(`QPay auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { slug, buyerName, buyerEmail, buyerPhone } = await req.json() as {
      slug: string; buyerName: string; buyerEmail: string; buyerPhone: string;
    };

    if (!slug || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch course
    const { data: course, error: courseErr } = await supabase
      .from('mo_courses')
      .select('id, title_mn, price')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ ok: false, error: 'Course not found' }, { status: 404 });
    }

    const orderId = randomUUID();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice-smoky.vercel.app';

    // Get QPay token
    const token = await getQPayToken();

    // Create QPay invoice
    const invoiceRes = await fetch('https://merchant.qpay.mn/v2/invoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE!,
        sender_invoice_no: orderId,
        invoice_receiver_code: 'terminal',
        invoice_description: course.title_mn,
        amount: course.price,
        callback_url: `${siteUrl}/api/qpay/callback?order_id=${orderId}`,
      }),
    });

    if (!invoiceRes.ok) {
      const err = await invoiceRes.text();
      console.error('QPay invoice error:', err);
      return NextResponse.json({ ok: false, error: 'QPay invoice creation failed' }, { status: 502 });
    }

    const invoice = await invoiceRes.json() as {
      invoice_id: string;
      qr_text: string;
      qr_image: string;
      urls: { name: string; description: string; logo: string; link: string }[];
    };

    // Insert mo_orders row
    const { error: orderErr } = await supabase.from('mo_orders').insert({
      id: orderId,
      course_id: course.id,
      buyer_name: buyerName || null,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      amount: course.price,
      qpay_invoice_id: invoice.invoice_id,
      qpay_qr_text: invoice.qr_text,
      status: 'pending',
    });

    if (orderErr) {
      console.error('Order insert error:', orderErr);
      return NextResponse.json({ ok: false, error: 'Could not save order' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,      // base64 PNG
      deepLinks: invoice.urls || [],
      amount: course.price,
      courseTitle: course.title_mn,
    });
  } catch (err) {
    console.error('QPay create error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
