import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';

async function getInstructor(slug: string) {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('mo_instructors')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

async function getInstructorCourses(instructorId: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, slug, category, price, original_price, rating, rating_count, is_bestseller, cover_image_url, lecture_count, duration_minutes')
      .eq('is_published', true)
      .eq('mo_instructor_id', instructorId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const instructor = await getInstructor(slug);
  if (!instructor) return { title: 'Багш | Mommyoffice' };
  const name = locale === 'mn' ? instructor.name_mn : (instructor.name_en || instructor.name_mn);
  return {
    title: `${name} | Mommyoffice Багш`,
    description: instructor.bio_mn || '',
  };
}

const CAT_GRADIENTS: Record<string, string> = {
  'Хоол':          'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'Гоо сайхан':    'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'Эрүүл мэнд':   'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'Бизнес':        'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'Гэр бүл':       'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'Хувийн хөгжил': 'linear-gradient(135deg,#1a1a0d,#3d3d15)',
  'Дизайн':        'linear-gradient(135deg,#1a0d1a,#3d153d)',
  'default':       'linear-gradient(135deg,#0d2137,#1a4a6b)',
};

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const instructor = await getInstructor(slug);
  if (!instructor) notFound();

  const courses = await getInstructorCourses(instructor.id);

  const name  = locale === 'mn' ? instructor.name_mn : (instructor.name_en || instructor.name_mn);
  const title = instructor.title_mn || '';
  const bio   = locale === 'mn'
    ? (instructor.bio_mn || '')
    : (instructor.bio_en || instructor.bio_mn || '');
  const photo = instructor.photo_url || '';

  // Aggregate stats across all courses (no student count — permanent rule)
  const totalReviews = courses.reduce((sum, c) => sum + (Number(c.rating_count) || 0), 0);
  const ratedCourses = courses.filter(c => Number(c.rating) > 0);
  const avgRating = ratedCourses.length > 0
    ? ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length
    : 0;

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── HERO HEADER ── */}
      <div style={{ background: 'linear-gradient(180deg,#111 0%,#141414 100%)', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 4%' }}>

          <Link href={`/${locale}/courses`} style={{
            color: '#00B5AD', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'inline-block', marginBottom: '1.5rem',
          }}>← Сургалтууд руу буцах</Link>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {photo ? (
                <img src={photo} alt={name}
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2a2a2a', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg,#00B5AD,#0d3720)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', border: '3px solid #2a2a2a' }}>
                  👩‍🏫
                </div>
              )}
            </div>

            {/* Name + headline + stats + social */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#00B5AD', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                БАГШ
              </p>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                {name}
              </h1>
              {title && (
                <p style={{ fontSize: '15px', color: '#00B5AD', margin: '0 0 1.25rem', fontWeight: 500 }}>{title}</p>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '1.25rem' }}>
                {avgRating > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>{avgRating.toFixed(1)} ⭐</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#666', marginTop: '2px' }}>Багшийн үнэлгээ</p>
                  </div>
                )}
                {totalReviews > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#e5e5e5' }}>{totalReviews.toLocaleString()}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#666', marginTop: '2px' }}>Нийт сэтгэгдэл</p>
                  </div>
                )}
                {courses.length > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#e5e5e5' }}>{courses.length}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#666', marginTop: '2px' }}>Нийт сургалт</p>
                  </div>
                )}
              </div>

              {/* Social links */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {instructor.linkedin_url && (
                  <a href={String(instructor.linkedin_url)} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#0077b5', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    in LinkedIn
                  </a>
                )}
                {instructor.youtube_url && (
                  <a href={String(instructor.youtube_url)} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#ff0000', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ▶ YouTube
                  </a>
                )}
                {instructor.facebook_url && (
                  <a href={String(instructor.facebook_url)} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#1877f2', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    f Facebook
                  </a>
                )}
                {instructor.website_url && (
                  <a href={String(instructor.website_url)} target="_blank" rel="noopener noreferrer"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#e5e5e5', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🔗 Вэбсайт
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 4%' }}>

        {/* About Me */}
        {bio && (
          <section style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.75rem 2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1rem' }}>Миний тухай</h2>
            <p style={{ fontSize: '15px', color: '#999', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{bio}</p>
          </section>
        )}

        {/* Courses grid */}
        {courses.length > 0 && (
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1.25rem' }}>
              Миний сургалтууд ({courses.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {courses.map((c) => {
                const cTitle   = locale === 'mn' ? c.title_mn : (c.title_en || c.title_mn);
                const cPrice   = Number(c.price) || 0;
                const cOrig    = Number(c.original_price) || 0;
                const cRating  = Number(c.rating) || 0;
                const cDisc    = cOrig > cPrice && cOrig > 0 ? Math.round((1 - cPrice / cOrig) * 100) : 0;
                const cGrad    = CAT_GRADIENTS[String(c.category || '')] || CAT_GRADIENTS.default;
                const cMins    = Number(c.duration_minutes) || 0;
                const cDur     = cMins > 0 ? `${Math.floor(cMins / 60)}ц ${cMins % 60 > 0 ? `${cMins % 60}м` : ''}`.trim() : '';
                const cLectures = Number(c.lecture_count) || 0;
                return (
                  <Link key={c.id} href={c.slug ? `/${locale}/courses/${c.slug}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="mo-course-card" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Thumbnail */}
                      <div style={{
                        height: '150px',
                        background: c.cover_image_url ? `url(${c.cover_image_url}) center/cover` : cGrad,
                        position: 'relative',
                      }}>
                        {c.is_bestseller && (
                          <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>ШИЛДЭГ</span>
                        )}
                        {cDisc > 0 && (
                          <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#e53e3e', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>{cDisc}% OFF</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 6px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {cTitle}
                        </p>

                        {/* Meta */}
                        {(cLectures > 0 || cDur) && (
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>
                            {[cLectures > 0 && `${cLectures} хичээл`, cDur].filter(Boolean).join(' · ')}
                          </p>
                        )}

                        {/* Rating */}
                        {cRating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            {[1,2,3,4,5].map(s => (
                              <span key={s} style={{ color: s <= Math.round(cRating) ? '#f59e0b' : '#333', fontSize: '12px' }}>★</span>
                            ))}
                            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, marginLeft: '2px' }}>{cRating.toFixed(1)}</span>
                          </div>
                        )}

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: cPrice === 0 ? '#10b981' : '#fff' }}>
                            {cPrice === 0 ? 'Үнэгүй' : `${cPrice.toLocaleString()}₮`}
                          </span>
                          {cOrig > cPrice && cOrig > 0 && (
                            <span style={{ fontSize: '12px', color: '#444', textDecoration: 'line-through' }}>{cOrig.toLocaleString()}₮</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {courses.length === 0 && (
          <p style={{ color: '#555', fontSize: '15px', textAlign: 'center', padding: '3rem 0' }}>
            Одоогоор нийтлэгдсэн сургалт байхгүй байна.
          </p>
        )}

      </div>
    </div>
  );
}
