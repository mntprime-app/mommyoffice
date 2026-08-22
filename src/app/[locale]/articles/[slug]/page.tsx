import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function getArticle(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, body_mn, body_en, excerpt_mn, excerpt_en, cover_image_url, slug, category, published_at, author_name')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Article | Mommyoffice' };

  const title = locale === 'mn'
    ? String(article.title_mn || '')
    : String(article.title_en || article.title_mn || '');
  const description = locale === 'mn'
    ? String(article.excerpt_mn || '')
    : String(article.excerpt_en || article.excerpt_mn || '');

  return {
    title: `${title} | Mommyoffice`,
    description,
    openGraph: {
      title,
      description,
      images: article.cover_image_url ? [String(article.cover_image_url)] : [],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('articles');

  const article = await getArticle(slug);

  // If no DB article, show a "coming soon" state rather than 404
  // so the site looks complete even without data
  if (!article) {
    return (
      <div style={{ maxWidth: '720px', margin: '6rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>
          {locale === 'mn' ? 'Нийтлэл удахгүй гарна' : 'Article Coming Soon'}
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: '2rem' }}>
          {locale === 'mn'
            ? 'Энэ нийтлэл бэлдэгдэж байна. Удахгүй нийтлэгдэх болно.'
            : 'This article is being prepared and will be published soon.'}
        </p>
        <Link
          href={`/${locale}/articles`}
          style={{
            display: 'inline-block',
            background: 'var(--teal)', color: '#fff',
            padding: '10px 24px', borderRadius: '8px',
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          ← {t('back')}
        </Link>
      </div>
    );
  }

  const title = locale === 'mn'
    ? String(article.title_mn || '')
    : String(article.title_en || article.title_mn || '');
  const body = locale === 'mn'
    ? String(article.body_mn || article.body_en || '')
    : String(article.body_en || article.body_mn || '');
  const date = article.published_at
    ? new Date(String(article.published_at)).toLocaleDateString(
        locale === 'mn' ? 'mn-MN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Back link */}
      <Link
        href={`/${locale}/articles`}
        style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '2rem' }}
      >
        ← {t('back')}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem', alignItems: 'start' }}>
        {/* Main article */}
        <article>
          {/* Category + date */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{
              fontSize: '12px', fontWeight: 700, color: 'var(--teal)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              background: 'var(--teal-light)', padding: '3px 12px', borderRadius: '10px',
            }}>
              {String(article.category || '')}
            </span>
            {date && (
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                {t('published')}: {date}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 800, lineHeight: 1.3,
            color: 'var(--foreground)', marginBottom: '1.5rem',
          }}>
            {title}
          </h1>

          {/* Cover image */}
          {article.cover_image_url && (
            <div style={{
              borderRadius: '14px', overflow: 'hidden',
              marginBottom: '2rem', maxHeight: '480px',
            }}>
              <img
                src={String(article.cover_image_url)}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Author */}
          {article.author_name && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '2rem', padding: '14px 18px',
              background: 'var(--teal-light)', borderRadius: '10px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--teal)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '16px',
              }}>
                {String(article.author_name)[0]}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>
                  {String(article.author_name)}
                </p>
              </div>
            </div>
          )}

          {/* Body */}
          <div
            style={{
              fontSize: '16px', lineHeight: 1.8, color: '#374151',
              maxWidth: '680px',
            }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </article>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--teal-light), #e0f2f1)',
            borderRadius: '14px', padding: '1.5rem',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>
              {locale === 'mn' ? 'Хичээл эзэмшихийг хүсвэл' : 'Want to learn more?'}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {locale === 'mn'
                ? 'Манай хичээлүүдийг үзэж мэдлэгээ нэмэгдүүлээрэй.'
                : 'Browse our courses and expand your knowledge.'}
            </p>
            <Link
              href={`/${locale}/courses`}
              style={{
                display: 'block', textAlign: 'center',
                background: 'var(--teal)', color: '#fff',
                padding: '10px 16px', borderRadius: '8px',
                textDecoration: 'none', fontWeight: 600, fontSize: '14px',
              }}
            >
              {locale === 'mn' ? 'Хичээлүүд үзэх' : 'Browse Courses'}
            </Link>
          </div>

          {/* Share */}
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '14px', background: '#fff' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--foreground)' }}>
              {locale === 'mn' ? 'Найзтайгаа хуваалцах' : 'Share with friends'}
            </p>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://mommyoffice.com/${locale}/articles/${slug}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center',
                background: '#1877f2', color: '#fff',
                padding: '9px 16px', borderRadius: '8px',
                textDecoration: 'none', fontWeight: 600, fontSize: '13px',
              }}
            >
              Facebook-д хуваалцах
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
