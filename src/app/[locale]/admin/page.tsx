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
    return { courses: coursesRes.count || 0, articles: articlesRes.count || 0, totalRevenue, totalOrders: allOrders.length, recentOrders: allOrders.slice(0, 5) };
  } catch {
    return { courses: 0, articles: 0, totalRevenue: 0, totalOrders: 0, recentOrders: [] };
  }
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
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
    { label: '+ Хичээл нэмэх', href: `/${locale}/admin/courses/new`, bg: '#00B5AD', color: '#fff' },
    { label: '+ Нийтлэл нэмэх', href: `/${locale}/admin/articles/new`, bg: '#6366f1', color: '#fff' },
    { label: '+ Видео нэмэх', href: `/${locale}/admin/videos/new`, bg: '#f59e0b', color: '#1a0f00' },
    { label: 'Хичээлүүд', href: `/${locale}/admin/courses`, bg: '#2a2a2a', color: '#e5e5e5' },
    { label: 'Нийтлэлүүд', href: `/${locale}/admin/articles`, bg: '#2a2a2a', color: '#e5e5e5' },
    { label: '🎬 Видеонууд', href: `/${locale}/admin/videos`, bg: '#2a2a2a', color: '#e5e5e5' },
    { label: 'Захиалгууд', href: `/${locale}/admin/orders`, bg: '#2a2a2a', color: '#e5e5e5' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#fff' }}>Admin Panel</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>{user.email}</p>
        </div>
        <Link href={`/${locale}`} style={{ color: '#00B5AD', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Сайт руу буцах
        </Link>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {metricCards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1a1a', border: `1px solid #2a2a2a`,
              borderRadius: '14px', padding: '1.25rem',
              borderLeft: `4px solid ${card.color}`,
              transition: 'background 0.15s',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href} style={{
            background: a.bg, color: a.color,
            padding: '10px 20px', borderRadius: '10px',
            fontWeight: 600, textDecoration: 'none', fontSize: '14px',
            border: a.bg === '#2a2a2a' ? '1px solid #333' : 'none',
          }}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {stats.recentOrders.length > 0 && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e5e5' }}>Сүүлийн захиалгууд</span>
            <Link href={`/${locale}/admin/orders`} style={{ fontSize: '12px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
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
                  borderBottom: i < stats.recentOrders.length - 1 ? '1px solid #2a2a2a' : 'none',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: paid ? '#10b981' : '#f59e0b' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#e5e5e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(order.buyer_email || '')}
                    </p>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: paid ? '#10b981' : '#f59e0b', whiteSpace: 'nowrap' }}>
                    {Number(order.amount) > 0 ? `${Number(order.amount).toLocaleString()}₮` : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {date.toLocaleDateString('mn-MN')}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                    background: paid ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: paid ? '#10b981' : '#f59e0b', whiteSpace: 'nowrap',
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
