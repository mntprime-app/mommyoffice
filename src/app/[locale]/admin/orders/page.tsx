import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const PRODUCT_TYPES: Record<string, { emoji: string; label: string }> = {
  course: { emoji: '🎓', label: 'Сургалт' },
  video: { emoji: '🎬', label: 'Видео' },
  shop: { emoji: '🛍️', label: 'Дэлгүүр' },
};

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/admin/login`);

  const adminClient = await createAdminClient();
  const { data: orders } = await adminClient
    .from('mo_orders')
    .select('id, buyer_email, course_id, amount, status, qpay_invoice_id, created_at, product_type')
    .order('created_at', { ascending: false })
    .limit(200);

  const courseIds = [...new Set((orders || []).map((o) => o.course_id).filter(Boolean))];
  const { data: courses } = courseIds.length > 0
    ? await adminClient.from('mo_courses').select('id, title_mn, slug').in('id', courseIds)
    : { data: [] };
  const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c]));

  const paidOrders = (orders || []).filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const todayStr = new Date().toDateString();
  const todayRevenue = paidOrders
    .filter((o) => new Date(o.created_at).toDateString() === todayStr)
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link> / Захиалгууд
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Захиалга & Орлого</h1>
        </div>
      </div>

      {/* Revenue summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Нийт орлого', value: `${totalRevenue.toLocaleString()}₮`, color: '#00B5AD', icon: '💰' },
          { label: 'Өнөөдрийн орлого', value: `${todayRevenue.toLocaleString()}₮`, color: '#6366f1', icon: '📅' },
          { label: 'Нийт захиалга', value: String(orders?.length || 0), color: '#f59e0b', icon: '🧾' },
          { label: 'Амжилттай төлбөр', value: String(paidOrders.length), color: '#10b981', icon: '✅' },
        ].map((c) => (
          <div key={c.label} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '14px', padding: '1.25rem',
            borderLeft: `4px solid ${c.color}`,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{c.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e5e5' }}>Сүүлийн захиалгууд ({orders?.length || 0})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#222', borderBottom: '1px solid #2a2a2a' }}>
                {['Огноо', 'И-мэйл', 'Бүтээгдэхүүн / Төрөл', 'Дүн', 'Статус', 'QPay Invoice'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9ca3af', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((order, i) => {
                const course = courseMap[order.course_id];
                const paid = order.status === 'paid';
                const date = new Date(order.created_at);
                const ptype = PRODUCT_TYPES[order.product_type || 'course'] || PRODUCT_TYPES.course;
                return (
                  <tr key={order.id} style={{ borderBottom: i < (orders?.length || 1) - 1 ? '1px solid #2a2a2a' : 'none' }}>
                    <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {date.toLocaleDateString('mn-MN')} {date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 500, color: '#e5e5e5' }}>{order.buyer_email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                          background: 'rgba(0,181,173,0.15)', color: '#00B5AD', whiteSpace: 'nowrap'
                        }}>
                          {ptype.emoji} {ptype.label}
                        </span>
                        {course ? (
                          <Link href={`/${locale}/admin/courses/${order.course_id}/edit`} style={{ color: '#00B5AD', textDecoration: 'none', fontWeight: 500 }}>
                            {course.title_mn}
                          </Link>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '12px' }}>{order.course_id?.slice(0, 8)}...</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: paid ? '#10b981' : '#e5e5e5' }}>
                      {Number(order.amount) > 0 ? `${Number(order.amount).toLocaleString()}₮` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: paid ? 'rgba(16,185,129,0.15)' : order.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: paid ? '#10b981' : order.status === 'pending' ? '#f59e0b' : '#ef4444',
                      }}>
                        {paid ? 'Төлөгдсөн' : order.status === 'pending' ? 'Хүлээгдэж байна' : order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' }}>
                      {order.qpay_invoice_id ? order.qpay_invoice_id.slice(0, 16) + '...' : '—'}
                    </td>
                  </tr>
                );
              })}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    Одоогоор захиалга байхгүй байна
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
