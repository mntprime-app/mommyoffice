import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function getStats() {
  try {
    const supabase = await createClient();
    const [coursesRes, articlesRes, tokensRes] = await Promise.all([
      supabase.from('mo_courses').select('id', { count: 'exact' }),
      supabase.from('mo_articles').select('id', { count: 'exact' }),
      supabase.from('mo_access_tokens').select('id', { count: 'exact' }),
    ]);
    return {
      courses: coursesRes.count || 0,
      articles: articlesRes.count || 0,
      tokens: tokensRes.count || 0,
    };
  } catch {
    return { courses: 0, articles: 0, tokens: 0 };
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

  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  const stats = await getStats();

  const cards = [
    { label: 'Нийт хичээл', value: stats.courses, icon: '📚', href: `/${locale}/admin/courses`, color: '#00B5AD' },
    { label: 'Нийтлэл', value: stats.articles, icon: '📝', href: `/${locale}/admin/articles`, color: '#6366f1' },
    { label: 'Худалдан авалт', value: stats.tokens, icon: '🎟️', href: '#', color: '#f59e0b' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Panel</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>{user.email}</p>
        </div>
        <Link href={`/${locale}`} style={{
          color: 'var(--teal)', textDecoration: 'none',
          fontSize: '14px', fontWeight: 500
        }}>
          ← Сайт руу буцах
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {cards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '1.5rem',
              borderLeft: `4px solid ${card.color}`
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{card.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '0.25rem' }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href={`/${locale}/admin/courses/new`} style={{
          background: 'var(--teal)', color: '#fff',
          padding: '12px 24px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none'
        }}>
          + Хичээл нэмэх
        </Link>
        <Link href={`/${locale}/admin/articles/new`} style={{
          background: '#6366f1', color: '#fff',
          padding: '12px 24px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none'
        }}>
          + Нийтлэл нэмэх
        </Link>
        <Link href={`/${locale}/admin/courses`} style={{
          background: '#f3f4f6', color: 'var(--foreground)',
          padding: '12px 24px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none'
        }}>
          Хичээлүүд харах
        </Link>
        <Link href={`/${locale}/admin/articles`} style={{
          background: '#f3f4f6', color: 'var(--foreground)',
          padding: '12px 24px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none'
        }}>
          Нийтлэлүүд харах
        </Link>
      </div>
    </div>
  );
}
