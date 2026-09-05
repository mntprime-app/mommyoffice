export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import UniversalHero from '@/components/shared/UniversalHero';
import CarouselRow from '@/components/shared/CarouselRow';

async function getFeaturedCourses() {
  const supabase = await createAdminClient();
  const SEL = 'id, title_mn, title_en, price, cover_image_url, slug, category';
  // Try placement-filtered first (requires migration); fallback to all published
  try {
    const { data, error } = await supabase
      .from('mo_courses').select(SEL)
      .eq('is_published', true).eq('placement', 'home_featured')
      .order('created_at', { ascending: false }).limit(8);
    if (!error && data && data.length > 0) return data;
  } catch {}
  try {
    const { data } = await supabase
      .from('mo_courses').select(SEL)
      .eq('is_published', true)
      .order('created_at', { ascending: false }).limit(8);
    return data || [];
  } catch { return []; }
}

const ARTICLE_FIELDS = 'id, title_mn, title_en, cover_image_url, slug, category, published_at, placement, pin_rank';

async function getHomeArticles(): Promise<{ hero: Record<string, unknown> | null; trending: Record<string, unknown>[]; more: Record<string, unknown>[] }> {
  try {
    const supabase = await createAdminClient();
    const [heroRes, trendingRes, recentRes] = await Promise.all([
      supabase.from('mo_articles').select(ARTICLE_FIELDS)
        .eq('is_published', true).eq('placement', 'hero')
        .order('published_at', { ascending: false }).limit(1),
      supabase.from('mo_articles').select(ARTICLE_FIELDS)
        .eq('is_published', true).eq('placement', 'trending')
        .order('pin_rank', { ascending: true }).order('published_at', { ascending: false }).limit(5),
      supabase.from('mo_articles').select(ARTICLE_FIELDS)
        .eq('is_published', true)
        .order('published_at', { ascending: false }).limit(10),
    ]);
    const recent: Record<string, unknown>[] = recentRes.data || [];
    const heroFromDB = heroRes.data?.[0] as Record<string, unknown> | undefined;
    const hero: Record<string, unknown> | null = heroFromDB ?? recent[0] ?? null;
    // Only deduplicate if there's a real placement='hero' article — not a fallback
    const realHeroId = heroFromDB?.id;
    const trendingFromDB: Record<string, unknown>[] = (trendingRes.data || []) as Record<string, unknown>[];
    const trending = trendingFromDB.length > 0
      ? trendingFromDB.filter(a => a.id !== realHeroId)
      : recent.filter(a => a.id !== realHeroId).slice(0, 5);
    const usedIds = new Set([realHeroId, ...trending.map(a => a.id)].filter(Boolean));
    const more = recent.filter(a => !usedIds.has(a.id)).slice(0, 6);
    return { hero, trending, more };
  } catch {
    return { hero: null, trending: [], more: [] };
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const [courses, articles] = await Promise.all([getFeaturedCourses(), getHomeArticles()]);

  const displayCourses = courses.length > 0 ? courses : PLACEHOLDER_COURSES;
  const featuredArticle = articles.hero;
  const sideArticles = articles.trending;
  const moreArticles = articles.more;

  return (
    <div style={{ background: '#141414', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════
          HERO — UniversalHero standard
      ═══════════════════════════════════════ */}
      <UniversalHero
        badgeText="🇲🇳 MONGOLIA #1 PLATFORM"
        title={t('hero_title')}
        description={t('hero_subtitle')}
        primaryActionText="Үзэх"
        primaryHref={`/${locale}/courses`}
        secondaryActionText="Дэлгэрэнгүй"
        secondaryHref={`/${locale}/articles`}
        cornerBadge="🏆 Mongolia #1"
      />

      {/* ═══════════════════════════════════════
          ROW 1 — FEATURED COURSES
          MasterClass-style large landscape cards
      ═══════════════════════════════════════ */}
      <section className="mo-section-gap mo-courses-row" style={{ padding: '2rem 0 3rem', marginTop: '0', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <RowHeader title={t('featured_courses')} href={`/${locale}/courses`} />
          <CarouselRow count={displayCourses.length}>
            {displayCourses.map((c: Record<string, unknown>, i: number) => {
              const title = locale === 'mn'
                ? String(c.title_mn || c.title || '')
                : String(c.title_en || c.title_mn || c.title || '');
              const price = Number(c.price) || 0;
              const slug = c.slug ? `/${locale}/courses/${c.slug}` : '#';
              const gradients = [
                'linear-gradient(135deg,#0d2137,#1a4a6b)',
                'linear-gradient(135deg,#1a0d37,#4a1a6b)',
                'linear-gradient(135deg,#0d3720,#1a6b3a)',
                'linear-gradient(135deg,#371a0d,#6b3a1a)',
                'linear-gradient(135deg,#0d2537,#1a5a6b)',
              ];
              return (
                <Link key={String(c.id || i)} href={slug} className="mo-snap-card" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div className="netflix-card mo-home-course-card" style={{
                    width: '280px', borderRadius: '10px', overflow: 'hidden',
                    background: '#1a1a1a', position: 'relative',
                  }}>
                    {/* Thumbnail — 16:9 */}
                    <div className="mo-home-course-thumb" style={{
                      width: '280px', height: '157px',
                      background: gradients[i % gradients.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {c.cover_image_url
                        ? <img src={String(c.cover_image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '3rem' }}>{String(c.emoji || '📚')}</span>
                      }
                      {/* Category tag */}
                      <span style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                        color: '#fff', fontSize: '10px', fontWeight: 700,
                        padding: '3px 9px', borderRadius: '4px',
                        textTransform: 'uppercase', letterSpacing: '0.8px',
                      }}>
                        {String(c.category || c.cat || '')}
                      </span>
                      {/* Price badge */}
                      <span style={{
                        position: 'absolute', bottom: '10px', right: '10px',
                        background: price === 0 ? '#10b981' : '#00B5AD',
                        color: '#fff', fontSize: '11px', fontWeight: 700,
                        padding: '3px 10px', borderRadius: '4px',
                      }}>
                        {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                      </span>
                    </div>
                    <div style={{ padding: '10px 14px 14px', height: '54px', overflow: 'hidden' }}>
                      <p style={{
                        fontWeight: 600, fontSize: '13px', color: '#e5e5e5',
                        lineHeight: 1.45, margin: 0,
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
          </CarouselRow>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ROW 2 — TRENDING ARTICLES
          Refinery29-inspired editorial grid
      ═══════════════════════════════════════ */}
      <section className="mo-section-gap" style={{ padding: '0 0 3rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <RowHeader title="Трэндинг нийтлэлүүд" href={`/${locale}/articles`} badge="TRENDING" />

          {/* Featured editorial layout: 65% big card + 35% thumbnail list */}
          <div className="mo-editorial-grid" style={{ alignItems: 'stretch' }}>

            {/* LEFT — 16:9 image + fixed 80px text box below */}
            <Link href={featuredArticle?.slug ? `/${locale}/articles/${featuredArticle.slug}` : '#'}
              style={{ textDecoration: 'none', display: 'block' }}>
              <div className="netflix-card" style={{ borderRadius: '12px', background: '#1a1a1a' }}>
                {/* Image — pure 16:9, overflow hidden here only (not on card) so text box never gets clipped */}
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderRadius: '12px 12px 0 0', background: '#111' }}>
                  {featuredArticle?.cover_image_url
                    ? <img src={String(featuredArticle.cover_image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a1a2e,#2d1b4e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>✨</div>
                  }
                </div>
                {/* Text box — min-height not fixed, grows naturally on mobile */}
                <div style={{ minHeight: '72px', padding: '10px 14px', background: '#1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px' }}>
                  <span style={{
                    display: 'inline-block', alignSelf: 'flex-start',
                    border: '1px solid rgba(0,181,173,0.5)',
                    color: '#00B5AD', padding: '2px 8px', borderRadius: '4px',
                    fontSize: '9px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase',
                  }}>
                    {String(featuredArticle?.category || 'Lifestyle')}
                  </span>
                  <p style={{ fontWeight: 800, fontSize: '15px', color: '#e5e5e5', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {locale === 'mn' ? String(featuredArticle?.title_mn || '') : String(featuredArticle?.title_en || featuredArticle?.title_mn || '')}
                  </p>
                </div>
              </div>
            </Link>

            {/* RIGHT — each item gets flex:1 (equal 1/5 height), content centered → divider sits midway */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {sideArticles.map((a: Record<string, unknown>, i: number) => {
                const title = locale === 'mn'
                  ? String(a.title_mn || a.title || '')
                  : String(a.title_en || a.title_mn || a.title || '');
                const href = a.slug ? `/${locale}/articles/${a.slug}` : '#';
                const thumbGrads = ['linear-gradient(135deg,#1a2e1a,#2e4a1a)', 'linear-gradient(135deg,#2e1a1a,#4a2e1a)', 'linear-gradient(135deg,#1a1a2e,#1a2e4a)'];
                return (
                  <Link key={String(a.id || i)} href={href}
                    style={{
                      textDecoration: 'none', flex: 1, display: 'flex', alignItems: 'center',
                      paddingTop: i === 0 ? 0 : '10px',
                      paddingBottom: i === sideArticles.length - 1 ? 0 : '10px',
                      borderBottom: i < sideArticles.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    }}>
                    <div className="netflix-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                      {/* Square thumbnail */}
                      <div style={{
                        width: '72px', height: '72px', flexShrink: 0,
                        borderRadius: '8px', overflow: 'hidden',
                        background: thumbGrads[i % thumbGrads.length],
                      }}>
                        {a.cover_image_url
                          ? <img src={String(a.cover_image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : null}
                      </div>
                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: 'inline-block', marginBottom: '4px',
                          border: '1px solid rgba(0,181,173,0.35)',
                          color: '#00B5AD', padding: '1px 6px', borderRadius: '3px',
                          fontSize: '8px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                        }}>
                          {String(a.category || 'Lifestyle')}
                        </span>
                        <p style={{
                          fontWeight: 700, fontSize: '12px', color: '#e0e0e0',
                          lineHeight: 1.35, margin: '0 0 3px',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {title}
                        </p>
                        {a.published_at && (
                          <span style={{ fontSize: '10px', color: '#555' }}>
                            {new Date(String(a.published_at)).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* More articles — horizontal scroll row */}
          <div style={{ marginTop: '2rem' }}>
          <CarouselRow count={moreArticles.length}>
            {moreArticles.map((a: Record<string, unknown>, i: number) => {
              const title = locale === 'mn'
                ? String(a.title_mn || a.title || '')
                : String(a.title_en || a.title_mn || a.title || '');
              const href = a.slug ? `/${locale}/articles/${a.slug}` : '#';
              return (
                <Link key={String(a.id || i)} href={href} className="mo-snap-card" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div className="netflix-card" style={{
                    width: '220px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a',
                  }}>
                    <div style={{
                      height: '130px',
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {a.cover_image_url
                        ? <img src={String(a.cover_image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '2.2rem' }}>{String(a.emoji || '✨')}</span>
                      }
                      <span style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'rgba(0,181,173,0.85)', color: '#fff',
                        fontSize: '9px', fontWeight: 800,
                        padding: '2px 8px', borderRadius: '3px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {String(a.category || a.cat || 'Lifestyle')}
                      </span>
                    </div>
                    <div style={{ padding: '10px 12px 12px', height: '50px', overflow: 'hidden' }}>
                      <p style={{
                        fontWeight: 600, fontSize: '12px', color: '#e0e0e0',
                        lineHeight: 1.45, margin: 0,
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
          </CarouselRow>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ROW 3 — КИНО & ВИДЕО
          Disney+-style landscape row
      ═══════════════════════════════════════ */}
      <section className="mo-section-gap" style={{ padding: '0 0 3rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <RowHeader title="Кино & Видео" href={`/${locale}/videos`} badge="УДАХГҮЙ" />
          <CarouselRow count={PLACEHOLDER_VIDEOS.length}>
            {PLACEHOLDER_VIDEOS.map((v, i) => (
              <Link key={i} href={`/${locale}/videos`} className="mo-snap-card" style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div className="netflix-card" style={{
                  width: '280px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a',
                }}>
                  <div style={{
                    width: '280px', height: '157px',
                    background: v.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: '3rem' }}>{v.emoji}</span>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)',
                    }} />
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(255,217,61,0.2)', border: '1px solid rgba(255,217,61,0.4)',
                      color: '#FFD93D', fontSize: '9px', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px',
                    }}>
                      УДАХГҮЙ
                    </span>
                    <p style={{
                      position: 'absolute', bottom: '10px', left: '12px', right: '12px',
                      fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {v.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </CarouselRow>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ROW 4 — ДЭЛГҮҮР / SHOP
          Product cards
      ═══════════════════════════════════════ */}
      <section className="mo-section-gap" style={{ padding: '0 0 5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <RowHeader title="Дэлгүүр" href={`/${locale}/shop`} badge="ШИНЭ" />
          <CarouselRow count={PLACEHOLDER_SHOP.length}>
            {PLACEHOLDER_SHOP.map((p, i) => (
              <Link key={i} href={`/${locale}/shop`} className="mo-snap-card" style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div className="netflix-card" style={{
                  width: '200px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a',
                }}>
                  <div style={{
                    height: '200px',
                    background: p.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3.5rem', position: 'relative',
                  }}>
                    {p.emoji}
                    <span style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(255,217,61,0.15)', border: '1px solid rgba(255,217,61,0.3)',
                      color: '#FFD93D', fontSize: '9px', fontWeight: 800,
                      padding: '2px 7px', borderRadius: '4px',
                    }}>
                      ШИНЭ
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px 14px' }}>
                    <p style={{ fontWeight: 600, fontSize: '12px', color: '#e0e0e0', margin: '0 0 6px' }}>
                      {p.title}
                    </p>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#00B5AD' }}>
                      {p.price.toLocaleString()}₮
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </CarouselRow>
        </div>
      </section>

      <style>{`
        /* ── Right-fade scroll hint — mobile carousel rows ── */
        .mo-row-wrap { position: relative; overflow: hidden; }
        .mo-row-wrap::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 56px;
          background: linear-gradient(to right, transparent, #141414);
          pointer-events: none;
          z-index: 2;
        }
        @media (min-width: 768px) {
          .mo-row-wrap::after { display: none; }
        }
        /* ── Home page course cards — 45vw on mobile ── */
        @media (max-width: 767px) {
          .mo-home-course-card { width: calc(45vw) !important; min-width: 140px !important; }
          .mo-home-course-thumb { width: 100% !important; height: auto !important; aspect-ratio: 16/9; }
        }
        /* ── Carousel snap + pagination dots ── */
        .mo-snap-card { scroll-snap-align: start; }
        .mo-carousel-dots { display: none; justify-content: center; gap: 5px; margin-top: 10px; }
        @media (max-width: 767px) { .mo-carousel-dots { display: flex; align-items: center; } }
        .netflix-card { transition: transform 0.18s; }
        .netflix-card:hover { transform: translateY(-3px); }
        .mo-editorial-grid {
          display: grid;
          grid-template-columns: 65% 35%;
          gap: 1.5rem;
        }
        @media (max-width: 767px) {
          .mo-editorial-grid { grid-template-columns: 1fr; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}

/* ── Shared row header component ── */
function RowHeader({ title, href, badge }: { title: string; href: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', marginBottom: '1rem' }}>
      <div>
        {badge && (
          <span style={{
            display: 'inline-block', marginBottom: '5px',
            fontSize: '9px', fontWeight: 800, color: '#00B5AD',
            border: '1px solid rgba(0,181,173,0.5)',
            padding: '2px 8px', borderRadius: '3px',
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            {badge}
          </span>
        )}
        <h2 style={{
          fontSize: '1.15rem', fontWeight: 700, color: '#e5e5e5',
          margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2,
        }}>
          {title}
        </h2>
      </div>
      <Link href={href} style={{
        color: 'rgba(0,181,173,0.8)', textDecoration: 'none',
        fontWeight: 600, fontSize: '11px', letterSpacing: '0.5px',
        textTransform: 'uppercase', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '4px',
        whiteSpace: 'nowrap',
      }}>
        Бүгдийг харах <span style={{ fontSize: '14px' }}>›</span>
      </Link>
    </div>
  );
}

/* ── Placeholder data ── */
const PLACEHOLDER_COURSES: Record<string, unknown>[] = [
  { id: 'p1', title_mn: 'Гэрийн хоол хийх урлаг', price: 29900, emoji: '🍳', category: 'Хоол' },
  { id: 'p2', title_mn: 'Арьс нүүрний арчилгаа', price: 39900, emoji: '💆', category: 'Гоо сайхан' },
  { id: 'p3', title_mn: 'Дотоод амар тайван — Meditation', price: 24900, emoji: '🧘', category: 'Эрүүл мэнд' },
  { id: 'p4', title_mn: 'Бизнес эхлүүлэх 101', price: 49900, emoji: '💼', category: 'Бизнес' },
  { id: 'p5', title_mn: 'Гэрийн чимэглэл', price: 19900, emoji: '🏠', category: 'Дизайн' },
  { id: 'p6', title_mn: 'Хувийн санхүүгийн удирдлага', price: 34900, emoji: '💰', category: 'Бизнес' },
  { id: 'p7', title_mn: 'Гэр бүлийн эрүүл харилцаа', price: 29900, emoji: '💝', category: 'Гэр бүл' },
  { id: 'p8', title_mn: 'Зорилго тавих — Goal Setting', price: 0, emoji: '🎯', category: 'Хувийн хөгжил' },
];

const PLACEHOLDER_VIDEOS = [
  { title: 'Монгол эмэгтэйчүүдийн амжилтын түүх', emoji: '🎬', gradient: 'linear-gradient(135deg,#1a0d0d,#3d1515)' },
  { title: 'Хоол хийх мастер класс', emoji: '🍜', gradient: 'linear-gradient(135deg,#0d1a0d,#153d15)' },
  { title: 'Фитнесс & Эрүүл мэнд', emoji: '💪', gradient: 'linear-gradient(135deg,#0d0d1a,#15153d)' },
  { title: 'Бизнес ярилцлага', emoji: '🎙️', gradient: 'linear-gradient(135deg,#1a1a0d,#3d3d15)' },
  { title: 'Гоо сайхны хичээл', emoji: '💄', gradient: 'linear-gradient(135deg,#1a0d1a,#3d153d)' },
  { title: 'Гэр бүлийн баримтат', emoji: '🏡', gradient: 'linear-gradient(135deg,#0d1a1a,#153d3d)' },
];

const PLACEHOLDER_SHOP = [
  { title: 'Органик арьсны тос', emoji: '🧴', price: 45000, gradient: 'linear-gradient(135deg,#1a1a2e,#2d1b4e)' },
  { title: 'Эрүүл хоолны ном', emoji: '📚', price: 28000, gradient: 'linear-gradient(135deg,#1a2e1a,#2e4a1a)' },
  { title: 'Йога матрас', emoji: '🧘', price: 89000, gradient: 'linear-gradient(135deg,#2e1a1a,#4a2e1a)' },
  { title: 'Мэдрэмтгий тунамал', emoji: '✨', price: 35000, gradient: 'linear-gradient(135deg,#1a2a2e,#1a3d4a)' },
  { title: 'Гоо сайхны багц', emoji: '💄', price: 120000, gradient: 'linear-gradient(135deg,#2e1a2e,#4a1a4a)' },
  { title: 'Цаасан тэмдэглэлийн дэвтэр', emoji: '📓', price: 15000, gradient: 'linear-gradient(135deg,#2a1a0e,#4a3010)' },
];
