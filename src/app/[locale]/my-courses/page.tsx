'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Enrollment {
  course_id: string;
  enrolled_at: string;
  expires_at: string | null;
  mo_courses: {
    id: string;
    slug: string;
    title_mn: string;
    cover_image_url: string | null;
    price: number;
  } | null;
}

function getProgress(slug: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`mo_progress_${slug}`);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { completed?: string[] };
    return Math.min(100, (data.completed?.length ?? 0) * 10);
  } catch {
    return 0;
  }
}

export default function MyCoursesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'mn';

  const [email, setEmail] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!sessionData.session) {
        router.replace(`/${locale}`);
        return;
      }

      const userEmail = sessionData.session.user.email ?? null;
      setEmail(userEmail);

      if (!userEmail) {
        setLoading(false);
        return;
      }

      // Use admin API route to bypass RLS on mo_access_tokens
      const res = await fetch(`/api/my-enrollments?email=${encodeURIComponent(userEmail)}`);
      const json = await res.json() as { ok: boolean; enrollments?: Enrollment[] };
      setEnrollments(json.enrollments || []);
      setLoading(false);
    });
  }, [router, locale]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #e5e7eb',
          borderTopColor: '#00B5AD', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>
            Миний сургалтууд
          </h1>
          {email && (
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{email}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            background: 'transparent', border: '1.5px solid #d1d5db',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            color: '#6b7280', cursor: 'pointer', fontWeight: 500
          }}
        >
          {signingOut ? 'Гарч байна...' : 'Гарах'}
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: '#1a1a1a', borderRadius: 16, border: '1px solid #2a2a2a'
        }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00B5AD" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Одоогоор бүртгэлтэй сургалт байхгүй
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: '1.5rem' }}>
            Сургалтаа сонгоод суралцаж эхэлнэ үү!
          </p>
          <Link href={`/${locale}/courses`} style={{
            display: 'inline-block', background: '#00B5AD', color: '#fff',
            borderRadius: 10, padding: '12px 28px', fontWeight: 700,
            fontSize: 15, textDecoration: 'none'
          }}>
            Сургалтууд үзэх →
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {enrollments.map((enrollment, i) => {
            const course = enrollment.mo_courses;
            if (!course) return null;
            const progress = getProgress(course.slug);
            const isLifetime = !enrollment.expires_at;
            const expiryStr = isLifetime
              ? 'Насан туршийн'
              : new Date(enrollment.expires_at!).toLocaleDateString('mn-MN');

            return (
              <div key={`${course.id}-${i}`} style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid #e5e7eb', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                }}
              >
                {/* Cover */}
                <div style={{
                  height: 160, background: course.cover_image_url
                    ? `url(${course.cover_image_url}) center/cover`
                    : 'linear-gradient(135deg, #00B5AD 0%, #0d9488 100%)',
                  position: 'relative'
                }}>
                  {!course.cover_image_url && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 40
                    }}>📖</div>
                  )}
                  {/* Access badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: isLifetime ? '#00B5AD' : '#f59e0b',
                    color: '#fff', borderRadius: 6, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700
                  }}>
                    {isLifetime ? '∞ Lifetime' : expiryStr}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, color: '#111',
                    margin: '0 0 0.75rem', lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {course.title_mn}
                  </h3>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, color: '#6b7280', marginBottom: 4
                    }}>
                      <span>Явц</span>
                      <span style={{ fontWeight: 600, color: progress > 0 ? '#00B5AD' : '#9ca3af' }}>
                        {progress}%
                      </span>
                    </div>
                    <div style={{
                      height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: progress === 100
                          ? '#10b981'
                          : 'linear-gradient(90deg, #00B5AD, #0d9488)',
                        borderRadius: 3,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href={`/${locale}/courses/${course.slug}/learn`} style={{
                    display: 'block', textAlign: 'center',
                    background: progress === 0 ? '#00B5AD' : '#0d9488',
                    color: '#fff', borderRadius: 8, padding: '10px',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    transition: 'opacity 0.15s'
                  }}>
                    {progress === 0 ? 'Эхлүүлэх →' : progress === 100 ? '✅ Дуусгасан' : 'Үргэлжлүүлэх →'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse more */}
      {enrollments.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href={`/${locale}/courses`} style={{
            color: '#00B5AD', fontWeight: 600, fontSize: 14,
            textDecoration: 'none', borderBottom: '1px solid #00B5AD'
          }}>
            Бусад сургалтуудыг үзэх →
          </Link>
        </div>
      )}
    </div>
  );
}
