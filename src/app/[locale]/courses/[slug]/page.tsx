import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ShareButton } from '@/components/ui/ShareButton';
import { CourseOutline } from '@/components/ui/CourseOutline';
import { HeroMedia } from '@/components/ui/HeroMedia';
import { AddToCartButton } from '@/components/ui/AddToCartButton';
import { InstructorBio } from '@/components/ui/InstructorBio';

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
      .select('id, title_mn, title_en, slug, category, price, original_price, rating, rating_count, is_bestseller, cover_image_url')
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

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return 'Өнөөдөр';
  if (diffDays === 1) return '1 өдрийн өмнө';
  if (diffDays < 7)  return `${diffDays} өдрийн өмнө`;
  if (diffDays < 14) return '1 долоо хоногийн өмнө';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} долоо хоногийн өмнө`;
  if (diffDays < 60) return '1 сарын өмнө';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} сарын өмнө`;
  if (diffDays < 730) return '1 жилийн өмнө';
  return `${Math.floor(diffDays / 365)} жилийн өмнө`;
}

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
    <section className="mo-section-card" style={{
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

  // New fields (requires SQL migration: show_outline boolean, about_course_mn/en text)
  const showOutline = course.show_outline !== false; // default true if column missing
  const aboutCourse = locale === 'mn'
    ? (course.about_course_mn || '')
    : (course.about_course_en || course.about_course_mn || '');

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
  const instructorSlug  = instructor ? String(instructor.slug || '') : '';
  const instructorCourseCount = Number(instructor?.course_count || 0);
  const instructorReviewCount = Number(instructor?.total_review_count || ratingCount);

  // Pre-compute outline for sidebar
  const outlineData = (() => {
    const outline = locale === 'mn'
      ? course.course_outline_mn
      : (course.course_outline_en || course.course_outline_mn);
    return Array.isArray(outline) ? outline as { section: string; lessons: string[] }[] : [];
  })();
  const hasOutline = showOutline && (lectureCount > 0 || outlineData.length > 0);

  return (
    <div className="mo-course-page" style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── HEADER — full-width: back link, badges, title, description, meta ── */}
      <div style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 4% 1.25rem' }}>
          <Link href={`/${locale}/courses`} style={{
            color: '#00B5AD', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'inline-block', marginBottom: '1.25rem',
          }}>← Бүх сургалтууд</Link>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            {course.category && (
              <span style={{ background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)', color: '#00B5AD', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>{course.category}</span>
            )}
            {isBestseller && (
              <span style={{ background: '#f59e0b', color: '#000', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>ШИЛДЭГ</span>
            )}
            {level && (
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 600 }}>{level}</span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.6rem', letterSpacing: '-0.5px' }}>
            {title}
          </h1>

          {description && (
            <p style={{ fontSize: '15px', color: '#999', lineHeight: 1.65, marginBottom: '0.85rem', maxWidth: '760px', fontWeight: 400 }}>
              {description}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', fontSize: '13px', color: '#888' }}>
            {rating > 0 && <StarRow rating={rating} count={ratingCount} />}
            {durationText && <span>🕐 {durationText}</span>}
            {lectureCount > 0 && <span>📖 {lectureCount} хичээл</span>}
            {instructorName && <span>👩‍🏫 {instructorName}</span>}
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN GRID ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 4% 2rem' }}>
        <div className="course-two-col">

          {/* ── LEFT COLUMN: video + all content ── */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>

            {/* HeroMedia — 16:9, no crop */}
            <div style={{ marginBottom: '1.5rem' }}>
              <HeroMedia
                coverImageUrl={course.cover_image_url ? String(course.cover_image_url) : undefined}
                trailerUrl={course.trailer_url ? String(course.trailer_url) : undefined}
                grad={grad}
                title={title}
              />
            </div>

            {/* About course */}
            {aboutCourse && (
              <SectionCard title="Сургалтын тухай">
                <div style={{ fontSize: '15px', color: '#ccc', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                  {aboutCourse}
                </div>
              </SectionCard>
            )}

            {/* Course includes */}
            <SectionCard title="Сургалтад багтсан зүйлс">
              <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #2a2a2a' }}>
                {[
                  lectureCount > 0 && { icon: '📖', text: `${lectureCount} хичээл${durationText ? ` · ${durationText}` : ''}` },
                  (Number(course.download_count) || 0) > 0 && { icon: '📥', text: `${Number(course.download_count)} татаж авах материал` },
                  (Number(course.exercise_count) || 0) > 0 && { icon: '✏️', text: `${Number(course.exercise_count)} дасгал ажил` },
                  course.has_certificate && { icon: '🎓', text: 'Гэрчилгээ олгодог' },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="mo-includes-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 0', width: '50%', minWidth: '200px', borderBottom: '1px solid #222', fontSize: '13px', color: '#ccc' }}>
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{(item as {icon:string;text:string}).icon}</span>
                    <span>{(item as {icon:string;text:string}).text}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* What you'll learn */}
            {learnItems.length > 0 && (
              <SectionCard title="Юу сурах вэ?">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.65rem' }}>
                  {learnItems.map((item: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#00B5AD', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Requirements */}
            {reqItems.length > 0 && (
              <SectionCard title="Шаардлага">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reqItems.map((item: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#666', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Instructor — Udemy-style with clickable profile + stats + expandable bio */}
            {instructor && (
              <SectionCard title="Багшийн тухай">
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

                  {/* Clickable avatar — CSS hover via .mo-inst-avatar class */}
                  {instructorSlug ? (
                    <Link href={`/${locale}/instructors/${instructorSlug}`} className="mo-inst-avatar" style={{ flexShrink: 0, display: 'block' }}>
                      {instructorPhoto ? (
                        <img src={instructorPhoto} alt={instructorName}
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2a2a2a', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#00B5AD,#0d3720)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👩‍🏫</div>
                      )}
                    </Link>
                  ) : (
                    instructorPhoto
                      ? <img src={instructorPhoto} alt={instructorName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2a2a2a', flexShrink: 0 }} />
                      : <div style={{ width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#00B5AD,#0d3720)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👩‍🏫</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Clickable name — CSS hover via .mo-inst-name-link class */}
                    {instructorSlug ? (
                      <Link href={`/${locale}/instructors/${instructorSlug}`} className="mo-inst-name-link">
                        <p className="mo-inst-name" style={{ fontSize: '17px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 2px', display: 'inline-block' }}>
                          {instructorName}
                        </p>
                      </Link>
                    ) : (
                      <p style={{ fontSize: '17px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 2px' }}>{instructorName}</p>
                    )}

                    {/* Title / headline */}
                    {instructorTitle && (
                      <p style={{ fontSize: '13px', color: '#00B5AD', margin: '0 0 10px' }}>{instructorTitle}</p>
                    )}

                    {/* Stats row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
                      {rating > 0 && (
                        <span style={{ fontSize: '13px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#f59e0b' }}>⭐</span>
                          <strong style={{ color: '#f59e0b' }}>{rating.toFixed(1)}</strong> Багшийн үнэлгээ
                        </span>
                      )}
                      {instructorReviewCount > 0 && (
                        <span style={{ fontSize: '13px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>💬</span>
                          <strong style={{ color: '#e5e5e5' }}>{instructorReviewCount.toLocaleString()}</strong> Сэтгэгдэл
                        </span>
                      )}
                      {instructorCourseCount > 0 && (
                        <span style={{ fontSize: '13px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>📚</span>
                          <strong style={{ color: '#e5e5e5' }}>{instructorCourseCount}</strong> Сургалт
                        </span>
                      )}
                    </div>

                    {/* Expandable bio */}
                    {instructorBio && <InstructorBio bio={instructorBio} />}

                    {/* Profile link — CSS hover via .mo-inst-profile-btn */}
                    {instructorSlug && (
                      <Link href={`/${locale}/instructors/${instructorSlug}`}
                        className="mo-inst-profile-btn"
                        style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#00B5AD', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(0,181,173,0.4)', padding: '5px 14px', borderRadius: '20px' }}
                      >
                        Бүрэн профайл харах →
                      </Link>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT SIDEBAR: sticky price card + curriculum ── */}
          <div className="course-sidebar" style={{
            flex: '0 0 340px', maxWidth: '340px',
            position: 'sticky', top: '80px',
            alignSelf: 'flex-start',
            display: 'flex', flexDirection: 'column', gap: '1rem',
          }}>

            {/* Price card */}
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>

              {/* Price row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: price === 0 ? '#10b981' : '#fff', lineHeight: 1 }}>
                  {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                </span>
                {originalPrice > price && originalPrice > 0 && (
                  <>
                    <span style={{ fontSize: '14px', color: '#555', textDecoration: 'line-through' }}>{originalPrice.toLocaleString()}₮</span>
                    <span style={{ fontSize: '11px', background: '#e53e3e', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>{discountPct}% OFF</span>
                  </>
                )}
              </div>

              {/* CTAs — full-width, bold, Fitts's Law */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {price === 0 ? (
                  <Link href={`/${locale}/checkout/${slug}`} style={{
                    background: '#00B5AD', color: '#fff',
                    padding: '15px', borderRadius: '10px',
                    fontWeight: 800, textDecoration: 'none', fontSize: '16px',
                    boxShadow: '0 4px 20px rgba(0,181,173,0.4)',
                    textAlign: 'center', display: 'block', letterSpacing: '0.2px',
                  }}>
                    Үнэгүй авах
                  </Link>
                ) : (
                  <>
                    <Link href={`/${locale}/checkout/${slug}`} style={{
                      background: '#00B5AD', color: '#fff',
                      padding: '15px', borderRadius: '10px',
                      fontWeight: 800, textDecoration: 'none', fontSize: '16px',
                      boxShadow: '0 4px 20px rgba(0,181,173,0.4)',
                      textAlign: 'center', display: 'block', letterSpacing: '0.2px',
                    }}>
                      Худалдан авах
                    </Link>
                    <AddToCartButton locale={locale} slug={slug} />
                  </>
                )}
              </div>

              <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', margin: '0 0 1.25rem' }}>
                Бүртгэлгүйгээр худалдан авах боломжтой
              </p>

              <ShareButton
                url={`https://mommyoffice-smoky.vercel.app/${locale}/courses/${slug}`}
                title={title}
              />
            </div>

            {/* Хичээлийн агуулга — sidebar */}
            {hasOutline && (
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1rem' }}>
                  Хичээлийн агуулга
                </h2>
                {outlineData.length === 0
                  ? <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>Хичээлийн дэлгэрэнгүй агуулга удахгүй нэмэгдэнэ.</p>
                  : <CourseOutline sections={outlineData} lectureCount={lectureCount} durationText={durationText} />
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FULL-WIDTH BELOW: Reviews + Similar Courses ── */}
      <div style={{ borderTop: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 4% 3rem' }}>

          {/* Reviews */}
          {(rating > 0 || reviews.length > 0) && (
            <SectionCard title="Үнэлгээ & Сэтгэгдэл">
              {rating > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <StarRow rating={rating} count={ratingCount} />
                </div>
              )}
              {reviews.length > 0 ? (
                <div className="mo-reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {reviews.map((r) => (
                    <div key={r.id} style={{ background: '#222', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #2a2a2a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#00B5AD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {String(r.reviewer_name || 'О').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>{r.reviewer_name || 'Оюутан'}</p>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1,2,3,4,5].map(s => (
                              <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#333', fontSize: '11px' }}>★</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#555' }}>{timeAgo(r.created_at)}</span>
                      </div>
                      {r.review_text && <p style={{ margin: 0, fontSize: '14px', color: '#aaa', lineHeight: 1.6 }}>{r.review_text}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Сэтгэгдэл байхгүй байна.</p>
              )}
            </SectionCard>
          )}

          {/* Similar courses — Netflix-style horizontal scroll */}
          {similarCourses.length > 0 && (
            <section style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.75rem 2rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1.25rem' }}>
                Санал болгох бусад сургалтууд — {course.category}
              </h2>
              <div className="scroll-row" style={{ gap: '1rem', paddingBottom: '0.75rem' }}>
                {similarCourses.map((sc) => {
                  const scTitle  = locale === 'mn' ? sc.title_mn : (sc.title_en || sc.title_mn);
                  const scPrice  = Number(sc.price) || 0;
                  const scOrig   = Number(sc.original_price) || 0;
                  const scRating = Number(sc.rating) || 0;
                  const scDisc   = scOrig > scPrice && scOrig > 0 ? Math.round((1 - scPrice / scOrig) * 100) : 0;
                  const scGrad   = CAT_GRADIENTS[String(sc.category || '')] || CAT_GRADIENTS.default;
                  return (
                    <Link key={sc.id} href={sc.slug ? `/${locale}/courses/${sc.slug}` : '#'}
                      className="netflix-card"
                      style={{ textDecoration: 'none', display: 'block', flex: '0 0 220px', minWidth: '220px' }}>
                      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '120px', background: sc.cover_image_url ? `url(${sc.cover_image_url}) center/cover` : scGrad, position: 'relative' }}>
                          {sc.is_bestseller && (
                            <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px' }}>ШИЛДЭГ</span>
                          )}
                          {scDisc > 0 && (
                            <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#e53e3e', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>{scDisc}% OFF</span>
                          )}
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5', margin: '0 0 4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scTitle}</p>
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
                              <span style={{ fontSize: '11px', color: '#555', textDecoration: 'line-through' }}>{scOrig.toLocaleString()}₮</span>
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

        </div>
      </div>

      {/* ── MOBILE STICKY BUY BAR — shows on mobile only (< 960px) ── */}
      <div className="mo-mobile-buy">
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
          </div>
          {originalPrice > price && originalPrice > 0 && (
            <div style={{ fontSize: '11px', color: '#666', textDecoration: 'line-through', marginTop: 2 }}>
              {originalPrice.toLocaleString()}₮
            </div>
          )}
        </div>
        <Link href={`/${locale}/checkout/${slug}`} style={{
          flex: 1, display: 'block', textAlign: 'center',
          background: '#00B5AD', color: '#fff',
          padding: '13px 16px', borderRadius: '10px',
          fontWeight: 800, textDecoration: 'none', fontSize: '15px',
          boxShadow: '0 4px 20px rgba(0,181,173,0.4)',
          letterSpacing: '0.2px',
        }}>
          {price === 0 ? 'Үнэгүй авах' : 'Худалдан авах'}
        </Link>
      </div>
    </div>
  );
}
