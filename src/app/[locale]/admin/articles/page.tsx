'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminArticlesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [articles, setArticles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, category, is_published, published_at, slug')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles(data || []);
        setLoading(false);
      });
  }, []);

  async function togglePublish(id: string, current: boolean) {
    const supabase = createClient();
    await supabase
      .from('mo_articles')
      .update({ is_published: !current, published_at: !current ? new Date().toISOString() : null })
      .eq('id', id);
    setArticles((prev) =>
      prev.map((a) => a.id === id ? { ...a, is_published: !current } : a)
    );
  }

  async function deleteArticle(id: string, title: string) {
    if (!confirm(`"${title}" нийтлэлийг устгах уу?`)) return;
    const supabase = createClient();
    await supabase.from('mo_articles').delete().eq('id', id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Admin</Link> / Нийтлэлүүд
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Нийтлэл удирдах</h1>
        </div>
        <Link
          href={`/${locale}/admin/articles/new`}
          style={{
            background: 'var(--teal)', color: '#fff',
            padding: '10px 20px', borderRadius: '8px',
            fontWeight: 700, textDecoration: 'none', fontSize: '14px'
          }}
        >
          + Нийтлэл нэмэх
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Ачааллаж байна...</div>
      ) : articles.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          border: '2px dashed var(--border)', borderRadius: '14px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Нийтлэл байхгүй байна</p>
          <Link
            href={`/${locale}/admin/articles/new`}
            style={{
              background: 'var(--teal)', color: '#fff',
              padding: '10px 24px', borderRadius: '8px',
              fontWeight: 600, textDecoration: 'none'
            }}
          >
            Эхний нийтлэл нэмэх
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {articles.map((a) => {
            const title = String(a.title_mn || a.title_en || '');
            const published = Boolean(a.is_published);
            return (
              <div key={String(a.id)} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem',
                border: '1px solid var(--border)', borderRadius: '10px',
                background: '#fff'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)', marginBottom: '4px' }}>{title}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      background: 'var(--teal-light)', color: 'var(--teal)',
                      padding: '2px 8px', borderRadius: '8px'
                    }}>
                      {String(a.category || '')}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: published ? '#10b981' : '#9ca3af',
                      fontWeight: 600
                    }}>
                      {published ? '● Нийтлэгдсэн' : '○ Ноорог'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => togglePublish(String(a.id), published)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: published ? '#fef3c7' : '#d1fae5',
                      color: published ? '#92400e' : '#065f46'
                    }}
                  >
                    {published ? 'Нуух' : 'Нийтлэх'}
                  </button>
                  <Link
                    href={`/${locale}/admin/articles/${a.id}/edit`}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 600, textDecoration: 'none',
                      background: '#f3f4f6', color: 'var(--foreground)'
                    }}
                  >
                    Засах
                  </Link>
                  <button
                    onClick={() => deleteArticle(String(a.id), title)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: '#fee2e2', color: '#991b1b'
                    }}
                  >
                    Устгах
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
