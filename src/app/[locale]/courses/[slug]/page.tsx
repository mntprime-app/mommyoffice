import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';

async function getCourse(slug: string) {
  try {
    const supabase = await createAdminClient();
    // Fetch course first
    const { data: course, error } = await supabase
      .from('mo_courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !course) return null;
    // Fetch instructor separately to avoid FK join issues
    let instructor = null;
    if (course.mo_instructor_id) {
      const { data: inst } = await supabase
        .from('mo_instructors')
        .select('*')
        .eq('id', course.mo_instructor_id)
        .single();
      instructor = inst;
    }
    return { ...course, instructor };
  } catch { return null; }
}

async function getSimilarCourses(category: string, excludeId: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, slug, category, price, original_price, rating, rating_count, student_count, is_bestseller, cover_image_url')
      .eq('is_published', true)
      .eq('category', category)
      .neq('id', excludeId)
      .limit(4);
    return data || [];
  } catch { return []; }
}

async function getReviews(courseId: string) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_reviews')
      .select('id, rating, review_text, reviewer_name, created_at')
      .eq('course_id', courseId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  } catch { return []; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: 'Сургалт | Mommyoffice' };
  const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  return {
    title: `${title} | Mommyoffice`,
    description: locale === 'mn' ? course.description_mn : (course.description_en || course.description_mn),
  };
}

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

function StarRow({ rating, count }: { rating: number; count: number }) {
  const stars = Math.round(rating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= stars ? '#f59e0b' : '#333', fontSize: '16px' }}>★</span>
      ))}
      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '15px' }}>{rating.toFixed(1)}</span>
      <span style={{ color: '#666', fontSize: '13px' }}>({count.toLocaleString()} үнэлгээ)</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: '12px', padding: '1.75rem 2rem', marginBottom: '1.5rem',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5', marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const [reviews, similarCourses] = await Promise.all([
    getReviews(course.id),
    getSimilarCourses(String(course.category || ''), course.id),
  ]);

  const title       = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  const description = locale === 'mn' ? course.description_mn : (course.description_en || course.description_mn);
  const price         = Number(course.price) || 0;
  const originalPrice = Number(course.original_price) || 0;
  const rating        = Number(course.rating) || 0;
  const ratingCount   = Number(course.rating_count) || 0;
  const studentCount  = Number(course.student_count) || 0;
  const discountPct   = originalPrice > price && originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  const grad          = CAT_GRADIENTS[String(course.category || '')] || CAT_GRADIENTS.default;
  const isBestseller  = Boolean(course.is_bestseller);

  // What you'll learn — newline-separated text
  const learnItems = (locale === 'mn' ? course.what_you_learn_mn : (course.what_you_learn_en || course.what_you_learn_mn))
    ?.split('\n').filter(Boolean) || [];

  // Requirements
  const reqItems = (locale === 'mn' ? course.requirements_mn : (course.requirements_en || course.requirements_mn))
    ?.split('\n').filter(Boolean) || [];

  // Duration
  const mins = Number(course.duration_minutes) || 0;
  const durationText = mins > 0
    ? `${Math.floor(mins / 60)} цаг ${mins % 60 > 0 ? `${mins % 60} мин` : ''}`.trim()
    : '';
  const lectureCount = Number(course.lecture_count) || 0;
  const level = course.level_mn || '';

  // Instructor
  const instructor = course.instructor as Record<string, unknown> | null;
  const instructorName = instructor
    ? String(locale === 'mn' ? instructor.name_mn : (instructor.name_en || instructor.name_mn) || '')
    : '';
  const instructorTitle = instructor ? String(instructor.title_mn || '') : '';
  const instructorBio = instructor
    ? String(locale === 'mn' ? instructor.bio_mn : (instructor.bio_en || instructor.bio_mn) || '')
    : '';
  const instructorPhoto = instructor ? String(instructor.photo_url || '') : '';

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{ background: grad, position: 'relative', overflow: 'hidden' }}>
        {course.cover_image_url && (
          <img src={String(course.cover_image_url)} alt={title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.4) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 4% 2.5rem' }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)',
                color: '#00B5AD', padding: '3px 10px', borderRadius: '4px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
              }}>{course.category}</span>
              {isBestseller && (
                <span style={{
                  background: '#f59e0b', color: '#000',
                  padding: '3px 10px', borderRadius: '4px',
                  fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                }}>ШИЛДЭГ</span>
              )}
              {level && (
                <span style={{
                  background: 'rgba(255,255,255,0.08)', color: '#ccc',
                  padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '10px', fontWeight: 600,
                }}>{level}</span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', fontWeight: 800,
              color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem', letterSpacing: '-0.5px',
            }}>{title}</h1>

            {/* Description */}
            {description && (
              <p style={{ fontSize: '15px', color: '#b0bcc8', lineHeight: 1.65, marginBottom: '1rem', maxWidth: '560px' }}>
                {description}
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '1rem', fontSize: '13px', color: '#888' }}>
              {rating > 0 && <StarRow rating={rating} count={ratingCount} />}
              {studentCount > 0 && <span>👥 {studentCount.toLocaleString()} оюутан</span>}
              {durationText && <span>🕐 {durationText}</span>}
              {lectureCount > 0 && <span>📖 {lectureCount} хичээл</span>}
              {instructorName && <span>👩‍🏫 {instructorName}</span>}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: price === 0 ? '#10b981' : '#fff' }}>
                {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
              </span>
              {originalPrice > price && originalPrice > 0 && (
                <>
                  <span style={{ fontSize: '15px', color: '#555', textDecoration: 'line-through' }}>
                    {originalPrice.toLocaleString()}₮
                  </span>
                  <span style={{ fontSize: '11px', background: '#e53e3e', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {price === 0 ? (
                <Link href={`/${locale}/checkout/${slug}`} style={{
                  background: '#00B5AD', color: '#fff',
                  padding: '13px 32px', borderRadius: '8px',
                  fontWeight: 700, textDecoration: 'none', fontSize: '15px',
                  boxShadow: '0 4px 24px rgba(0,181,173,0.35)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}>
                  Үнэгүй авах
                </Link>
              ) : (
                <>
                  <Link href={`/${locale}/checkout/${slug}`} style={{
                    background: '#00B5AD', color: '#fff',
                    padding: '13px 28px', borderRadius: '8px',
                    fontWeight: 700, textDecoration: 'none', fontSize: '15px',
                    boxShadow: '0 4px 24px rgba(0,181,173,0.35)',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                  }}>
                    Худалдан авах
                  </Link>
                  <Link href={`/${locale}/cart?add=${slug}`} style={{
                    background: 'rgba(255,255,255,0.08)', color: '#e5e5e5',
                    padding: '13px 24px', borderRadius: '8px',
                    fontWeight: 600, textDecoration: 'none', fontSize: '15px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                  }}>
                    🛒 Сагсанд нэмэх
                  </Link>
                </>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#555', marginTop: '10px' }}>
              Бүртгэлгүйгээр худалдан авах боломжтой
            </p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 4%' }}>

        {/* 1. What you'll learn */}
        {learnItems.length > 0 && (
          <SectionCard title="Юу сурах вэ?">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.65rem' }}>
              {learnItems.map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#00B5AD', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 2. Course outline */}
        {lectureCount > 0 && (
          <SectionCard title="Хичээлийн агуулга">
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {lectureCount > 0 && (
                <span style={{ fontSize: '13px', color: '#888' }}>📖 {lectureCount} хичээл</span>
              )}
              {durationText && (
                <span style={{ fontSize: '13px', color: '#888' }}>🕐 Нийт {durationText}</span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
              Хичээлийн дэлгэрэнгүй агуулга удахгүй нэмэгдэнэ.
            </p>
          </SectionCard>
        )}

        {/* 3. Requirements */}
        {reqItems.length > 0 && (
          <SectionCard title="Шаардлага">
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {reqItems.map((item: string, i: number) => (
                <li key={i} style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.6, marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* 4. Instructor */}
        {instructor && (
          <SectionCard title="Багшийн тухай">
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              {instructorPhoto ? (
                <img src={instructorPhoto} alt={instructorName}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #2a2a2a' }} />
              ) : (
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#00B5AD,#0d3720)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                }}>👩‍🏫</div>
              )}
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 2px' }}>{instructorName}</p>
                {instructorTitle && <p style={{ fontSize: '13px', color: '#00B5AD', margin: '0 0 8px' }}>{instructorTitle}</p>}
                {instructorBio && <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.65, margin: 0 }}>{instructorBio}</p>}
              </div>
            </div>
          </SectionCard>
        )}

        {/* 5. Reviews */}
        {(rating > 0 || reviews.length > 0) && (
          <SectionCard title="Үнэлгээ & Сэтгэгдэл">
            {rating > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <StarRow rating={rating} count={ratingCount} />
              </div>
            )}
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{
                    background: '#222', borderRadius: '8px', padding: '1rem 1.25rem',
                    border: '1px solid #2a2a2a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#00B5AD', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {String(r.reviewer_name || 'О').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>
                          {r.reviewer_name || 'Оюутан'}
                        </p>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#333', fontSize: '11px' }}>★</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>
                        {new Date(r.created_at).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US', { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {r.review_text && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#aaa', lineHeight: 1.6 }}>{r.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Сэтгэгдэл байхгүй байна.</p>
            )}
          </SectionCard>
        )}

        {/* 6. Similar courses */}
        {similarCourses.length > 0 && (
          <SectionCard title={`Төстэй сургалтууд — ${course.category}`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {similarCourses.map((sc) => {
                const scTitle = locale === 'mn' ? sc.title_mn : (sc.title_en || sc.title_mn);
                const scPrice = Number(sc.price) || 0;
                const scOrig  = Number(sc.original_price) || 0;
                const scRating = Number(sc.rating) || 0;
                const scDisc  = scOrig > scPrice && scOrig > 0 ? Math.round((1 - scPrice / scOrig) * 100) : 0;
                const scGrad  = CAT_GRADIENTS[String(sc.category || '')] || CAT_GRADIENTS.default;
                return (
                  <Link key={sc.id} href={sc.slug ? `/${locale}/courses/${sc.slug}` : '#'}
                    style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px',
                      overflow: 'hidden', transition: 'border-color 0.2s',
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        height: '110px', background: sc.cover_image_url ? `url(${sc.cover_image_url}) center/cover` : scGrad,
                        position: 'relative',
                      }}>
                        {sc.is_bestseller && (
                          <span style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: '#f59e0b', color: '#000', fontSize: '9px',
                            fontWeight: 800, padding: '2px 6px', borderRadius: '3px',
                          }}>ШИЛДЭГ</span>
                        )}
                        {scDisc > 0 && (
                          <span style={{
                            position: 'absolute', bottom: '8px', left: '8px',
                            background: '#e53e3e', color: '#fff', fontSize: '9px',
                            fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
                          }}>{scDisc}% OFF</span>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{
                          fontSize: '13px', fontWeight: 600, color: '#e5e5e5',
                          margin: '0 0 4px', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{scTitle}</p>
                        {scRating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                            <span style={{ color: '#f59e0b', fontSize: '11px' }}>★</span>
                            <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700 }}>{scRating.toFixed(1)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: scPrice === 0 ? '#10b981' : '#fff' }}>
                            {scPrice === 0 ? 'Үнэгүй' : `${scPrice.toLocaleString()}₮`}
                          </span>
                          {scOrig > scPrice && scOrig > 0 && (
                            <span style={{ fontSize: '11px', color: '#555', textDecoration: 'line-through' }}>
                              {scOrig.toLocaleString()}₮
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Back link */}
        <div style={{ paddingTop: '1rem' }}>
          <Link href={`/${locale}/courses`} style={{ color: '#00B5AD', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            ← Бүх сургалтууд
          </Link>
        </div>
      </div>
    </div>
  );
}
