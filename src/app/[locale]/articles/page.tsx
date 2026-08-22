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
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at, excerpt_mn, excerpt_en')
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

const PLACEHOLDER_ARTICLES = [
  { id: '1', title_mn: 'Өглөөний эрүүл дэглэм — 5 алхам', title_en: 'Morning Wellness Routine — 5 Steps', category: 'Эрүүл мэнд', emoji: '🌅', slug: '#', excerpt_mn: 'Өглөөгөө зөв эхлүүлж эрүүл амьдралын суурийг тавь' },
  { id: '2', title_mn: 'Гэрийнхнийхээ хоолны дэглэмийг яаж сайжруулах вэ?', title_en: 'How to Improve Your Family\'s Diet?', category: 'Хоол тэжээл', emoji: '🥗', slug: '#', excerpt_mn: 'Гэр бүлийнхэндээ эрүүл, амттай хоол хийх нууц' },
  { id: '3', title_mn: 'Монгол эмэгтэйчүүдийн бизнес амжилтын нууц', title_en: 'The Secret to Mongolian Women\'s Business Success', category: 'Бизнес', emoji: '🚀', slug: '#', excerpt_mn: 'Амжилтанд хүрсэн Монгол эмэгтэйчүүдийн туршлага' },
  { id: '4', title_mn: 'Арьсаа хэрхэн арчлах вэ — мэргэжилтний зөвлөгөө', title_en: 'Expert Skincare Advice', category: 'Гоо сайхан', emoji: '✨', slug: '#', excerpt_mn: 'Мэргэжилтэн арьс арчлалын талаар юу хэлэв' },
  { id: '5', title_mn: 'Гэр бүлийн бат бөх холбоо', title_en: 'Building Strong Family Bonds', category: 'Гэр бүл', emoji: '💝', slug: '#', excerpt_mn: 'Гэр бүлийн гишүүдийн хоорондох харилцааг хэрхэн бэхжүүлэх' },
  { id: '6', title_mn: 'Зорилгодоо хэрхэн хурдан хүрэх вэ?', title_en: 'How to Reach Your Goals Faster?', category: 'Хувийн хөгжил', emoji: '🎯', slug: '#', excerpt_mn: 'Зорилгоо тодорхой тавьж, хурдан хэрэгжүүлэх аргууд' },
  { id: '7', title_mn: 'Дотоод амар тайвнаа хэрхэн олох вэ', title_en: 'How to Find Inner Peace', category: 'Эрүүл мэнд', emoji: '🧘', slug: '#', excerpt_mn: 'Стресс тайлж оюун санааны амар тайвнаа ол' },
  { id: '8', title_mn: 'Гэрийн чимэглэл: энгийн боловч гоё', title_en: 'Home Decor: Simple Yet Beautiful', category: 'Lifestyle', emoji: '🏡', slug: '#', excerpt_mn: 'Бага мөнгөөр гэрээ хэрхэн гоёмсог болгох вэ' },
  { id: '9', title_mn: 'Хүүхэдтэйгээ чанарын цагийг хэрхэн өнгөрүүлэх', title_en: 'Quality Time With Your Children', category: 'Гэр бүл', emoji: '👨‍👩‍👧', slug: '#', excerpt_mn: 'Хүүхдийнхээ хөгжилд ач тустай үйл ажиллагаанууд' },
];

const CATEGORIES = ['Бүх ангилал', 'Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил'];

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
  const allArticles = dbArticles.length > 0 ? dbArticles : PLACEHOLDER_ARTICLES;
  const displayArticles = (category && category !== 'Бүх ангилал')
    ? allArticles.filter((a: Record<string, unknown>) => String(a.category || '') === category)
    : allArticles;

  const featured = displayArticles[0] as Record<string, unknown>;
  const featuredTitle  = locale === 'mn' ? String(featured?.title_mn || '') : String(featured?.title_en || featured?.title_mn || '');
  const featuredExcerpt = locale === 'mn' ? String(featured?.excerpt_mn || '') : String(featured?.excerpt_en || featured?.excerpt_mn || '');
  const featuredSlug   = featured?.slug && featured.slug !== '#' ? `/${locale}/articles/${featured.slug}` : '#';
  const featuredGrad   = CAT_GRADIENTS[String(featured?.category || '')] || CAT_GRADIENTS.default;

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── NETFLIX-STYLE HERO ── */}
      <section style={{
        position: 'relative', width: '100%',
        height: '72vh', minHeight: '480px', overflow: 'hidden',
      }}>
        {/* Background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: featuredGrad,
        }}>
          {featured?.cover_image_url ? (
            <img
              src={String(featured.cover_image_url)}
              alt={featuredTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
            />
          ) : (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: '8%', opacity: 0.15,
              fontSize: 'min(40vw, 320px)',
            }}>
              {String(featured?.emoji || '✨')}
            </div>
          )}
        </div>

        {/* Gradients */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(to bottom, transparent, #141414)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: '22%', left: '4%',
          maxWidth: '540px', zIndex: 2,
        }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)',
            color: '#00B5AD', padding: '3px 10px', borderRadius: '4px',
            fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            {String(featured?.category || 'Нийтлэл')}
          </span>

          <h1 style={{
            fontSize: 'clamp(1.8rem,4.5vw,3.4rem)', fontWeight: 800,
            lineHeight: 1.15, color: '#fff', marginBottom: '0.75rem',
            letterSpacing: '-0.5px', textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}>
            {featuredTitle}
          </h1>

          {featuredExcerpt && (
            <p style={{
              fontSize: '15px', color: '#b0bcc8', lineHeight: 1.65,
              marginBottom: '1.5rem', maxWidth: '440px',
            }}>
              {featuredExcerpt}
            </p>
          )}

          <Link href={featuredSlug} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#00B5AD', color: '#fff',
            padding: '11px 28px', borderRadius: '6px',
            fontWeight: 700, textDecoration: 'none', fontSize: '15px',
            boxShadow: '0 4px 20px rgba(0,181,173,0.35)',
          }}>
            Унших →
          </Link>
        </div>
      </section>

      {/* ── CATEGORY FILTER PILLS ── */}
      <div style={{
        padding: '1.5rem 4%',
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        borderBottom: '1px solid #2a2a2a',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = category === cat || (!category && cat === 'Бүх ангилал');
          return (
            <Link
              key={cat}
              href={cat === 'Бүх ангилал' ? `/${locale}/articles` : `/${locale}/articles?category=${encodeURIComponent(cat)}`}
              style={{
                padding: '7px 16px', borderRadius: '20px',
                fontSize: '13px', fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#00B5AD' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#fff' : '#ccc',
                border: `1px solid ${isActive ? '#00B5AD' : 'rgba(255,255,255,0.15)'}`,
              }}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* ── ARTICLE GRID ── */}
      <div style={{ padding: '2rem 4%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {displayArticles.map((a: Record<string, unknown>, i: number) => {
            const title   = locale === 'mn' ? String(a.title_mn || '') : String(a.title_en || a.title_mn || '');
            const excerpt = locale === 'mn' ? String(a.excerpt_mn || '') : String(a.excerpt_en || a.excerpt_mn || '');
            const cat     = String(a.category || '');
            const date    = a.published_at
              ? new Date(String(a.published_at)).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '';
            const href = a.slug && a.slug !== '#' ? `/${locale}/articles/${a.slug}` : '#';
            const grad = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default;

            return (
              <Link key={String(a.id || i)} href={href} style={{ textDecoration: 'none', display: 'flex' }}>
                <article className="netflix-card" style={{
                  borderRadius: '10px', overflow: 'hidden',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  width: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  {/* Cover */}
                  <div style={{
                    height: '190px', background: grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    fontSize: '3.5rem',
                  }}>
                    {a.cover_image_url ? (
                      <img src={String(a.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{String(a.emoji || '✨')}</span>
                    )}
                    {/* overlay gradient */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                    }} />
                    {/* category badge */}
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                      color: '#00B5AD', fontSize: '10px', fontWeight: 700,
                      padding: '3px 9px', borderRadius: '4px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {cat}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {date && (
                      <span style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>{date}</span>
                    )}
                    <h2 style={{
                      fontSize: '14px', fontWeight: 700, color: '#e5e5e5',
                      lineHeight: 1.5, marginBottom: '6px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      minHeight: '42px',
                    }}>
                      {title}
                    </h2>
                    {excerpt && (
                      <p style={{
                        fontSize: '12px', color: '#777', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        margin: 0,
                      }}>
                        {excerpt}
                      </p>
                    )}
                    <span style={{
                      display: 'inline-block', marginTop: 'auto', paddingTop: '10px',
                      color: '#00B5AD', fontSize: '12px', fontWeight: 700,
                    }}>
                      {t('read_more')} →
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
