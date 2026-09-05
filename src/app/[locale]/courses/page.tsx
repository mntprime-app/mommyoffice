export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import UniversalHero from '@/components/shared/UniversalHero';

const CATEGORIES = ['Бүх ангилал', 'Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];

const CAT_GRADIENTS: Record<string, string> = {
  'Хоол':           'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'Гоо сайхан':     'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'Эрүүл мэнд':     'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'Бизнес':         'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'Гэр бүл':        'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'Хувийн хөгжил':  'linear-gradient(135deg,#1a1a0d,#3d3d15)',
  'Дизайн':         'linear-gradient(135deg,#1a0d1a,#3d153d)',
  'default':        'linear-gradient(135deg,#0d2137,#1a4a6b)',
};

async function getCourses(category?: string) {
  try {
    const supabase = await createAdminClient();
    let query = supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, description_mn, description_en, price, original_price, cover_image_url, slug, category, instructor_id, is_bestseller, rating, rating_count, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (category && category !== 'Бүх ангилал') {
      query = query.eq('category', category);
    }
    const { data } = await query;
    return data || [];
  } catch { return []; }
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  const t = await getTranslations('courses');

  const courses = await getCourses(category);
  const displayCourses = courses as Record<string, unknown>[];

  const featured = displayCourses[0] as Record<string, unknown> | undefined;
  const featuredTitle         = featured ? (locale === 'mn' ? String(featured.title_mn || '') : String(featured.title_en || featured.title_mn || '')) : '';
  const featuredDesc          = featured ? (locale === 'mn' ? String(featured.description_mn || '') : String(featured.description_en || featured.description_mn || '')) : '';
  const featuredPrice         = Number(featured?.price) || 0;
  const featuredOriginalPrice = Number(featured?.original_price) || 0;
  const featuredRating        = Number(featured?.rating) || 0;
  const featuredRatingCount   = Number(featured?.rating_count) || 0;
  const featuredSlug          = featured?.slug ? `/${locale}/courses/${featured.slug}` : '#';
  const featuredGrad          = CAT_GRADIENTS[String(featured?.category || '')] || CAT_GRADIENTS.default;

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── HERO — UniversalHero standard ── */}
      <UniversalHero
        badgeText={`🎓 ${String(featured?.category || 'Сургалт')}`}
        title={featuredTitle || t('hero_title')}
        description={featuredDesc}
        coverImage={featured?.cover_image_url ? String(featured.cover_image_url) : undefined}
        fallbackGradient={featuredGrad}
        primaryActionText="Элсэх"
        primaryHref={featuredSlug}
        secondaryActionText="Дэлгэрэнгүй"
        secondaryHref={featuredSlug}
        cornerBadge="🆕 Шинээр нэмэгдсэн"
      />

      {/* ── CATEGORY FILTER PILLS ── */}
      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        padding: '1.5rem 2rem',
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        borderBottom: '1px solid #2a2a2a',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = category === cat || (!category && cat === 'Бүх ангилал');
          return (
            <Link
              key={cat}
              href={cat === 'Бүх ангилал' ? `/${locale}/courses` : `/${locale}/courses?category=${encodeURIComponent(cat)}`}
              style={{
                padding: '7px 16px', borderRadius: '20px',
                fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.15s',
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

      {/* ── COURSE GRID ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="mo-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {displayCourses.map((course: Record<string, unknown>, i: number) => {
            const title = locale === 'mn'
              ? String(course.title_mn || '')
              : String(course.title_en || course.title_mn || '');
            const desc = locale === 'mn'
              ? String(course.desc_mn || course.description_mn || '')
              : String(course.desc_en || course.description_en || course.desc_mn || '');
            const price         = Number(course.price) || 0;
            const originalPrice = Number(course.original_price) || 0;
            const isBestseller  = Boolean(course.is_bestseller);
            const rating        = Number(course.rating) || 0;
            const ratingCount   = Number(course.rating_count) || 0;
            const discountPct   = originalPrice > price && originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
            const slug          = course.slug ? `/${locale}/courses/${course.slug}` : '#';
            const grad          = CAT_GRADIENTS[String(course.category || '')] || CAT_GRADIENTS.default;

            return (
              <Link key={String(course.id || i)} href={slug} style={{ textDecoration: 'none', display: 'flex' }}>
                <article className="netflix-card" style={{
                  borderRadius: '10px', overflow: 'hidden',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  width: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    height: '175px', background: grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3.5rem', position: 'relative', overflow: 'hidden',
                  }}>
                    {course.cover_image_url ? (
                      <img src={String(course.cover_image_url)} alt={title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{String(course.emoji || '📚')}</span>
                    )}
                    {/* Category badge */}
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                      color: '#fff', fontSize: '10px', fontWeight: 700,
                      padding: '3px 9px', borderRadius: '4px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {String(course.category || '')}
                    </span>
                    {/* Bestseller badge */}
                    {isBestseller && (
                      <span style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: '#f59e0b', color: '#000',
                        fontSize: '9px', fontWeight: 800,
                        padding: '3px 7px', borderRadius: '3px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>ШИЛДЭГ</span>
                    )}
                    {/* Discount badge */}
                    {discountPct > 0 && (
                      <span style={{
                        position: 'absolute', bottom: '10px', left: '10px',
                        background: '#e53e3e', color: '#fff',
                        fontSize: '10px', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '3px',
                      }}>{discountPct}% OFF</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Title — fixed 2-line height so rating row is always at same position */}
                    <h3 style={{
                      fontWeight: 700, fontSize: '14px', lineHeight: 1.4,
                      marginBottom: '0.35rem', color: '#e5e5e5',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      minHeight: '2.8em',
                    }}>
                      {title}
                    </h3>

                    {/* Rating row — always on same line, no student count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', minHeight: '18px' }}>
                      {rating > 0 && (
                        <>
                          <span style={{ color: '#f59e0b', fontSize: '13px' }}>★</span>
                          <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>{rating.toFixed(1)}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>({ratingCount.toLocaleString()} үнэлгээ)</span>
                        </>
                      )}
                    </div>

                    {/* Price row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: price === 0 ? '#10b981' : '#fff' }}>
                        {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                      </span>
                      {originalPrice > 0 && originalPrice > price && (
                        <span style={{ fontSize: '12px', color: '#555', textDecoration: 'line-through' }}>
                          {originalPrice.toLocaleString()}₮
                        </span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        background: '#00B5AD', color: '#fff',
                        padding: '5px 14px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 700, flexShrink: 0,
                      }}>
                        {t('enroll')}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`
        /* 2-col grid on mobile — overrides auto-fill minmax which gives 1-col at 375px */
        @media (max-width: 767px) {
          .mo-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
        /* Tighten card text on small cards */
        @media (max-width: 767px) {
          .mo-card-grid article h3 { font-size: 12px !important; }
          .mo-card-grid article div[style*="175px"] { height: 120px !important; }
        }
        .netflix-card { transition: transform 0.18s; }
        .netflix-card:hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}
