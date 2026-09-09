'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Tab = 'student' | 'instructor';
type CourseResult = { courseId: string; courseSlug: string; courseTitleMn: string };

export default function AccessIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const lp = (path: string) => `/${locale}${path}`;

  const [tab, setTab]           = useState<Tab>('student');
  const [email, setEmail]       = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses]   = useState<CourseResult[] | null>(null); // null = not submitted yet

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('И-мэйл хаягаа оруулна уу'); return; }
    if (!trimmed.includes('@')) { setError('И-мэйл хаяг буруу байна'); return; }

    setSubmitting(true);
    setError('');
    setCourses(null);

    try {
      const res = await fetch('/api/access/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json() as { courses?: CourseResult[]; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? 'Алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }

      const found = data.courses ?? [];

      if (found.length === 0) {
        setCourses([]);
        return;
      }

      if (found.length === 1) {
        // Single purchase → go straight to course player
        router.push(lp(`/courses/${found[0].courseSlug}/learn`));
        return;
      }

      // Multiple purchases → show picker
      setCourses(found);
    } catch {
      setError('Холболтын алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setEmail('');
    setError('');
    setCourses(null);
  }

  return (
    <div style={{
      minHeight: '90vh', background: '#111',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          Mommy<span style={{ color: '#00B5AD' }}>Office</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '6px 0 0' }}>
          Таны хувийн сургалтын орчин
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
        padding: '4px', marginBottom: '2rem', width: '100%', maxWidth: '480px',
      }}>
        <button onClick={() => setTab('student')} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px', transition: 'all 0.15s',
          background: tab === 'student' ? '#00B5AD' : 'transparent',
          color: tab === 'student' ? '#fff' : '#6b7280',
        }}>
          📚 Сурагч
        </button>
        <button onClick={() => setTab('instructor')} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px', transition: 'all 0.15s',
          background: tab === 'instructor' ? '#6366f1' : 'transparent',
          color: tab === 'instructor' ? '#fff' : '#6b7280',
        }}>
          👩‍🏫 Багш
        </button>
      </div>

      {/* ── STUDENT TAB ── */}
      {tab === 'student' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── State: multiple courses picker ── */}
          {courses !== null && courses.length > 1 && (
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px', marginBottom: '4px' }}>
                Таны худалдан авсан сургалтууд
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '1.25rem' }}>
                {email} — нэвтрэх сургалтаа сонгоно уу
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courses.map((c) => (
                  <a
                    key={c.courseId}
                    href={lp(`/courses/${c.courseSlug}/learn`)}
                    style={{
                      display: 'block', padding: '14px 16px',
                      background: 'rgba(0,181,173,0.08)',
                      border: '1px solid rgba(0,181,173,0.25)',
                      borderRadius: '10px', textDecoration: 'none',
                      color: '#e5e5e5', fontWeight: 600, fontSize: '14px',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    🎓 {c.courseTitleMn}
                    <span style={{ fontSize: '11px', color: '#00B5AD', marginLeft: '8px', fontWeight: 400 }}>Эхлүүлэх →</span>
                  </a>
                ))}
              </div>
              <button onClick={reset} style={{
                background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                fontSize: '12px', marginTop: '1rem', textDecoration: 'underline', padding: 0,
              }}>
                ← Буцах
              </button>
            </div>
          )}

          {/* ── State: not found ── */}
          {courses !== null && courses.length === 0 && (
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '1.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '15px', marginBottom: '6px' }}>
                Худалдан авалт олдсонгүй
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1rem' }}>
                <strong style={{ color: '#e5e5e5' }}>{email}</strong> хаягт холбоотой идэвхтэй сургалт олдсонгүй.
                <br />QPay-р төлбөр хийсэн боловч и-мэйл хаяг тохирохгүй байж болно.
              </p>
              <a href="mailto:info.mommyoffice@gmail.com?subject=Хичээлд нэвтрэх тусламж" style={{
                display: 'inline-block', background: '#00B5AD', color: '#fff',
                padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 700, fontSize: '13px', marginBottom: '12px',
              }}>
                Тусламж авах →
              </a>
              <br />
              <button onClick={reset} style={{
                background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                fontSize: '12px', textDecoration: 'underline', padding: 0,
              }}>
                ← Өөр и-мэйлээр оролдох
              </button>
            </div>
          )}

          {/* ── State: email input (default) ── */}
          {courses === null && (
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '24px' }}>🎓</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Хичээлдээ нэвтрэх</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    QPay-р худалдан авахдаа ашигласан и-мэйлээ оруулна уу
                  </div>
                </div>
              </div>
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="tanii@email.com"
                  autoComplete="email"
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: '9px',
                    border: `1px solid ${error ? '#ef4444' : '#333'}`,
                    fontSize: '14px', background: '#111', color: '#e5e5e5',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button type="submit" disabled={submitting} style={{
                  background: submitting ? '#374151' : '#00B5AD',
                  color: '#fff', border: 'none',
                  padding: '11px 20px', borderRadius: '9px',
                  fontWeight: 700, fontSize: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', minWidth: '80px',
                }}>
                  {submitting ? '...' : 'Нэвтрэх →'}
                </button>
              </form>
              {error && (
                <p style={{ fontSize: '12px', color: '#f87171', margin: '6px 0 0' }}>{error}</p>
              )}
              <p style={{ fontSize: '11px', color: '#4b5563', margin: '10px 0 0', lineHeight: 1.5 }}>
                Та QPay-р сургалт худалдан авах үед ашигласан и-мэйл хаягаа оруулна уу.
                Бид таны худалдан авалтыг шууд таних болно.
              </p>
            </div>
          )}

          {/* Browse / Buy */}
          {courses === null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <ActionCard href={lp('/courses')} icon="🎓" title="Сургалтууд" desc="Бүх хичээлийг үзэх" color="#00B5AD" />
              <ActionCard href={lp('/videos')}  icon="🎬" title="Видео"       desc="Үнэгүй контент"    color="#f59e0b" />
            </div>
          )}

          {courses === null && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', paddingTop: '4px' }}>
              Асуулт байвал{' '}
              <a href="mailto:info.mommyoffice@gmail.com" style={{ color: '#00B5AD', textDecoration: 'none' }}>
                info.mommyoffice@gmail.com
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── INSTRUCTOR TAB ── */}
      {tab === 'instructor' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Багш нэвтрэх</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Зөвшөөрөгдсөн багш нарт зориулав</div>
              </div>
            </div>
            <a href={lp('/instructor/login')} style={{
              display: 'block', textAlign: 'center',
              background: '#6366f1', color: '#fff',
              padding: '12px', borderRadius: '9px',
              fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>
              Нэвтрэх →
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
            <span style={{ fontSize: '12px', color: '#4b5563' }}>эсвэл</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(0,181,173,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px',
            padding: '1.75rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '0.75rem' }}>🎓</div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px', marginBottom: '0.5rem' }}>
              MommyOffice-д багш болох
            </div>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              Таны мэдлэгийг олон мянган ээжид хүргэ. QPay-р шууд орлого олж, хичээлээ бүтээгээрэй.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              {[
                '📤 Өргөдлөө 5 минутад бөглөнө',
                '🔍 1-3 хоногт бид хянана',
                '✅ Зөвшөөрлийн имэйл ирнэ',
                '💰 QPay холбоод борлуулна',
              ].map((item) => (
                <div key={item} style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'left' }}>{item}</div>
              ))}
            </div>
            <a href={lp('/become-instructor')} style={{
              display: 'block',
              background: '#6366f1', color: '#fff',
              padding: '13px', borderRadius: '10px',
              fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            }}>
              Багш болох →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color }: {
  href: string; icon: string; title: string; desc: string; color: string;
}) {
  return (
    <a href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
        padding: '1rem', cursor: 'pointer',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '14px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{desc}</div>
        <div style={{ fontSize: '12px', color, marginTop: '8px', fontWeight: 600 }}>Үзэх →</div>
      </div>
    </a>
  );
}
