import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const CATEGORIES = ['Бүх ангилал', 'Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];

async function getCourses(category?: string) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, description_mn, description_en, price, cover_image_url, slug, category, instructor_id')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'Бүх ангилал') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
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

  const PLACEHOLDER_COURSES = [
    { id: 1, title_mn: 'Гэрийн хоол хийх урлаг', price: 29900, emoji: '🍳', category: 'Хоол', desc_mn: 'Гэртээ эрүүл, амттай хоол хийж сур' },
    { id: 2, title_mn: 'Арьс нүүрний мэргэжлийн арчилгаа', price: 39900, emoji: '💆', category: 'Гоо сайхан', desc_mn: 'Мэргэжилтний нууц аргуудыг сур' },
    { id: 3, title_mn: 'Дотоод амар тайван — Meditation', price: 24900, emoji: '🧘', category: 'Эрүүл мэнд', desc_mn: 'Оюун санааны тайван байдлыг олж ав' },
    { id: 4, title_mn: 'Бизнес эхлүүлэх 101', price: 49900, emoji: '💼', category: 'Бизнес', desc_mn: 'Өөрийн бизнесийг эхлүүлэх алхамууд' },
    { id: 5, title_mn: 'Гэрийн дотоод чимэглэл', price: 19900, emoji: '🏠', category: 'Дизайн', desc_mn: 'Гэрээ хэрхэн чимэглэх вэ' },
    { id: 6, title_mn: 'Хувийн санхүүгийн удирдлага', price: 34900, emoji: '💰', category: 'Бизнес', desc_mn: 'Хувийн санхүүгээ зөв удирдаж сур' },
    { id: 7, title_mn: 'Гэр бүлийн эрүүл харилцаа', price: 29900, emoji: '💝', category: 'Гэр бүл', desc_mn: 'Гэр бүлийн бат бөх харилцаа' },
    { id: 8, title_mn: 'Зорилго тавих — Goal Setting', price: 0, emoji: '🎯', category: 'Хувийн хөгжил', desc_mn: 'Амьдралын зорилгоо олж, хэрэгжүүл' },
  ];

  const displayCourses = courses.length > 0 ? courses : PLACEHOLDER_COURSES;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('title')}</h1>
        <p style={{ color: '#6b7280' }}>Монголын шилдэг хичээлүүдийг нэг дороос олж ав</p>
      </div>

      {/* Category Filter — Domestika style pills */}
      <div style={{
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem'
      }}>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === 'Бүх ангилал' ? `/${locale}/courses` : `/${locale}/courses?category=${encodeURIComponent(cat)}`}
            style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '14px',
              fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
              background: (category === cat || (!category && cat === 'Бүх ангилал'))
                ? 'var(--teal)' : '#f3f4f6',
              color: (category === cat || (!category && cat === 'Бүх ангилал'))
                ? '#fff' : 'var(--foreground)',
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Course Grid — Domestika style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '2rem'
      }}>
        {displayCourses.map((course: Record<string, unknown>) => {
          const title = locale === 'mn'
            ? String(course.title_mn || '')
            : String(course.title_en || course.title_mn || '');
          const desc = locale === 'mn'
            ? String(course.desc_mn || course.description_mn || '')
            : String(course.desc_en || course.description_en || course.desc_mn || '');
          const price = Number(course.price) || 0;
          const slug = course.slug ? `/${locale}/courses/${course.slug}` : '#';

          return (
            <Link key={String(course.id)} href={slug} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{ borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', height: '100%' }}>
                {/* Course thumbnail */}
                <div style={{
                  height: '175px',
                  background: 'linear-gradient(135deg, var(--teal-light), #99d9d7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', position: 'relative'
                }}>
                  {course.cover_image_url ? (
                    <img
                      src={String(course.cover_image_url)}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{String(course.emoji || '📚')}</span>
                  )}
                  {/* Category badge */}
                  <span style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 10px', borderRadius: '12px'
                  }}>
                    {String(course.category || '')}
                  </span>
                </div>

                {/* Course info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    fontWeight: 700, fontSize: '15px', lineHeight: 1.4,
                    marginBottom: '0.5rem', color: 'var(--foreground)',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {title}
                  </h3>
                  {desc && (
                    <p style={{
                      fontSize: '13px', color: '#6b7280', lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {desc}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '17px', color: price === 0 ? '#10b981' : 'var(--foreground)' }}>
                      {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                    </span>
                    <span style={{
                      background: 'var(--teal)', color: '#fff',
                      padding: '6px 14px', borderRadius: '8px',
                      fontSize: '13px', fontWeight: 600
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
  );
}
