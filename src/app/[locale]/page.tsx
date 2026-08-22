import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

async function getFeaturedCourses(locale: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, title_mn, title_en, price, cover_image_url, slug, category')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(8);
    return data || [];
  } catch {
    return [];
  }
}

async function getLatestArticles(locale: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mo_articles')
      .select('id, title_mn, title_en, cover_image_url, slug, category, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('home');

  const [courses, articles] = await Promise.all([
    getFeaturedCourses(locale),
    getLatestArticles(locale),
  ]);

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        color: '#fff',
        padding: '5rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Yellow accent */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px',
          background: 'var(--yellow)', borderRadius: '50%',
          opacity: 0.08
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '10%',
          width: '200px', height: '200px',
          background: 'var(--teal)', borderRadius: '50%',
          opacity: 0.1
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--yellow)', color: '#1a1a2e',
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 700, marginBottom: '1.5rem',
            letterSpacing: '0.5px'
          }}>
            Mongolia #1
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800, lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '680px'
          }}>
            {t('hero_title')}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#cbd5e1', marginBottom: '2.5rem',
            maxWidth: '520px', lineHeight: 1.6
          }}>
            {t('hero_subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/courses`} style={{
              background: 'var(--teal)', color: '#fff',
              padding: '14px 32px', borderRadius: '10px',
              fontWeight: 700, textDecoration: 'none',
              fontSize: '16px', display: 'inline-block'
            }}>
              {t('hero_cta')}
            </Link>
            <Link href={`/${locale}/articles`} style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '14px 32px', borderRadius: '10px',
              fontWeight: 600, textDecoration: 'none',
              fontSize: '16px', display: 'inline-block',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              Нийтлэлүүд
            </Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Featured Courses Row */}
        <section style={{ padding: '3rem 0 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
              {t('featured_courses')}
            </h2>
            <Link href={`/${locale}/courses`} style={{
              color: 'var(--teal)', textDecoration: 'none',
              fontWeight: 600, fontSize: '14px'
            }}>
              {t('view_all')} →
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="scroll-row">
              {courses.map((course: Record<string, unknown>) => (
                <CourseCard key={String(course.id)} course={course} locale={locale} />
              ))}
            </div>
          ) : (
            <PlaceholderCourseRow locale={locale} />
          )}
        </section>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* Latest Articles */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('latest_articles')}
            </h2>
            <Link href={`/${locale}/articles`} style={{
              color: 'var(--teal)', textDecoration: 'none', fontWeight: 600, fontSize: '14px'
            }}>
              {t('view_all')} →
            </Link>
          </div>

          {articles.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {articles.map((article: Record<string, unknown>) => (
                <ArticleCard key={String(article.id)} article={article} locale={locale} />
              ))}
            </div>
          ) : (
            <PlaceholderArticleGrid locale={locale} />
          )}
        </section>
      </div>
    </div>
  );
}

function CourseCard({ course, locale }: { course: Record<string, unknown>; locale: string }) {
  const title = locale === 'mn' ? String(course.title_mn || '') : String(course.title_en || course.title_mn || '');
  const price = Number(course.price) || 0;

  return (
    <Link href={`/${locale}/courses/${course.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '220px' }}>
      <div style={{
        borderRadius: '12px', overflow: 'hidden',
        border: '1px solid var(--border)',
        transition: 'box-shadow 0.2s',
        background: '#fff'
      }}>
        <div style={{
          width: '220px', height: '140px',
          background: 'linear-gradient(135deg, var(--teal-light), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {course.cover_image_url ? (
            <img
              src={String(course.cover_image_url)}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>📚</span>
          )}
        </div>
        <div style={{ padding: '12px' }}>
          <p style={{
            fontWeight: 600, fontSize: '14px', color: 'var(--foreground)',
            lineHeight: 1.4, marginBottom: '8px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {title}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontWeight: 700, color: 'var(--teal)', fontSize: '15px'
            }}>
              {price > 0 ? `${price.toLocaleString()}₮` : 'Үнэгүй'}
            </span>
            <span style={{
              fontSize: '11px', background: 'var(--teal-light)',
              color: 'var(--teal)', padding: '2px 8px', borderRadius: '10px',
              fontWeight: 600
            }}>
              {String(course.category || '')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article, locale }: { article: Record<string, unknown>; locale: string }) {
  const title = locale === 'mn' ? String(article.title_mn || '') : String(article.title_en || article.title_mn || '');

  return (
    <Link href={`/${locale}/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: '12px', overflow: 'hidden',
        border: '1px solid var(--border)', background: '#fff'
      }}>
        <div style={{
          height: '180px',
          background: 'linear-gradient(135deg, #fef3c7, var(--yellow))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {article.cover_image_url ? (
            <img
              src={String(article.cover_image_url)}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '3rem' }}>✨</span>
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--teal)',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {String(article.category || 'Lifestyle')}
          </span>
          <p style={{
            fontWeight: 600, fontSize: '15px', color: 'var(--foreground)',
            lineHeight: 1.5, marginTop: '6px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PlaceholderCourseRow({ locale }: { locale: string }) {
  const placeholders = [
    { title: 'Гэрийн хоол хийх урлаг', price: 29900, emoji: '🍳', cat: 'Хоол' },
    { title: 'Арьс нүүрний арчилгаа', price: 39900, emoji: '💆', cat: 'Гоо сайхан' },
    { title: 'Дотоод амар тайван', price: 24900, emoji: '🧘', cat: 'Эрүүл мэнд' },
    { title: 'Бизнес эхлүүлэх 101', price: 49900, emoji: '💼', cat: 'Бизнес' },
    { title: 'Гэрийн чимэглэл', price: 19900, emoji: '🏠', cat: 'Дизайн' },
  ];

  return (
    <div className="scroll-row">
      {placeholders.map((p, i) => (
        <div key={i} style={{ flexShrink: 0, width: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{
            width: '220px', height: '140px',
            background: 'linear-gradient(135deg, var(--teal-light), #b2dfdb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem'
          }}>
            {p.emoji}
          </div>
          <div style={{ padding: '12px' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.4, marginBottom: '8px' }}>
              {p.title}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '15px' }}>{p.price.toLocaleString()}₮</span>
              <span style={{ fontSize: '11px', background: 'var(--teal-light)', color: 'var(--teal)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{p.cat}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderArticleGrid({ locale }: { locale: string }) {
  const articles = [
    { title: 'Өглөөний эрүүл дэглэм — 5 алхам', cat: 'Эрүүл мэнд', emoji: '🌅' },
    { title: 'Гэрийнхнийхээ хоолны дэглэмийг яаж сайжруулах вэ?', cat: 'Хоол тэжээл', emoji: '🥗' },
    { title: 'Монгол эмэгтэйчүүдийн бизнес амжилтын нууц', cat: 'Бизнес', emoji: '🚀' },
    { title: 'Арьсаа хэрхэн арчлах вэ — мэргэжилтний зөвлөгөө', cat: 'Гоо сайхан', emoji: '✨' },
    { title: 'Гэр бүлийн бат бөх холбоо', cat: 'Гэр бүл', emoji: '💝' },
    { title: 'Зорилгодоо хэрхэн хурдан хүрэх вэ?', cat: 'Хувийн хөгжил', emoji: '🎯' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {articles.map((a, i) => (
        <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#fff' }}>
          <div style={{
            height: '160px',
            background: `linear-gradient(135deg, #fef3c7, #fbbf24)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem'
          }}>
            {a.emoji}
          </div>
          <div style={{ padding: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase' }}>{a.cat}</span>
            <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)', lineHeight: 1.5, marginTop: '6px' }}>
              {a.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
