import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'mn'
      ? 'Нийтлэлүүд | Mommyoffice'
      : 'Articles | Mommyoffice',
    description: locale === 'mn'
      ? 'Эрүүл мэнд, гоо сайхан, хоол хүнс, гэр бүл, бизнес — Монгол эмэгтэйчүүдэд зориулсан нийтлэлүүд'
      : 'Health, beauty, food, family, business — articles for Mongolian women',
  };
}

async function getArticles() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at, excerpt_mn, excerpt_en')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

const CATEGORIES_MN = ['Бүх ангилал', 'Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил'];
const CATEGORIES_EN = ['All Categories', 'Health', 'Beauty', 'Nutrition', 'Family', 'Business', 'Personal Growth'];

const PLACEHOLDER_ARTICLES = [
  { id: '1', title_mn: 'Өглөөний эрүүл дэглэм — 5 алхам', title_en: 'Morning Wellness Routine — 5 Steps', cat_mn: 'Эрүүл мэнд', cat_en: 'Health', emoji: '🌅', slug: '#', date: '2026-08-20' },
  { id: '2', title_mn: 'Гэрийнхнийхээ хоолны дэглэмийг яаж сайжруулах вэ?', title_en: 'How to Improve Your Family\'s Diet?', cat_mn: 'Хоол тэжээл', cat_en: 'Nutrition', emoji: '🥗', slug: '#', date: '2026-08-18' },
  { id: '3', title_mn: 'Монгол эмэгтэйчүүдийн бизнес амжилтын нууц', title_en: 'The Secret to Mongolian Women\'s Business Success', cat_mn: 'Бизнес', cat_en: 'Business', emoji: '🚀', slug: '#', date: '2026-08-15' },
  { id: '4', title_mn: 'Арьсаа хэрхэн арчлах вэ — мэргэжилтний зөвлөгөө', title_en: 'Expert Skincare Advice', cat_mn: 'Гоо сайхан', cat_en: 'Beauty', emoji: '✨', slug: '#', date: '2026-08-12' },
  { id: '5', title_mn: 'Гэр бүлийн бат бөх холбоо', title_en: 'Building Strong Family Bonds', cat_mn: 'Гэр бүл', cat_en: 'Family', emoji: '💝', slug: '#', date: '2026-08-10' },
  { id: '6', title_mn: 'Зорилгодоо хэрхэн хурдан хүрэх вэ?', title_en: 'How to Reach Your Goals Faster?', cat_mn: 'Хувийн хөгжил', cat_en: 'Personal Growth', emoji: '🎯', slug: '#', date: '2026-08-08' },
  { id: '7', title_mn: 'Дотоод амар тайвнаа хэрхэн олох вэ', title_en: 'How to Find Inner Peace', cat_mn: 'Эрүүл мэнд', cat_en: 'Health', emoji: '🧘', slug: '#', date: '2026-08-05' },
  { id: '8', title_mn: 'Гэрийн чимэглэл: энгийн боловч гоё', title_en: 'Home Decor: Simple Yet Beautiful', cat_mn: 'Хувийн хөгжил', cat_en: 'Personal Growth', emoji: '🏡', slug: '#', date: '2026-08-01' },
  { id: '9', title_mn: 'Хүүхэдтэйгээ чанарын цагийг хэрхэн өнгөрүүлэх вэ', title_en: 'Quality Time With Your Children', cat_mn: 'Гэр бүл', cat_en: 'Family', emoji: '👨‍👩‍👧', slug: '#', date: '2026-07-28' },
];

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  const t = await getTranslations('articles');

  const dbArticles = await getArticles();
  const hasDB = dbArticles.length > 0;

  const categories = locale === 'mn' ? CATEGORIES_MN : CATEGORIES_EN;
  const activeCategory = category || categories[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          {locale === 'mn'
            ? 'Эрүүл мэнд, гоо сайхан, гэр бүл болон амьдралын зөвлөгөө'
            : 'Health, beauty, family and lifestyle advice'}
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={cat === categories[0] ? `/${locale}/articles` : `/${locale}/articles?category=${encodeURIComponent(cat)}`}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: `1.5px solid ${activeCategory === cat ? 'var(--teal)' : 'var(--border)'}`,
              background: activeCategory === cat ? 'var(--teal)' : '#fff',
              color: activeCategory === cat ? '#fff' : 'var(--foreground)',
              fontWeight: activeCategory === cat ? 600 : 400,
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Article grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.75rem',
      }}>
        {hasDB
          ? dbArticles.map((a: Record<string, unknown>) => {
              const title = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
              const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_en || a.excerpt_mn || '');
              const cat = String(a.category || '');
              const date = a.published_at ? new Date(String(a.published_at)).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
              return (
                <ArticleCard
                  key={String(a.id)}
                  href={`/${locale}/articles/${a.slug}`}
                  title={title}
                  excerpt={excerpt}
                  category={cat}
                  date={date}
                  imageUrl={String(a.cover_image_url || '')}
                  locale={locale}
                  t={t}
                />
              );
            })
          : PLACEHOLDER_ARTICLES.map((a) => (
              <ArticleCard
                key={a.id}
                href={`/${locale}/articles/${a.slug}`}
                title={locale === 'mn' ? a.title_mn : a.title_en}
                excerpt=""
                category={locale === 'mn' ? a.cat_mn : a.cat_en}
                date={new Date(a.date).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                imageUrl=""
                emoji={a.emoji}
                locale={locale}
                t={t}
              />
            ))}
      </div>
    </div>
  );
}

function ArticleCard({
  href, title, excerpt, category, date, imageUrl, emoji, locale, t,
}: {
  href: string; title: string; excerpt: string; category: string; date: string;
  imageUrl: string; emoji?: string; locale: string;
  t: (key: string) => string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="netflix-card" style={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Cover */}
        <div style={{
          height: '200px',
          background: imageUrl ? 'transparent' : 'linear-gradient(135deg, #fef3c7, #fbbf24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3.5rem' }}>{emoji || '✨'}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--teal)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              background: 'var(--teal-light)', padding: '3px 10px', borderRadius: '10px',
            }}>
              {category}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{date}</span>
          </div>

          <h2 style={{
            fontSize: '15px', fontWeight: 700, color: '#e5e5e5',
            lineHeight: 1.5, marginBottom: '8px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: '3em',
          }}>
            {title}
          </h2>

          {excerpt && (
            <p style={{
              fontSize: '13px', color: '#6b7280', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {excerpt}
            </p>
          )}

          <span style={{
            display: 'inline-block', marginTop: 'auto', paddingTop: '12px',
            color: 'var(--teal)', fontSize: '13px', fontWeight: 600,
          }}>
            {t('read_more')} →
          </span>
        </div>
      </article>
    </Link>
  );
}
