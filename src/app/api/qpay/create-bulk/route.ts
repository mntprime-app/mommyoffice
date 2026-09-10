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
    const { slugs, buyerName, buyerEmail, buyerPhone, userId } = await req.json() as {
      slugs: string[];
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string;
      userId?: string;
    };

    if (!slugs?.length || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch all courses
    const { data: courses, error: coursesErr } = await supabase
      .from('mo_courses')
      .select('id, title_mn, price, slug')
      .in('slug', slugs)
      .eq('is_published', true);

    if (coursesErr || !courses?.length) {
      return NextResponse.json({ ok: false, error: 'Courses not found' }, { status: 404 });
    }

    const total = courses.reduce((sum, c) => sum + (c.price || 0), 0);
    const primaryOrderId = randomUUID();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mommyoffice.com';

    const titleList = courses.map(c => c.title_mn).join(', ');
    const description = courses.length === 1
      ? titleList
      : `${courses.length} сургалт: ${titleList.slice(0, 120)}${titleList.length > 120 ? '…' : ''}`;

    // Get QPay token
    const token = await getQPayToken();

    // Create ONE QPay invoice for the total
    const invoiceRes = await fetch('https://merchant.qpay.mn/v2/invoice', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE!,
        sender_invoice_no: primaryOrderId,
        invoice_receiver_code: 'terminal',
        invoice_description: description,
        amount: total,
        callback_url: `${siteUrl}/api/qpay/callback?order_id=${primaryOrderId}`,
      }),
    });

    if (!invoiceRes.ok) {
      const err = await invoiceRes.text();
      console.error('QPay bulk invoice error:', err);
      return NextResponse.json({ ok: false, error: 'QPay invoice creation failed' }, { status: 502 });
    }

    const invoice = await invoiceRes.json() as {
      invoice_id: string;
      qr_text: string;
      qr_image: string;
      urls: { name: string; description: string; logo: string; link: string }[];
    };

    // Insert one mo_orders row per course, all sharing the same qpay_invoice_id.
    // Primary order (index 0) holds the TOTAL amount and is the polling target.
    // Sibling orders hold individual prices; they are processed when primary is confirmed.
    const orderRows = courses.map((course, i) => ({
      id: i === 0 ? primaryOrderId : randomUUID(),
      course_id: course.id,
      buyer_name: buyerName || null,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      amount: i === 0 ? total : course.price || 0,
      qpay_invoice_id: invoice.invoice_id,
      qpay_qr_text: invoice.qr_text,
      status: 'pending',
      ...(userId ? { user_id: userId } : {}),
    }));

    const { error: orderErr } = await supabase.from('mo_orders').insert(orderRows);

    if (orderErr) {
      console.error('Bulk order insert error:', orderErr);
      return NextResponse.json({ ok: false, error: 'Could not save order' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: primaryOrderId,
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      deepLinks: invoice.urls || [],
      amount: total,
      courseCount: courses.length,
    });
  } catch (err) {
    console.error('QPay create-bulk error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
