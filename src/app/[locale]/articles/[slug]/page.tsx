export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function getArticle(slug: string) {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, body_mn, body_en, excerpt_mn, excerpt_en, cover_image_url, slug, category, published_at, author_name')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

async function getRelatedArticles(category: string, excludeSlug: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at, excerpt_mn')
      .eq('is_published', true)
      .eq('category', category)
      .neq('slug', excludeSlug)
      .order('published_at', { ascending: false })
      .limit(4);
    return data || [];
  } catch { return []; }
}

async function getTrendingArticles(excludeSlug: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, slug, category, published_at')
      .eq('is_published', true)
      .neq('slug', excludeSlug)
      .order('published_at', { ascending: false })
      .limit(5);
    return data || [];
  } catch { return []; }
}

async function getRelatedCourses(category: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, slug, cover_image_url, price, category')
      .eq('is_published', true)
      .eq('category', category)
      .limit(2);
    return data || [];
  } catch { return []; }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Нийтлэл | Mommyoffice' };
  const title = locale === 'mn' ? String(article.title_mn || '') : String(article.title_en || article.title_mn || '');
  const description = locale === 'mn' ? String(article.excerpt_mn || '') : String(article.excerpt_en || article.excerpt_mn || '');
  return {
    title: `${title} | Mommyoffice`,
    description,
    openGraph: { title, description, images: article.cover_image_url ? [String(article.cover_image_url)] : [] },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  'Эрүүл мэнд': '#22c55e', 'Гоо сайхан': '#a855f7',
  'Хоол тэжээл': '#3b82f6', 'Гэр бүл': '#06b6d4',
  'Бизнес': '#f97316', 'Хувийн хөгжил': '#eab308',
  'Lifestyle': '#ec4899', 'default': '#00B5AD',
};

const CAT_GRADIENTS: Record<string, string> = {
  'Эрүүл мэнд': 'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'Гоо сайхан': 'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'Хоол тэжээл': 'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'Гэр бүл': 'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'Бизнес': 'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'Хувийн хөгжил': 'linear-gradient(135deg,#1a1a0d,#3d3d15)',
  'Lifestyle': 'linear-gradient(135deg,#1a0d1a,#3d153d)',
  'default': 'linear-gradient(135deg,#1a1a2e,#2d1b4e)',
};

function readTime(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 60));
}

function formatDate(d: string | null, locale: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarTrending({ articles, locale }: { articles: Record<string, unknown>[]; locale: string }) {
  if (articles.length === 0) return null;
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '3px', height: '16px', background: '#ef4444', borderRadius: '2px' }} />
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#666', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Их уншигдсан</h3>
      </div>
      {articles.map((a, i) => {
        const title = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
        const cat = String(a.category || '');
        const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
        const href = `/${locale}/articles/${String(a.slug)}`;
        return (
          <Link key={String(a.id || i)} href={href} style={{ textDecoration: 'none', display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#222', fontStyle: 'italic', width: '26px', flexShrink: 0, fontFamily: 'Georgia,serif', lineHeight: 1.2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>{cat}</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#ccc', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SidebarCourses({ courses, locale }: { courses: Record<string, unknown>[]; locale: string }) {
  if (courses.length === 0) return null;
  return (
    <div style={{ marginBottom: '24px', background: '#1a1a1a', borderRadius: '12px', padding: '16px', border: '1px solid #222' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#00B5AD', margin: '0 0 14px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>📚 Холбоотой сургалт</h3>
      {courses.map((c, i) => {
        const title = locale === 'mn' ? String(c.title_mn || '') : String(c.title_en || c.title_mn || '');
        const href = `/${locale}/courses/${String(c.slug)}`;
        const grad = CAT_GRADIENTS[String(c.category || '')] || CAT_GRADIENTS.default;
        return (
          <Link key={String(c.id || i)} href={href} style={{ textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: i < courses.length - 1 ? '1px solid #262626' : 'none' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: grad, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden' }}>
              {c.cover_image_url ? <img src={String(c.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎓'}
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e5e5e5', margin: '0 0 2px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
              <span style={{ fontSize: '11px', color: '#00B5AD', fontWeight: 700 }}>₮{Number(c.price || 0).toLocaleString()}</span>
            </div>
          </Link>
        );
      })}
      <Link href={`/${locale}/courses`} style={{ display: 'block', textAlign: 'center', marginTop: '12px', padding: '8px', background: 'rgba(0,181,173,0.1)', border: '1px solid rgba(0,181,173,0.3)', borderRadius: '6px', color: '#00B5AD', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
        Бүх сургалт харах →
      </Link>
    </div>
  );
}

function RelatedCard({ a, locale }: { a: Record<string, unknown>; locale: string }) {
  const title = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
  const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_mn || '');
  const cat = String(a.category || '');
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const grad = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;
  const href = `/${locale}/articles/${String(a.slug)}`;
  return (
    <Link href={href} style={{ textDecoration: 'none', flex: '0 0 220px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a', border: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '130px', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden', position: 'relative' }}>
        {a.cover_image_url ? <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{String(a.emoji || '✨')}</span>}
        <span style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '9px', fontWeight: 800, color: catColor, background: 'rgba(0,0,0,0.7)', padding: '2px 7px', borderRadius: '3px', textTransform: 'uppercase' }}>{cat}</span>
      </div>
      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 5px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
        {excerpt && <p style={{ fontSize: '11px', color: '#555', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{excerpt}</p>}
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>📖</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>Нийтлэл олдсонгүй</h1>
        <p style={{ color: '#666', lineHeight: 1.7 }}>Энэ нийтлэл бэлдэгдэж байна эсвэл устгагдсан байна.</p>
        <Link href={`/${locale}/articles`} style={{ display: 'inline-block', background: '#00B5AD', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, marginTop: '8px' }}>← Буцах</Link>
      </div>
    );
  }

  const title   = locale === 'mn' ? String(article.title_mn || '') : String(article.title_en || article.title_mn || '');
  const body    = locale === 'mn' ? String(article.body_mn || article.body_en || '') : String(article.body_en || article.body_mn || '');
  const excerpt = locale === 'mn' ? String(article.excerpt_mn || '') : String(article.excerpt_en || article.excerpt_mn || '');
  const cat     = String(article.category || '');
  const catColor = CAT_COLORS[cat] || CAT_COLORS.default;
  const date    = formatDate(String(article.published_at || ''), locale);
  const mins    = readTime(body + ' ' + title);
  const shareUrl = `https://mommyoffice.com/${locale}/articles/${slug}`;

  const [relatedArticles, trending, relatedCourses] = await Promise.all([
    getRelatedArticles(cat, slug),
    getTrendingArticles(slug),
    getRelatedCourses(cat),
  ]);

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>

      {/* ── HERO COVER ── */}
      <div style={{ position: 'relative', width: '100%', height: '480px', overflow: 'hidden' }}>
        {article.cover_image_url ? (
          <img src={String(article.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: CAT_GRADIENTS[cat] || CAT_GRADIENTS.default }} />
        )}
        {/* Left-to-right gradient — keeps right 50% of image at full clarity */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(17,17,17,0.95) 0%, rgba(17,17,17,0.6) 48%, rgba(17,17,17,0.15) 75%, transparent 100%)' }} />
        {/* Bottom fade to body background */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, #111)' }} />
        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Нүүр</Link>
            <span style={{ color: '#555' }}>›</span>
            <Link href={`/${locale}/articles`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Нийтлэл</Link>
            <span style={{ color: '#555' }}>›</span>
            <Link href={`/${locale}/articles?category=${encodeURIComponent(cat)}`} style={{ color: catColor, textDecoration: 'none', fontWeight: 600 }}>{cat}</Link>
          </div>
        </div>
        {/* Hero title block */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '0', right: '0', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <span style={{ display: 'inline-block', background: `${catColor}22`, border: `1px solid ${catColor}55`, color: catColor, padding: '3px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            {cat}
          </span>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.5px',
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            maxWidth: '620px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </h1>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="mo-detail-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem 4rem', alignItems: 'flex-start' }}>

        {/* ── LEFT: Article ── */}
        <article>

          {/* Meta bar */}
          <div className="mo-meta-bar" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '2rem', padding: '14px 20px', background: '#1a1a1a', borderRadius: '10px', border: '1px solid #222' }}>
            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${catColor}33`, border: `2px solid ${catColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: catColor, flexShrink: 0 }}>
                {article.author_name ? String(article.author_name)[0].toUpperCase() : 'M'}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>{String(article.author_name || 'Mommyoffice')}</p>
                <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>Зохиолч</p>
              </div>
            </div>
            {date && <div style={{ fontSize: '12px', color: '#666' }}>📅 {date}</div>}
            <div style={{ fontSize: '12px', color: '#666' }}>⏱ {mins} минут унших</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {/* FB share */}
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: '6px 14px', borderRadius: '6px', background: '#1877f2', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                f Хуваалцах
              </a>
              {/* Copy link */}
              <a href={shareUrl} style={{ padding: '6px 14px', borderRadius: '6px', background: '#1a1a1a', border: '1px solid #333', color: '#aaa', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                🔗 Холбоос
              </a>
            </div>
          </div>

          {/* Excerpt / lead */}
          {excerpt && (
            <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#aaa', fontWeight: 400, marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #1f1f1f', fontStyle: 'italic' }}>
              {excerpt}
            </p>
          )}

          {/* Body HTML */}
          {body ? (
            <div
              className="mo-article-body"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <div style={{ background: '#1a1a1a', border: '1px dashed #2a2a2a', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '12px' }}>✍️</p>
              <p style={{ color: '#555', fontSize: '15px', fontWeight: 600 }}>Нийтлэлийн агуулга удахгүй нэмэгдэх болно</p>
            </div>
          )}

          {/* Tags row */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>Ангилал:</span>
            <Link href={`/${locale}/articles?category=${encodeURIComponent(cat)}`}
              style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: `${catColor}18`, border: `1px solid ${catColor}44`, color: catColor, textDecoration: 'none' }}>
              {cat}
            </Link>
          </div>

          {/* ── Related Articles row ── */}
          {relatedArticles.length > 0 && (
            <section style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '3px', height: '18px', background: catColor, borderRadius: '2px' }} />
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>Төстэй нийтлэлүүд</h2>
                </div>
                <Link href={`/${locale}/articles?category=${encodeURIComponent(cat)}`} style={{ fontSize: '12px', color: '#555', fontWeight: 600, textDecoration: 'none' }}>Бүгдийг харах →</Link>
              </div>
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {relatedArticles.map((a, i) => (
                  <RelatedCard key={String((a as Record<string, unknown>).id || i)} a={a as Record<string, unknown>} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {/* ── Newsletter subscribe ── */}
          <div style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, #0d2537, #1a4a6b)', borderRadius: '14px', border: '1px solid rgba(0,181,173,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>📬 Шинэ нийтлэлийг хамгийн түрүүнд аваарай</p>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 20px' }}>7 хоног бүр эрүүл мэнд, амьдралын хэв маяг, гэр бүлийн мэдээлэл — шууд цахим шуудан руу чинь</p>
            <form action="#" style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
              <input type="email" placeholder="Цахим шуудан хаяг" required
                style={{ flex: 1, padding: '11px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: '14px', outline: 'none' }} />
              <button type="submit"
                style={{ padding: '11px 20px', borderRadius: '8px', background: '#00B5AD', border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Бүртгүүлэх
              </button>
            </form>
          </div>
        </article>

        {/* ── RIGHT: Sticky sidebar ── */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* Related courses */}
          <SidebarCourses courses={relatedCourses as Record<string, unknown>[]} locale={locale} />

          {/* Trending */}
          <SidebarTrending articles={trending as Record<string, unknown>[]} locale={locale} />

          {/* 300×250 ad */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
            <span style={{ fontSize: '10px', color: '#333', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Сурталчилгааны зай</span>
            <span style={{ fontSize: '11px', color: '#2a2a2a' }}>300×250</span>
            <span style={{ fontSize: '10px', color: '#222', marginTop: '4px' }}>info.mommyoffice@gmail.com</span>
          </div>
        </aside>
      </div>

      <style>{`
        /* ── Article body typography ── */
        .mo-article-body { font-size: 17px; line-height: 1.85; color: #c8c8c8; }
        .mo-article-body h2 { font-size: 1.45rem; font-weight: 800; color: #e5e5e5; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #1f1f1f; }
        .mo-article-body h3 { font-size: 1.15rem; font-weight: 700; color: #e5e5e5; margin: 2rem 0 0.75rem; }
        .mo-article-body p { margin: 0 0 1.4rem; }
        .mo-article-body img { max-width: 100%; border-radius: 10px; margin: 1.5rem 0; }
        .mo-article-body blockquote { border-left: 4px solid #00B5AD; margin: 2rem 0; padding: 1rem 1.5rem; background: rgba(0,181,173,0.07); border-radius: 0 10px 10px 0; font-style: italic; color: #aaa; font-size: 18px; }
        .mo-article-body ul, .mo-article-body ol { margin: 0 0 1.4rem; padding-left: 1.5rem; }
        .mo-article-body li { margin-bottom: 0.5rem; }
        .mo-article-body a { color: #00B5AD; text-decoration: underline; }
        .mo-article-body strong { color: #e5e5e5; font-weight: 700; }

        /* ── Detail grid: desktop (no inline style conflict) ── */
        .mo-detail-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 3.5rem;
        }

        /* ── TABLET (≤900px): collapse sidebar ── */
        @media (max-width: 900px) {
          .mo-detail-grid { grid-template-columns: 1fr; padding: 1.5rem 1.5rem 3rem; gap: 2rem; }
          .mo-detail-grid > aside { display: none; }
        }

        /* ── MOBILE (≤768px) ── */
        @media (max-width: 768px) {
          .mo-detail-grid { padding: 1.25rem 1rem 3rem; }
        }

        /* ── MOBILE: meta bar — centered column layout ── */
        @media (max-width: 600px) {
          .mo-meta-bar { flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 16px; }
          .mo-meta-bar > div:last-child { width: 100%; justify-content: center; margin-left: 0 !important; }
        }

        /* ── MOBILE: article body font scaling ── */
        @media (max-width: 600px) {
          .mo-article-body { font-size: 15px !important; line-height: 1.75 !important; }
          .mo-article-body h2 { font-size: 1.2rem !important; }
          .mo-article-body h3 { font-size: 1.05rem !important; }
          .mo-article-body blockquote { font-size: 15px !important; padding: 0.75rem 1rem !important; }
        }

        /* ── Prevent overflow ── */
        .mo-article-body img { max-width: 100% !important; }
        .mo-article-body { overflow-x: hidden; }
      `}</style>
    </div>
  );
}
