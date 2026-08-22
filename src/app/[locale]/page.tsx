import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function getFeaturedCourses() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, price, cover_image_url, slug, category')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12);
    return data || [];
  } catch { return []; }
}

async function getLatestArticles() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(12);
    return data || [];
  } catch { return []; }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const [courses, articles] = await Promise.all([getFeaturedCourses(), getLatestArticles()]);

  const displayCourses = courses.length > 0 ? courses : PLACEHOLDER_COURSES;
  const displayArticles = articles.length > 0 ? articles : PLACEHOLDER_ARTICLES;

  return (
    <div style={{ background: '#141414', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO — full-viewport cinematic banner
          identical layout to Netflix browse page
      ══════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        width: '100%',
        height: '90vh',
        minHeight: '560px',
        overflow: 'hidden',
        background: '#000',
      }}>
        {/* Hero background — replace src with real image when available */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0d1117 0%, #1a1a2e 35%, #0f2647 65%, #0a3d62 100%)',
        }}>
          {/* Cinematic texture overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              radial-gradient(ellipse at 70% 40%, rgba(0,181,173,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(255,217,61,0.05) 0%, transparent 50%)
            `,
          }} />
        </div>

        {/* Left fade for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        }} />

        {/* Bottom fade into page */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          background: 'linear-gradient(to bottom, transparent 0%, #141414 100%)',
        }} />

        {/* Hero content — bottom-left like Netflix */}
        <div style={{
          position: 'absolute',
          bottom: '18%',
          left: '4%',
          maxWidth: '520px',
          zIndex: 2,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0,181,173,0.2)',
            border: '1px solid rgba(0,181,173,0.5)',
            color: '#00B5AD',
            padding: '4px 12px', borderRadius: '4px',
            fontSize: '11px', fontWeight: 700, marginBottom: '1rem',
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            🇲🇳 MONGOLIA #1
          </div>

          {/* Title — Netflix uses large serif-style */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            color: '#ffffff',
            marginBottom: '1rem',
            textShadow: '2px 2px 20px rgba(0,0,0,0.8)',
            letterSpacing: '-1px',
          }}>
            {t('hero_title')}
          </h1>

          {/* Meta row — like Netflix "Show • Romance • 2026" */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', fontWeight: 600, color: '#d4d4d4',
            marginBottom: '1rem',
          }}>
            <span style={{ color: '#00B5AD' }}>Платформ</span>
            <span style={{ color: '#555' }}>•</span>
            <span>Сургалт</span>
            <span style={{ color: '#555' }}>•</span>
            <span>Нийтлэл</span>
            <span style={{ color: '#555' }}>•</span>
            <span>Кино</span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '14px',
            color: '#b3b3b3',
            lineHeight: 1.7,
            marginBottom: '1.75rem',
            textShadow: '1px 1px 8px rgba(0,0,0,0.6)',
          }}>
            {t('hero_subtitle')}
          </p>

          {/* Buttons — Netflix style: filled + ghost */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/courses`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--teal)',
              color: '#fff',
              padding: '11px 28px',
              borderRadius: '4px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '15px',
              boxShadow: '0 4px 24px rgba(0,181,173,0.4)',
              letterSpacing: '0.2px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Үзэх
            </Link>
            <Link href={`/${locale}/articles`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(109,109,110,0.7)',
              color: '#fff',
              padding: '11px 28px',
              borderRadius: '4px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '15px',
              backdropFilter: 'blur(4px)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Дэлгэрэнгүй
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTENT ROWS — edge-to-edge like Netflix
      ══════════════════════════════════════════ */}

      {/* Row 1: Featured Courses */}
      <section style={{ padding: '0 0 2.5rem', marginTop: '-4rem', position: 'relative', zIndex: 2 }}>
        <div style={{ padding: '0 4%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e5e5e5' }}>
              {t('featured_courses')}
            </h2>
            <Link href={`/${locale}/courses`} style={{
              color: 'var(--teal)', textDecoration: 'none',
              fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Бүгдийг харах →
            </Link>
          </div>

          <div style={{
            display: 'flex', gap: '6px', overflowX: 'auto',
            scrollbarWidth: 'none', paddingBottom: '4px',
          }}
            className="netflix-scroll"
          >
            {displayCourses.map((course: Record<string, unknown>, i: number) => {
              const title = locale === 'mn'
                ? String(course.title_mn || course.title || '')
                : String(course.title_en || course.title_mn || course.title || '');
              const price = Number(course.price) || 0;
              const slug = course.slug ? `/${locale}/courses/${course.slug}` : '#';
              return (
                <Link key={String(course.id || i)} href={slug} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div className="netflix-card" style={{
                    width: '200px', borderRadius: '4px', overflow: 'hidden',
                    background: '#2f2f2f', position: 'relative',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: '200px', height: '112px',
                      background: 'linear-gradient(135deg, #1a2a3a 0%, #0f3460 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {course.cover_image_url ? (
                        <img src={String(course.cover_image_url)} alt={title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>{String(course.emoji || '📚')}</span>
                      )}
                      {/* Price badge */}
                      <span style={{
                        position: 'absolute', bottom: '6px', right: '6px',
                        background: price === 0 ? '#10b981' : 'var(--teal)',
                        color: '#fff', fontSize: '10px', fontWeight: 700,
                        padding: '2px 7px', borderRadius: '3px',
                      }}>
                        {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                      </span>
                    </div>
                    {/* Title */}
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{
                        fontWeight: 600, fontSize: '12px', color: '#e5e5e5',
                        lineHeight: 1.4, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {title}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Row 2: Latest Articles */}
      <section style={{ padding: '0 0 4rem' }}>
        <div style={{ padding: '0 4%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e5e5e5' }}>
              {t('latest_articles')}
            </h2>
            <Link href={`/${locale}/articles`} style={{
              color: 'var(--teal)', textDecoration: 'none',
              fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Бүгдийг харах →
            </Link>
          </div>

          <div style={{
            display: 'flex', gap: '6px', overflowX: 'auto',
            scrollbarWidth: 'none', paddingBottom: '4px',
          }}>
            {displayArticles.map((a: Record<string, unknown>, i: number) => {
              const title = locale === 'mn'
                ? String(a.title_mn || a.title || '')
                : String(a.title_en || a.title_mn || a.title || '');
              const href = a.slug ? `/${locale}/articles/${a.slug}` : '#';
              return (
                <Link key={String(a.id || i)} href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div className="netflix-card" style={{
                    width: '200px', borderRadius: '4px', overflow: 'hidden',
                    background: '#2f2f2f', position: 'relative',
                  }}>
                    <div style={{
                      width: '200px', height: '112px',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {a.cover_image_url ? (
                        <img src={String(a.cover_image_url)} alt={title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>{String(a.emoji || '✨')}</span>
                      )}
                      <span style={{
                        position: 'absolute', bottom: '6px', left: '6px',
                        background: 'rgba(0,181,173,0.85)',
                        color: '#fff', fontSize: '9px', fontWeight: 700,
                        padding: '2px 7px', borderRadius: '3px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {String(a.category || a.cat || 'Lifestyle')}
                      </span>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{
                        fontWeight: 600, fontSize: '12px', color: '#e5e5e5',
                        lineHeight: 1.4, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {title}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        .netflix-scroll::-webkit-scrollbar { display: none; }
        div[style*="overflow-x: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/* ── Placeholder data ── */
const PLACEHOLDER_COURSES: Record<string, unknown>[] = [
  { id: 'p1', title_mn: 'Гэрийн хоол хийх урлаг', price: 29900, emoji: '🍳', category: 'Хоол' },
  { id: 'p2', title_mn: 'Арьс нүүрний арчилгаа', price: 39900, emoji: '💆', category: 'Гоо сайхан' },
  { id: 'p3', title_mn: 'Дотоод амар тайван', price: 24900, emoji: '🧘', category: 'Эрүүл мэнд' },
  { id: 'p4', title_mn: 'Бизнес эхлүүлэх 101', price: 49900, emoji: '💼', category: 'Бизнес' },
  { id: 'p5', title_mn: 'Гэрийн чимэглэл', price: 19900, emoji: '🏠', category: 'Дизайн' },
  { id: 'p6', title_mn: 'Хувийн санхүүгийн удирдлага', price: 34900, emoji: '💰', category: 'Бизнес' },
  { id: 'p7', title_mn: 'Гэр бүлийн харилцаа', price: 29900, emoji: '💝', category: 'Гэр бүл' },
  { id: 'p8', title_mn: 'Зорилго тавих — Goal Setting', price: 0, emoji: '🎯', category: 'Хувийн хөгжил' },
];

const PLACEHOLDER_ARTICLES: Record<string, unknown>[] = [
  { id: 'a1', title_mn: 'Өглөөний эрүүл дэглэм — 5 алхам', category: 'Эрүүл мэнд', emoji: '🌅' },
  { id: 'a2', title_mn: 'Гэрийнхнийхээ хоолны дэглэмийг яаж сайжруулах вэ?', category: 'Хоол тэжээл', emoji: '🥗' },
  { id: 'a3', title_mn: 'Монгол эмэгтэйчүүдийн бизнес амжилтын нууц', category: 'Бизнес', emoji: '🚀' },
  { id: 'a4', title_mn: 'Арьсаа хэрхэн арчлах вэ — мэргэжилтний зөвлөгөө', category: 'Гоо сайхан', emoji: '✨' },
  { id: 'a5', title_mn: 'Гэр бүлийн бат бөх холбоо', category: 'Гэр бүл', emoji: '💝' },
  { id: 'a6', title_mn: 'Зорилгодоо хэрхэн хурдан хүрэх вэ?', category: 'Хувийн хөгжил', emoji: '🎯' },
  { id: 'a7', title_mn: 'Дотоод амар тайвнаа хэрхэн олох вэ', category: 'Эрүүл мэнд', emoji: '🧘' },
  { id: 'a8', title_mn: 'Гэрийн чимэглэл: энгийн боловч гоё', category: 'Дизайн', emoji: '🏡' },
];
