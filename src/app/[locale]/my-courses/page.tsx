'use client';
/**
 * /mn/my-courses — Миний сургалтууд (My Learning)
 * Reads email from localStorage mo_session, fetches purchased courses, shows Udemy-style grid.
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Course = { courseId: string; courseSlug: string; courseTitleMn: string };

export default function MyCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lp = (path: string) => `/${locale}${path}`;

  const [email, setEmail]     = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem('mo_session');
      if (!s) { router.replace(lp('/access')); return; }
      const parsed = JSON.parse(s);
      if (!parsed.email) { router.replace(lp('/access')); return; }
      setEmail(parsed.email);

      fetch('/api/access/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsed.email }),
      })
        .then(r => r.json())
        .then((data: { courses?: Course[] }) => {
          setCourses(data.courses ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch {
      router.replace(lp('/access'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initial = email ? email.charAt(0).toUpperCase() : '?';

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#e5e5e5' }}>
      {/* Header bar */}
      <div style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 0' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#fff' }}>
            Миний сургалтууд
          </h1>
          {email && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{email}</p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Сургалт хайж байна...
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Сургалт олдсонгүй
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Энэ и-мэйл хаягт холбоотой идэвхтэй сургалт байхгүй байна.
            </p>
            <Link href={lp('/courses')} style={{
              display: 'inline-block', background: '#00B5AD', color: '#fff',
              padding: '12px 24px', borderRadius: '8px', textDecoration: 'none',
              fontWeight: 700,
            }}>
              Сургалтуудыг үзэх →
            </Link>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <>
            {/* Stats bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1.5rem',
              marginBottom: '2rem', padding: '1rem 1.25rem',
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
            }}>
              {/* Avatar */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#00B5AD', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 800, flexShrink: 0,
                border: '2px solid rgba(0,181,173,0.4)',
              }}>
                {initial}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>{email}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  {courses.length} сургалт худалдан авсан
                </div>
              </div>
            </div>

            {/* Course grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {courses.map((c) => (
                <CourseCard key={c.courseId} course={c} lp={lp} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, lp }: { course: Course; lp: (p: string) => string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={lp(`/courses/${course.courseSlug}/learn`)}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: '#1a1a1a',
        border: `1px solid ${hovered ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
        borderRadius: '14px', overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,181,173,0.12)' : 'none',
        cursor: 'pointer',
      }}>
        {/* Thumbnail placeholder */}
        <div style={{
          height: '160px',
          background: 'linear-gradient(135deg, rgba(0,181,173,0.15) 0%, rgba(0,181,173,0.05) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem',
          borderBottom: '1px solid #2a2a2a',
        }}>
          🎓
        </div>

        <div style={{ padding: '1rem' }}>
          <div style={{
            fontWeight: 700, color: '#fff', fontSize: '14px',
            lineHeight: 1.4, marginBottom: '10px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {course.courseTitleMn}
          </div>

          {/* Progress bar — 0% (no tracking yet) */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{ height: '100%', width: '0%', background: '#00B5AD', borderRadius: '2px' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>0% дууссан</div>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(0,181,173,0.1)', border: '1px solid rgba(0,181,173,0.25)',
            borderRadius: '6px', padding: '5px 10px',
            fontSize: '12px', color: '#00B5AD', fontWeight: 600,
          }}>
            Эхлүүлэх →
          </div>
        </div>
      </div>
    </Link>
  );
}
