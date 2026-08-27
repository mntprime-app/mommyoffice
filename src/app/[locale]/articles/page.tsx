export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'mn' ? 'Нийтлэлүүд | Mommyoffice' : 'Articles | Mommyoffice',
    description: locale === 'mn'
      ? 'Эрүүл мэнд, гоо сайхан, хоол хүнс, гэр бүл, бизнес — Монгол эмэгтэйчүүдэд зориулсан нийтлэлүүд'
      : 'Health, beauty, food, family, business — articles for Mongolian women',
  };
}

async function getArticles() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, mobile_cover_image, slug, category, published_at, excerpt_mn, excerpt_en, body_mn, body_en')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

async function getEditorialArticles() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, mobile_cover_image, slug, category, published_at, excerpt_mn, excerpt_en, emoji, pin_rank')
      .eq('is_published', true)
      .eq('placement', 'editorial')
      .order('pin_rank', { ascending: true })
      .order('published_at', { ascending: false })
      .limit(3);
    return (data || []) as Record<string, unknown>[];
  } catch { return []; }
}

const CAT_GRADIENTS: Record<string, string> = {
  'Эрүүл мэнд':    'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'Гоо сайхан':    'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'Хоол тэжээл':   'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'Гэр бүл':       'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'Бизнес':        'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'Хувийн хөгжил': 'linear-gradient(135deg,#1a1a0d,#3d3d15)',
  'Lifestyle':     'linear-gradient(135deg,#1a0d1a,#3d153d)',
  'default':       'linear-gradient(135deg,#1a1a2e,#2d1b4e)',
};

const CAT_COLORS: Record<string, string> = {
  'Эрүүл мэнд': '#22c55e', 'Гоо сайхан': '#a855f7',
  'Хоол тэжээл': '#3b82f6', 'Гэр бүл': '#06b6d4',
  'Бизнес': '#f97316', 'Хувийн хөгжил': '#eab308',
  'Lifestyle': '#ec4899', 'default': '#00B5AD',
};


const CATEGORIES = ['Бүх ангилал', 'Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил'];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(text: string) {
  const plain = stripHtml(text);
  const words = plain.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 60));
}

function articleReadTime(a: Record<string, unknown>, locale: string) {
  const body = locale === 'mn'
    ? String(a.body_mn || a.body_en || a.excerpt_mn || '')
    : String(a.body_en || a.body_mn || a.excerpt_en || a.excerpt_mn || '');
  return readTime(body);
}

function formatDate(dateStr: string | null, locale: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { month: 'short', day: 'numeric' });
}

// ── Ad Banner ──
function AdBanner({ type }: { type: 'leaderboard' | 'sidebar' | 'footer' }) {
  if (type === 'sidebar') {
    return (
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '20px', marginTop: '24px' }}>
        <span style={{ fontSize: '10px', color: '#444', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Сурталчилгааны зай</span>
        <span style={{ fontSize: '11px', color: '#333' }}>300×250</span>
        <span style={{ fontSize: '10px', color: '#2a2a2a', marginTop: '6px' }}>info.mommyoffice@gmail.com</span>
      </div>
    );
  }
  if (type === 'footer') {
    return (
      <div style={{ margin: '0 0 2rem', background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(0,181,173,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>📢</span>
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#444', margin: '0 0 2px' }}>Сурталчилгааны зай</p>
          <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>info.mommyoffice@gmail.com</p>
        </div>
      </div>
    );
  }
  // leaderboard
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', margin: '24px 0', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: '32px', height: '32px', background: 'rgba(0,181,173,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '14px' }}>📢</span>
      </div>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#444', margin: '0 0 2px' }}>Сурталчилгааны зай</p>
        <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>info.mommyoffice@gmail.com</p>
      </div>
    </div>
  );
}

// ── Rich article card (main feed) ──
function ArticleCard({ a, locale }: { a: Record<string, unknown>; locale: string }) {
  const title   = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_en || a.excerpt_mn || '');
  const cat     = String(a.category || '');
  const grad    = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const href    = a.slug && a.slug !== '#' ? `/${locale}/articles/${String(a.slug)}` : '#';
  const date    = formatDate(a.published_at as string | null, locale);
  const mins    = articleReadTime(a, locale);

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="mo-art-card" style={{
        display: 'flex', gap: '18px', alignItems: 'flex-start',
        padding: '20px 0', borderBottom: '1px solid #1f1f1f',
      }}>
        {/* Thumbnail */}
        <div className="mo-art-thumb" style={{ width: '160px', height: '108px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: grad, position: 'relative' }}>
          {a.cover_image_url
            ? <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>{String(a.emoji || '✨')}</div>
          }
        </div>
        {/* Text */}
        <div className="mo-art-text" style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.8px', background: `${catColor}18`, padding: '2px 8px', borderRadius: '3px' }}>{cat}</span>
            {date && <span style={{ fontSize: '11px', color: '#555' }}>{date}</span>}
            <span style={{ fontSize: '11px', color: '#444' }}>·</span>
            <span style={{ fontSize: '11px', color: '#555' }}>⏱ {mins} мин унших</span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 7px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </h3>
          {excerpt && (
            <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

// ── Sidebar trending item ──
function SidebarItem({ a, locale, rank }: { a: Record<string, unknown>; locale: string; rank: number }) {
  const title = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const cat   = String(a.category || '');
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const href  = a.slug && a.slug !== '#' ? `/${locale}/articles/${String(a.slug)}` : '#';
  const date  = formatDate(a.published_at as string | null, locale);

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="mo-sb-item" style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#222', lineHeight: 1, flexShrink: 0, width: '30px', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          {String(rank).padStart(2, '0')}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{cat}</span>
            {date && <><span style={{ fontSize: '9px', color: '#444' }}>·</span><span style={{ fontSize: '9px', color: '#444' }}>{date}</span></>}
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Editor's Pick sidebar box ──
function EditorsPick({ a, locale }: { a: Record<string, unknown>; locale: string }) {
  const title   = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_en || a.excerpt_mn || '');
  const cat     = String(a.category || '');
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const grad    = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;
  const href    = a.slug && a.slug !== '#' ? `/${locale}/articles/${String(a.slug)}` : '#';

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px' }}>✍️</span>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Редакцын сонголт</h3>
      </div>
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${catColor}30` }}>
          <div style={{ height: '140px', background: grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {a.cover_image_url
              ? <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
              : <span style={{ fontSize: '44px', opacity: 0.4 }}>{String(a.emoji || '✨')}</span>
            }
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 60%)' }} />
          </div>
          <div style={{ padding: '14px', background: '#1a1a1a' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>{cat}</span>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
            {excerpt && <p style={{ fontSize: '11px', color: '#666', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{excerpt}</p>}
            <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', color: catColor, fontWeight: 700 }}>Унших →</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Editorial Pick card (3-col section) ──
function EditorialPickCard({ a, locale }: { a: Record<string, unknown>; locale: string }) {
  const title   = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_en || a.excerpt_mn || '');
  const cat     = String(a.category || '');
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const grad    = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;
  const href    = a.slug && a.slug !== '#' ? `/${locale}/articles/${String(a.slug)}` : '#';
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <article style={{ borderRadius: '12px', overflow: 'hidden', background: '#1a1a1a', border: `1px solid #222`, transition: 'transform 0.18s, border-color 0.18s' }}
        className="mo-ed-card">
        <div style={{ aspectRatio: '16/9', background: grad, position: 'relative', overflow: 'hidden' }}>
          {(a.cover_image_url || a.mobile_cover_image)
            ? <img src={String(a.cover_image_url || a.mobile_cover_image)} alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.4 }}>{String(a.emoji || '✍️')}</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)' }} />
          <span style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '9px', fontWeight: 800, color: catColor, background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{cat}</span>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 8px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
          {excerpt && <p style={{ fontSize: '12px', color: '#666', margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{excerpt}</p>}
          <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', color: catColor, fontWeight: 700 }}>Унших →</span>
        </div>
      </article>
    </Link>
  );
}

// ── Netflix horizontal row ──
function ArticleScrollCard({ a, locale }: { a: Record<string, unknown>; locale: string }) {
  const title = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const cat   = String(a.category || '');
  const grad  = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const href  = a.slug && a.slug !== '#' ? `/${locale}/articles/${String(a.slug)}` : '#';
  return (
    <Link href={href} style={{ textDecoration: 'none', flexShrink: 0, width: '220px', display: 'flex' }}>
      <article className="netflix-card" style={{ borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a', border: '1px solid #222', width: '100%' }}>
        <div style={{ height: '130px', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          {a.cover_image_url
            ? <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{String(a.emoji || '✨')}</span>}
          <span style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '9px', fontWeight: 800, color: catColor, background: `rgba(0,0,0,0.7)`, padding: '2px 7px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</span>
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5', lineHeight: 1.45, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>{title}</p>
          <span style={{ fontSize: '11px', color: '#555' }}>⏱ {readTime(title)} мин</span>
        </div>
      </article>
    </Link>
  );
}

function CategoryRow({ title, articles, locale, viewAllHref }: {
  title: string; articles: Record<string, unknown>[]; locale: string; viewAllHref: string;
}) {
  if (articles.length === 0) return null;
  const catColor = CAT_COLORS[title] || CAT_COLORS.default;
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '3px', height: '20px', background: catColor, borderRadius: '2px' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>{title}</h2>
        </div>
        <Link href={viewAllHref} style={{ fontSize: '12px', color: '#555', fontWeight: 600, textDecoration: 'none' }}>Бүгдийг харах →</Link>
      </div>
      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {articles.map((a, i) => <ArticleScrollCard key={String(a.id || i)} a={a} locale={locale} />)}
      </div>
    </section>
  );
}

export default async function ArticlesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  await getTranslations('articles');

  const [dbArticles, editorialArticles] = await Promise.all([getArticles(), getEditorialArticles()]);
  const allArticles = dbArticles as Record<string, unknown>[];

  const isFiltered = !!(category && category !== 'Бүх ангилал');
  const displayArticles = isFiltered
    ? allArticles.filter(a => String(a.category || '') === category)
    : allArticles;

  const catMap: Record<string, Record<string, unknown>[]> = {};
  CATEGORIES.slice(1).forEach(cat => { catMap[cat] = allArticles.filter(a => String(a.category || '') === cat); });

  const featured = allArticles[0];
  const featuredTitle   = locale === 'mn' ? String(featured?.title_mn || '') : String(featured?.title_en || featured?.title_mn || '');
  const featuredExcerpt = locale === 'mn' ? String(featured?.excerpt_mn || '') : String(featured?.excerpt_en || featured?.excerpt_mn || '');
  const featuredSlug    = featured?.slug && featured.slug !== '#' ? `/${locale}/articles/${featured.slug}` : '#';
  const featuredGrad    = CAT_GRADIENTS[String(featured?.category || '')] || CAT_GRADIENTS.default;

  const mainFeedArticles = isFiltered ? displayArticles : allArticles;
  const sidebarTrending  = allArticles.slice(0, 6);
  const editorsPick      = editorialArticles[0] || allArticles[2] || allArticles[0];

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="mo-hero-section" style={{ position: 'relative', width: '100%', height: '72vh', minHeight: '480px', overflow: 'hidden' }}>
        <div className="mo-hero-bg" style={{ position: 'absolute', inset: 0, background: featuredGrad }}>
          {(featured?.cover_image_url || featured?.mobile_cover_image) ? (
            <img
              src={String(featured?.cover_image_url || featured?.mobile_cover_image)}
              alt={featuredTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6%', overflow: 'hidden' }}>
              <div style={{ fontSize: '13rem', fontWeight: 900, color: 'rgba(0,181,173,0.07)', lineHeight: 1, userSelect: 'none', letterSpacing: '-8px', fontFamily: 'Georgia,serif' }}>
                MO
              </div>
            </div>
          )}
        </div>
        {/* Desktop: left-to-right. Mobile: hidden */}
        <div className="mo-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />
        <div className="mo-hero-bottom-fade" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom,transparent,#111)' }} />
        <div className="mo-hero-content" style={{ position: 'absolute', bottom: '20%', left: '4%', maxWidth: '560px', zIndex: 2 }}>
          <span style={{ display: 'inline-block', background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)', color: '#00B5AD', padding: '3px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
            {String(featured?.category || 'Нийтлэл')}
          </span>
          <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,2.2rem)', fontWeight: 800, lineHeight: 1.25, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px', textShadow: '0 2px 20px rgba(0,0,0,0.6)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {featuredTitle}
          </h1>
          {featuredExcerpt && (
            <p className="mo-hero-excerpt" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '440px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featuredExcerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href={String(featuredSlug)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00B5AD', color: '#fff', padding: '11px 28px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,181,173,0.4)', minHeight: '44px' }}>
              Унших →
            </Link>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>⏱ {featured ? articleReadTime(featured, locale) : 1} мин унших</span>
          </div>
        </div>
      </section>

      {/* ── BODY: 2-COLUMN EDITORIAL GRID ── */}
      <div className="mo-body-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── CATEGORY FILTER TABS ── */}
        <div className="mo-cat-bar" style={{ display: 'flex', gap: '8px', padding: '1.75rem 0 1.25rem', borderBottom: '1px solid #1f1f1f' }}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat || (!category && cat === 'Бүх ангилал');
            const catColor = CAT_COLORS[cat] || '#00B5AD';
            return (
              <Link key={cat}
                href={cat === 'Бүх ангилал' ? `/${locale}/articles` : `/${locale}/articles?category=${encodeURIComponent(cat)}`}
                style={{
                  padding: '6px 16px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                  background: isActive ? catColor : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fff' : '#bbb',
                  border: `1px solid ${isActive ? catColor : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.15s',
                }}>{cat}</Link>
            );
          })}
        </div>

        {/* ── РЕДАКЦЫН СОНГОЛТ — 3-card section (only shown when articles exist) ── */}
        {!isFiltered && editorialArticles.length > 0 && (
          <section style={{ padding: '2rem 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ width: '3px', height: '20px', background: '#00B5AD', borderRadius: '2px' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase' }}>✍️ Редакцын сонголт</span>
            </div>
            <div className="mo-editorial-grid">
              {editorialArticles.map((a, i) => (
                <EditorialPickCard key={String(a.id || i)} a={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── MAIN 2-COL GRID ── */}
        <div className="mo-main-grid">

          {/* ── LEFT: Article feed ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '3px', height: '18px', background: '#00B5AD', borderRadius: '2px' }} />
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#666', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {isFiltered ? category : 'Сүүлийн нийтлэлүүд'}
              </h2>
            </div>

            {displayArticles.length === 0 ? (
              <p style={{ color: '#555', padding: '3rem 0' }}>Нийтлэл олдсонгүй</p>
            ) : (
              <>
                {mainFeedArticles.slice(0, 4).map((a, i) => (
                  <ArticleCard key={String(a.id || i)} a={a} locale={locale} />
                ))}

                {/* Mid-feed ad */}
                {!isFiltered && <AdBanner type="leaderboard" />}

                {mainFeedArticles.slice(4).map((a, i) => (
                  <ArticleCard key={String(a.id || i + 4)} a={a} locale={locale} />
                ))}
              </>
            )}
          </div>

          {/* ── RIGHT: Sticky sidebar ── */}
          <div className="mo-sidebar">

            {/* Trending */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ width: '3px', height: '18px', background: '#ef4444', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#666', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Их уншигдсан</h3>
              </div>
              {sidebarTrending.map((a, i) => (
                <SidebarItem key={String(a.id || i)} a={a} locale={locale} rank={i + 1} />
              ))}
            </div>

            {/* 300×250 ad */}
            <AdBanner type="sidebar" />

            {/* Editor's Pick */}
            <EditorsPick a={editorsPick} locale={locale} />
          </div>
        </div>

        {/* ── CATEGORY HORIZONTAL ROWS ── */}
        {!isFiltered && (
          <div style={{ paddingTop: '3rem' }}>
            <div style={{ height: '1px', background: '#1f1f1f', marginBottom: '2.5rem' }} />
            {CATEGORIES.slice(1).map(cat => (
              <CategoryRow
                key={cat}
                title={cat}
                articles={catMap[cat] || []}
                locale={locale}
                viewAllHref={`/${locale}/articles?category=${encodeURIComponent(cat)}`}
              />
            ))}
          </div>
        )}

        {/* ── FOOTER AD ── */}
        <div style={{ paddingTop: '1rem' }}>
          <AdBanner type="footer" />
        </div>
      </div>

      <style>{`
        /* ── Base interactions ── */
        .mo-art-card { transition: background 0.15s; border-radius: 8px; }
        .mo-art-card:hover { background: rgba(255,255,255,0.025); }
        .mo-ed-card:hover { transform: translateY(-3px); border-color: rgba(0,181,173,0.3) !important; }

        /* ── Editorial 3-col grid ── */
        .mo-editorial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 768px) {
          .mo-editorial-grid { grid-template-columns: 1fr; }
        }
        .mo-sb-item { transition: opacity 0.15s; }
        .mo-sb-item:hover { opacity: 0.7; }
        .netflix-card { transition: transform 0.18s; }
        .netflix-card:hover { transform: translateY(-3px); }

        /* ── Prevent horizontal overflow ── */
        .mo-hero-section, .mo-body-wrap { overflow-x: hidden; max-width: 100%; }

        /* ── 2-col grid: defined purely in CSS (no inline style conflict) ── */
        .mo-main-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 3rem;
          padding-top: 2rem;
          align-items: flex-start;
          overflow-x: hidden;
        }
        /* Prevent grid children from overflowing their cells */
        .mo-main-grid > div { min-width: 0; }
        .mo-sidebar {
          position: sticky;
          top: 80px;
          min-width: 0;
        }

        /* ── TABLET (≤900px): collapse to single column, sidebar stacks below ── */
        @media (max-width: 900px) {
          .mo-main-grid { grid-template-columns: 1fr; gap: 2rem; }
          .mo-sidebar { position: static; border-top: 1px solid #1f1f1f; padding-top: 2rem; }
        }

        /* ── MOBILE (≤768px): body padding ── */
        @media (max-width: 768px) {
          .mo-body-wrap { padding: 0 1rem; }
        }

        /* ── MOBILE: Stacked editorial hero layout ── */
        @media (max-width: 768px) {
          .mo-hero-section {
            height: auto !important;
            min-height: 0 !important;
            display: flex;
            flex-direction: column;
          }
          .mo-hero-bg {
            position: relative !important;
            inset: auto !important;
            width: 100%;
            aspect-ratio: 16 / 9;
            flex-shrink: 0;
            overflow: hidden;
          }
          .mo-hero-bg img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center top;
          }
          .mo-hero-overlay,
          .mo-hero-bottom-fade { display: none !important; }
          .mo-hero-content {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            max-width: 100% !important;
            padding: 1.25rem 1.25rem 2rem !important;
            background: #111;
            z-index: 1;
          }
          .mo-hero-content h1 { font-size: 1.4rem; line-height: 1.3; text-shadow: none; }
          .mo-hero-excerpt { display: block !important; color: #aaa !important; }
        }

        /* ── MOBILE: category pill bar ── */
        @media (max-width: 768px) {
          .mo-cat-bar {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            margin: 0 -1rem;
            padding: 1rem 0;
            border-bottom: 1px solid #1f1f1f;
          }
          .mo-cat-bar::-webkit-scrollbar { display: none; }
          .mo-cat-bar a { flex-shrink: 0; min-height: 40px; display: inline-flex; align-items: center; }
          .mo-cat-bar a:first-child { margin-left: 1rem; }
          .mo-cat-bar a:last-child  { margin-right: 1rem; }
        }

        /* ── MOBILE (≤768px): article card stacks full-width ── */
        @media (max-width: 768px) {
          .mo-art-card { flex-direction: column; gap: 0; padding: 16px 0; }
          .mo-art-thumb { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; border-radius: 10px; flex-shrink: unset !important; }
          .mo-art-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
          .mo-art-text { padding-top: 10px; }
        }
      `}</style>
    </div>
  );
}
