'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CartCourse {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string;
  cover_image_url: string | null;
  price: number | null;
  original_price: number | null;
  is_bestseller: boolean;
}

export function CartView({ locale }: { locale: string }) {
  const [courses, setCourses] = useState<CartCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mo_cart') || '[]');
      const arr = Array.isArray(stored) ? stored as string[] : [];
      setSlugs(arr);
      if (arr.length === 0) { setLoading(false); return; }
      fetch('/api/courses/by-slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: arr }),
      })
        .then(r => r.json())
        .then((data: { courses: CartCourse[] }) => {
          setCourses(data.courses || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  function removeItem(slug: string) {
    const next = slugs.filter(s => s !== slug);
    setSlugs(next);
    localStorage.setItem('mo_cart', JSON.stringify(next));
    setCourses(c => c.filter(course => course.slug !== slug));
    // Dispatch storage event so Navbar badge updates
    window.dispatchEvent(new Event('storage'));
  }

  const total = courses.reduce((sum, c) => sum + (c.price ?? 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#888', fontSize: '15px' }}>
        Ачааллаж байна...
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
        <p style={{ color: '#888', fontSize: '16px', marginBottom: '24px' }}>Таны сагс хоосон байна.</p>
        <Link href={`/${locale}/courses`} style={{
          display: 'inline-block',
          background: '#00B5AD', color: '#fff',
          padding: '12px 28px', borderRadius: '8px',
          fontWeight: 700, textDecoration: 'none', fontSize: '15px',
        }}>
          Сургалтуудыг үзэх →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      {/* Course list */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
          {courses.length} сургалт сагсанд байна
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {courses.map(course => {
            const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
            const price = course.price ?? 0;
            const orig = course.original_price ?? 0;
            const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
            return (
              <div key={course.slug} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: '10px', padding: '16px',
              }}>
                {/* Thumbnail */}
                {course.cover_image_url ? (
                  <Link href={`/${locale}/courses/${course.slug}`} style={{ flexShrink: 0 }}>
                    <img src={course.cover_image_url} alt={title}
                      style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                  </Link>
                ) : (
                  <div style={{ width: '120px', height: '80px', background: '#2a2a2a', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '28px' }}>📚</span>
                  </div>
                )}
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/${locale}/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#e5e5e5', margin: '0 0 8px', lineHeight: 1.4 }}>
                      {title}
                    </p>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#00B5AD' }}>
                      {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                    </span>
                    {discount > 0 && (
                      <>
                        <span style={{ fontSize: '13px', color: '#666', textDecoration: 'line-through' }}>
                          {orig.toLocaleString()}₮
                        </span>
                        <span style={{ fontSize: '11px', background: '#e53e3e', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <Link href={`/${locale}/checkout/${course.slug}`} style={{
                    display: 'block', background: '#00B5AD', color: '#fff',
                    padding: '8px 16px', borderRadius: '6px', fontWeight: 700,
                    textDecoration: 'none', fontSize: '13px', textAlign: 'center', whiteSpace: 'nowrap',
                  }}>
                    Худалдаж авах
                  </Link>
                  <button onClick={() => removeItem(course.slug)} style={{
                    background: 'none', border: '1px solid #333', color: '#888',
                    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 500,
                  }}>
                    Хасах
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order summary sidebar */}
      <div style={{
        width: '300px', flexShrink: 0,
        position: 'sticky', top: '80px',
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '12px', padding: '24px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 20px' }}>
          Захиалгын дүн
        </h2>
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '16px', marginBottom: '20px' }}>
          {courses.map(c => {
            const t = locale === 'mn' ? c.title_mn : (c.title_en || c.title_mn);
            return (
              <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.4, flex: 1, minWidth: 0 }}
                  title={t}>
                  {t.length > 36 ? t.slice(0, 36) + '…' : t}
                </span>
                <span style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, flexShrink: 0 }}>
                  {(c.price ?? 0) === 0 ? 'Үнэгүй' : `${(c.price ?? 0).toLocaleString()}₮`}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2a2a2a', paddingTop: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5' }}>Нийт дүн</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#00B5AD' }}>
            {total === 0 ? 'Үнэгүй' : `${total.toLocaleString()}₮`}
          </span>
        </div>
        {courses.length === 1 ? (
          <Link href={`/${locale}/checkout/${courses[0].slug}`} style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            background: '#00B5AD', color: '#fff',
            padding: '14px', borderRadius: '8px',
            fontWeight: 800, textDecoration: 'none',
            fontSize: '15px', textAlign: 'center',
          }}>
            Худалдаж авах →
          </Link>
        ) : (
          <Link href={`/${locale}/checkout`} style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            background: '#00B5AD', color: '#fff',
            padding: '14px', borderRadius: '8px',
            fontWeight: 800, textDecoration: 'none',
            fontSize: '15px', textAlign: 'center',
          }}>
            Бүгдийг худалдаж авах →
          </Link>
        )}
        <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
          QPay-р дамжуулан аюулгүй төлбөр хийгдэнэ
        </p>
      </div>
    </div>
  );
}
