import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { OrdersFilters } from '@/components/ui/OrdersFilters';
import { OrdersTable, type OrderRow } from '@/components/ui/OrdersTable';

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; status?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { from, to, status, q } = await searchParams;

  // Auth guard — proxy.ts also checks, this is a defence-in-depth fallback
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/admin/login`);

  // Build query
  const adminClient = await createAdminClient();
  let query = adminClient
    .from('mo_orders')
    .select('id, buyer_name, buyer_email, buyer_phone, course_id, amount, status, qpay_invoice_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
  if (to)   query = query.lte('created_at', `${to}T23:59:59.999Z`);
  if (status && status !== 'all') query = query.eq('status', status);
  if (q) query = query.or(`buyer_email.ilike.%${q}%,buyer_name.ilike.%${q}%`);

  const { data: raw, error: ordersError } = await query;
  if (ordersError) console.error('[admin/orders] query error:', ordersError.message);
  const orders = raw || [];

  // Resolve course titles
  const courseIds = [...new Set(orders.map(o => o.course_id).filter(Boolean))];
  const { data: courses } = courseIds.length > 0
    ? await adminClient.from('mo_courses').select('id, title_mn').in('id', courseIds)
    : { data: [] };
  const courseMap = Object.fromEntries((courses || []).map(c => [c.id, c.title_mn as string]));

  // Summary metrics (over filtered period)
  const paid = orders.filter(o => o.status === 'paid');
  const pending = orders.filter(o => o.status === 'pending');
  const periodRevenue = paid.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  // All-time revenue (unfiltered) for the headline card
  const { data: allPaid } = await adminClient
    .from('mo_orders')
    .select('amount')
    .eq('status', 'paid');
  const totalRevenue = (allPaid || []).reduce((s, o) => s + (Number(o.amount) || 0), 0);

  // Today revenue (unfiltered)
  const todayStr = new Date().toDateString();
  const { data: todayOrders } = await adminClient
    .from('mo_orders')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
  const todayRevenue = (todayOrders || []).reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const isFiltered = !!(from || to || (status && status !== 'all') || q);

  const metricCards = [
    { label: 'Нийт орлого (нийт)', value: `${totalRevenue.toLocaleString()}₮`, color: '#00B5AD', icon: '💰', sub: 'Бүх цаг үеийн' },
    { label: isFiltered ? 'Шүүлтийн орлого' : 'Өнөөдрийн орлого', value: isFiltered ? `${periodRevenue.toLocaleString()}₮` : `${todayRevenue.toLocaleString()}₮`, color: '#6366f1', icon: '📅', sub: isFiltered ? `${paid.length} захиалга` : todayStr },
    { label: 'Захиалга', value: String(orders.length), color: '#f59e0b', icon: '🧾', sub: isFiltered ? 'Шүүсэн хугацаанд' : 'Нийт' },
    { label: 'Амжилттай / Хүлээгдэж байна', value: `${paid.length} / ${pending.length}`, color: '#10b981', icon: '✅', sub: isFiltered ? 'Шүүсэн хугацаанд' : 'Нийт' },
  ];

  // Shape for client table
  const tableRows: OrderRow[] = orders.map(o => ({
    id: o.id,
    created_at: o.created_at,
    buyer_name: o.buyer_name,
    buyer_email: o.buyer_email,
    buyer_phone: o.buyer_phone,
    course_id: o.course_id,
    course_title: courseMap[o.course_id] || o.course_id?.slice(0, 8) || '—',
    amount: Number(o.amount) || 0,
    status: o.status,
    qpay_invoice_id: o.qpay_invoice_id,
  }));

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
            {' / '}Захиалга & Орлого
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Захиалга & Орлого</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>
            {isFiltered ? `Шүүлт идэвхтэй — ${orders.length} захиалга харагдаж байна` : `Нийт ${orders.length} захиалга`}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {metricCards.map(c => (
          <div key={c.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '1.25rem', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{c.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>{c.label}</div>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <Suspense fallback={<div style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '13px' }}>Шүүлт ачаалж байна…</div>}>
          <OrdersFilters />
        </Suspense>
      </div>

      {/* Orders table */}
      <OrdersTable orders={tableRows} locale={locale} />
    </div>
  );
}
