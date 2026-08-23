import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at, excerpt_mn, excerpt_en, emoji')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    return data || [];
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

const PLACEHOLDER_ARTICLES = [
  { id:'1', title_mn:'Өглөөний эрүүл дэглэм — 5 алхам', title_en:'Morning Wellness Routine', category:'Эрүүл мэнд', emoji:'🌅', slug:'#', excerpt_mn:'Өглөөгөө зөв эхлүүлж эрүүл амьдралын суурийг тавь. Энгийн 5 алхам таны өдрийг бүхэлд нь өөрчилнэ.', cover_image_url:null, published_at:'2026-08-23' },
  { id:'2', title_mn:'Гэрийнхнийхээ хоолны дэглэмийг яаж сайжруулах вэ?', title_en:"Improve Family's Diet", category:'Хоол тэжээл', emoji:'🥗', slug:'#', excerpt_mn:'Гэр бүлийнхэндээ эрүүл амттай хоол хийх нууц. Мэргэжилтэний зөвлөмжийг дагана уу.', cover_image_url:null, published_at:'2026-08-22' },
  { id:'3', title_mn:'Монгол эмэгтэйчүүдийн бизнес амжилтын нууц', title_en:"Women's Business Success", category:'Бизнес', emoji:'🚀', slug:'#', excerpt_mn:'Амжилтанд хүрсэн Монгол эмэгтэйчүүдийн туршлагаас суралц.', cover_image_url:null, published_at:'2026-08-21' },
  { id:'4', title_mn:'Арьсаа хэрхэн арчлах вэ — мэргэжилтний зөвлөгөө', title_en:'Expert Skincare Advice', category:'Гоо сайхан', emoji:'✨', slug:'#', excerpt_mn:'Мэргэжилтэн арьс арчлалын тухай дэлгэрэнгүй тайлбарлав.', cover_image_url:null, published_at:'2026-08-20' },
  { id:'5', title_mn:'Гэр бүлийн бат бөх холбоо', title_en:'Strong Family Bonds', category:'Гэр бүл', emoji:'💝', slug:'#', excerpt_mn:'Гэр бүлийн гишүүдийн хоорондох харилцааг хэрхэн бэхжүүлэх вэ?', cover_image_url:null, published_at:'2026-08-19' },
  { id:'6', title_mn:'Зорилгодоо хэрхэн хурдан хүрэх вэ?', title_en:'Reach Goals Faster', category:'Хувийн хөгжил', emoji:'🎯', slug:'#', excerpt_mn:'Зорилгоо тодорхой тавьж хурдан хэрэгжүүлэх арга замууд.', cover_image_url:null, published_at:'2026-08-18' },
  { id:'7', title_mn:'Дотоод амар тайвнаа хэрхэн олох вэ', title_en:'Find Inner Peace', category:'Эрүүл мэнд', emoji:'🧘', slug:'#', excerpt_mn:'Стресс тайлж оюун санааны амар тайвнаа олох дасгалууд.', cover_image_url:null, published_at:'2026-08-17' },
  { id:'8', title_mn:'Гэрийн чимэглэл: энгийн боловч гоё', title_en:'Simple Home Decor', category:'Lifestyle', emoji:'🏡', slug:'#', excerpt_mn:'Бага мөнгөөр гэрээ хэрхэн гоёмсог болгох вэ — практик зөвлөгөө.', cover_image_url:null, published_at:'2026-08-16' },
  { id:'9', title_mn:'Хүүхэдтэйгээ чанарын цагийг хэрхэн өнгөрүүлэх', title_en:'Quality Time With Kids', category:'Гэр бүл', emoji:'👨‍👩‍👧', slug:'#', excerpt_mn:'Хүүхдийнхээ хөгжилд ач тустай үйл ажиллагаанууд.', cover_image_url:null, published_at:'2026-08-15' },
];

const CATEGORIES = ['Бүх ангилал', 'Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил'];

function readTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 60));
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
      <div style={{ margin: '0 0 2rem', background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px 32px' }}>
        <div style={{ width: '40px', height: '40px', background: 'rgba(0,181,173,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px' }}>📢</span>
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#444', margin: '0 0 2px' }}>Сурталчилгааны зай — 970×90</p>
          <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>Захиалах: info.mommyoffice@gmail.com</p>
        </div>
      </div>
    );
  }
  // leaderboard
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '16px 24px', margin: '24px 0' }}>
      <div style={{ width: '36px', height: '36px', background: 'rgba(0,181,173,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '16px' }}>📢</span>
      </div>
      <div>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#444', margin: '0 0 2px', letterSpacing: '0.5px' }}>СУРТАЛЧИЛГААНЫ ЗАЙ — 970×90</p>
        <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>Захиалах: info.mommyoffice@gmail.com</p>
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
  const mins    = readTime(excerpt + ' ' + title);

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="mo-art-card" style={{
        display: 'flex', gap: '18px', alignItems: 'flex-start',
        padding: '20px 0', borderBottom: '1px solid #1f1f1f',
      }}>
        {/* Thumbnail */}
        <div style={{ width: '130px', height: '88px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: grad, position: 'relative' }}>
          {a.cover_image_url
            ? <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{String(a.emoji || '✨')}</div>
          }
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
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

  const dbArticles = await getArticles();
  const allArticles = (dbArticles.length > 0 ? dbArticles : PLACEHOLDER_ARTICLES) as Record<string, unknown>[];

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
  const editorsPick      = allArticles[2] || allArticles[0];

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', width: '100%', height: '72vh', minHeight: '480px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: featuredGrad }}>
          {featured?.cover_image_url ? (
            <img src={String(featured.cover_image_url)} alt={featuredTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8%', opacity: 0.12, fontSize: 'min(40vw,320px)' }}>
              {String(featured?.emoji || '✨')}
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.55) 55%,transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom,transparent,#111)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '4%', maxWidth: '560px', zIndex: 2 }}>
          <span style={{ display: 'inline-block', background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)', color: '#00B5AD', padding: '3px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
            {String(featured?.category || 'Нийтлэл')}
          </span>
          <h1 style={{ fontSize: 'clamp(1.7rem,3vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px', textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
            {featuredTitle}
          </h1>
          {featuredExcerpt && (
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '440px' }}>
              {featuredExcerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href={String(featuredSlug)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00B5AD', color: '#fff', padding: '11px 28px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,181,173,0.4)' }}>
              Унших →
            </Link>
            <span style={{ fontSize: '12px', color: '#666' }}>⏱ {readTime(featuredExcerpt + featuredTitle)} мин унших</span>
          </div>
        </div>
      </section>

      {/* ── BODY: 2-COLUMN EDITORIAL GRID ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── CATEGORY FILTER TABS ── */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '1.75rem 0 1.25rem', borderBottom: '1px solid #1f1f1f' }}>
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

        {/* ── MAIN 2-COL GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem', paddingTop: '2rem', alignItems: 'flex-start' }}>

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
          <div style={{ position: 'sticky', top: '80px' }}>

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
        .mo-art-card { transition: background 0.15s; border-radius: 8px; }
        .mo-art-card:hover { background: rgba(255,255,255,0.025); }
        .mo-sb-item { transition: opacity 0.15s; }
        .mo-sb-item:hover { opacity: 0.7; }
        .netflix-card { transition: transform 0.18s; }
        .netflix-card:hover { transform: translateY(-3px); }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 300px"] { grid-template-columns: 1fr !important; }
          div[style*="position: sticky"] { position: static !important; }
        }
      `}</style>
    </div>
  );
}
