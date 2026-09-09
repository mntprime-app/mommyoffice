'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { listCourses, toggleCoursePublish, deleteCourse } from './actions';

type Course = {
  id: string;
  title_mn: string;
  title_en: string | null;
  price: number | null;
  original_price: number | null;
  category: string;
  is_published: boolean;
  slug: string;
  placement: string | null;
  is_bestseller: boolean;
};

const PLACEMENT_LABEL: Record<string, string> = {
  hero: '🌟 Hero',
  featured: '⭐ Featured',
  normal: '',
};

export default function AdminCoursesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCourses().then((data) => {
      setCourses(data as Course[]);
      setLoading(false);
    });
  }, []);

  async function togglePublish(id: string, current: boolean) {
    await toggleCoursePublish(id, current);
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, is_published: !current } : c));
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" хичээлийг устгах уу?`)) return;
    await deleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link> / Хичээлүүд
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            Хичээлүүд ({courses.length})
          </h1>
        </div>
        <Link href={`/${locale}/admin/courses/new`} style={{
          background: '#00B5AD', color: '#fff',
          padding: '10px 20px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none', fontSize: '14px',
        }}>
          + Шинэ хичээл
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Ачааллаж байна...</div>
      ) : courses.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          border: '2px dashed #2a2a2a', borderRadius: '14px',
          background: '#1a1a1a',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Хичээл байхгүй байна</p>
          <Link href={`/${locale}/admin/courses/new`} style={{
            background: '#00B5AD', color: '#fff',
            padding: '10px 24px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none',
          }}>
            Эхний хичээл нэмэх
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map((course) => {
            const title = course.title_mn;
            const published = course.is_published;
            const placement = course.placement || 'normal';
            const price = course.price ?? 0;
            const orig = course.original_price ?? 0;
            const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

            return (
              <div key={course.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem',
                border: '1px solid #2a2a2a',
                borderRadius: '10px',
                background: '#1a1a1a',
              }}>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#e5e5e5', margin: 0 }}>{title}</p>
                    {course.is_bestseller && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                        🏆 Бестселлер
                      </span>
                    )}
                    {PLACEMENT_LABEL[placement] && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                        {PLACEMENT_LABEL[placement]}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(0,181,173,0.15)', color: '#00B5AD', padding: '2px 8px', borderRadius: '8px' }}>
                      {course.category}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#00B5AD' }}>
                      {price === 0 ? 'Үнэгүй' : `${price.toLocaleString()}₮`}
                    </span>
                    {discount > 0 && (
                      <span style={{ fontSize: '11px', color: '#666', textDecoration: 'line-through' }}>
                        {orig.toLocaleString()}₮
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: published ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                      {published ? '● Нийтлэгдсэн' : '○ Ноорог'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => togglePublish(course.id, published)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: published ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: published ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {published ? 'Нуух' : 'Нийтлэх'}
                  </button>
                  <Link href={`/${locale}/admin/courses/${course.id}/edit`} style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    textDecoration: 'none', background: '#2a2a2a', color: '#e5e5e5', border: '1px solid #333',
                  }}>
                    Засах
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id, title)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    }}
                  >
                    Устгах
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
