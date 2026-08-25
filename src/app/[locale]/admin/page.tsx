import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function getStats() {
  try {
    const admin = await createAdminClient();
    const [coursesRes, articlesRes, ordersRes] = await Promise.all([
      admin.from('mo_courses').select('id', { count: 'exact' }),
      admin.from('mo_articles').select('id', { count: 'exact' }),
      admin.from('mo_orders').select('id, amount, status, buyer_email, created_at, course_id').order('created_at', { ascending: false }).limit(10),
    ]);

    const allOrders = ordersRes.data || [];
    const paidOrders = allOrders.filter((o) => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);

    return {
      courses: coursesRes.count || 0,
      articles: articlesRes.count || 0,
      totalRevenue,
      totalOrders: allOrders.length,
      recentOrders: allOrders.slice(0, 5),
    };
  } catch {
    return { courses: 0, articles: 0, totalRevenue: 0, totalOrders: 0, recentOrders: [] };
  }
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/admin/login`);

  const stats = await getStats();

  const metricCards = [
    { label: 'Нийт орлого', value: `${stats.totalRevenue.toLocaleString()}₮`, icon: '💰', href: `/${locale}/admin/orders`, color: '#00B5AD' },
    { label: 'Нийт захиалга', value: String(stats.totalOrders), icon: '🧾', href: `/${locale}/admin/orders`, color: '#6366f1' },
    { label: 'Нийт хичээл', value: String(stats.courses), icon: '📚', href: `/${locale}/admin/courses`, color: '#f59e0b' },
    { label: 'Нийтлэл', value: String(stats.articles), icon: '📝', href: `/${locale}/admin/articles`, color: '#10b981' },
  ];

  const quickActions = [
    { label: '+ Хичээл нэмэх', href: `/${locale}/admin/courses/new`, bg: '#00B5AD' },
    { label: '+ Нийтлэл нэмэх', href: `/${locale}/admin/articles/new`, bg: '#6366f1' },
    { label: 'Хичээлүүд', href: `/${locale}/admin/courses`, bg: '#f3f4f6', dark: true },
    { label: 'Нийтлэлүүд', href: `/${locale}/admin/articles`, bg: '#f3f4f6', dark: true },
    { label: 'Захиалгууд', href: `/${locale}/admin/orders`, bg: '#f3f4f6', dark: true },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Admin Panel</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>{user.email}</p>
        </div>
        <Link href={`/${locale}`} style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Сайт руу буцах
        </Link>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {metricCards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '1.25rem',
              borderLeft: `4px solid ${card.color}`,
              transition: 'box-shadow 0.15s',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href} style={{
            background: a.bg, color: a.dark ? 'var(--foreground)' : '#fff',
            padding: '10px 20px', borderRadius: '10px',
            fontWeight: 600, textDecoration: 'none', fontSize: '14px',
          }}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {stats.recentOrders.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Сүүлийн захиалгууд</span>
            <Link href={`/${locale}/admin/orders`} style={{ fontSize: '12px', color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
              Бүгдийг харах →
            </Link>
          </div>
          <div>
            {stats.recentOrders.map((order: Record<string, unknown>, i: number) => {
              const paid = order.status === 'paid';
              const date = new Date(String(order.created_at));
              return (
                <div key={String(order.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < stats.recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: paid ? '#10b981' : '#f59e0b',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(order.buyer_email || '')}
                    </p>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: paid ? '#065f46' : '#92400e', whiteSpace: 'nowrap' }}>
                    {Number(order.amount) > 0 ? `${Number(order.amount).toLocaleString()}₮` : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {date.toLocaleDateString('mn-MN')}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '20px',
                    background: paid ? '#d1fae5' : '#fef3c7',
                    color: paid ? '#065f46' : '#92400e',
                    whiteSpace: 'nowrap',
                  }}>
                    {paid ? 'Төлөгдсөн' : 'Хүлээгдэж байна'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
