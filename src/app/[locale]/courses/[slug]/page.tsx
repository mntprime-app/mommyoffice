import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PurchaseButton from '@/components/ui/PurchaseButton';

async function getCourse(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_courses')
      .select(`
        id, title_mn, title_en, description_mn, description_en,
        price, cover_image_url, trailer_url, slug, category, instructor_id,
        mo_modules(id, title_mn, title_en, sort_order),
        mo_instructors(name, bio_mn, bio_en, photo_url)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('courses');

  const course = await getCourse(slug);
  if (!course) notFound();

  const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  const desc = locale === 'mn' ? course.description_mn : (course.description_en || course.description_mn);
  const price = Number(course.price) || 0;

  const modules = Array.isArray(course.mo_modules)
    ? [...course.mo_modules].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sort_order) - Number(b.sort_order))
    : [];

  const instructors = Array.isArray(course.mo_instructors) ? course.mo_instructors : [];
  const instructor = instructors[0] as Record<string, unknown> | undefined;

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff', padding: '3rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 400px', minWidth: '280px' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <Link href={`/${locale}/courses`} style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '14px' }}>
                ← Хичээлүүд
              </Link>
            </div>
            <span style={{
              background: 'var(--yellow)', color: '#1a1a2e',
              padding: '3px 12px', borderRadius: '12px',
              fontSize: '12px', fontWeight: 700, marginBottom: '1rem', display: 'inline-block'
            }}>
              {course.category}
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
              {title}
            </h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '15px' }}>
              {desc}
            </p>
            {instructor && (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                {t('instructor')}: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{String(instructor.name)}</span>
              </p>
            )}
          </div>

          {/* Purchase card */}
          <div style={{
            background: '#fff', color: 'var(--foreground)', borderRadius: '16px',
            padding: '2rem', minWidth: '280px', flex: '0 0 300px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {course.trailer_url && (
              <div style={{
                height: '160px', borderRadius: '10px', overflow: 'hidden',
                marginBottom: '1.25rem', background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${course.trailer_url}?rel=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            )}
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--foreground)' }}>
              {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
            </div>
            <PurchaseButton courseId={String(course.id)} price={price} locale={locale} />
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '0.75rem' }}>
              Худалдан авсны дараа и-мэйлээр нэвтрэх холбоос ирнэ
            </p>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 340px)', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            {/* What you'll learn */}
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                Та юу сурах вэ?
              </h2>
              <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px' }}>
                <p style={{ color: '#4b5563', lineHeight: 1.8 }}>{desc}</p>
              </div>
            </section>

            {/* Modules */}
            {modules.length > 0 && (
              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  Хичээлийн агуулга ({modules.length} {t('lessons')})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {modules.map((mod: Record<string, unknown>, i: number) => (
                    <div key={String(mod.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.875rem 1rem', background: '#fff',
                      border: '1px solid var(--border)', borderRadius: '8px'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'var(--teal-light)', color: 'var(--teal)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, flexShrink: 0
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>
                        {locale === 'mn' ? String(mod.title_mn || '') : String(mod.title_en || mod.title_mn || '')}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '18px' }}>🔒</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructor */}
            {instructor && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  Багшийн тухай
                </h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'var(--teal)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '24px'
                  }}>
                    {String(instructor.name || '').charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{String(instructor.name)}</p>
                    <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6 }}>
                      {locale === 'mn' ? String(instructor.bio_mn || '') : String(instructor.bio_en || instructor.bio_mn || '')}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
