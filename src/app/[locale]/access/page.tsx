'use client';
/**
 * BUG-069 (rev 2): Magic Link flow — Supabase default sends a clickable link,
 * not a numeric OTP, unless custom SMTP + custom template is configured.
 *
 * Flow:
 *  1. User enters email → signInWithOtp() → Supabase sends "Sign in" link
 *  2. UI shows "check inbox and click the link"
 *  3. User clicks link → Supabase redirects back here with session in URL hash
 *  4. onAuthStateChange fires SIGNED_IN → query mo_access_tokens → redirect to course
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Tab    = 'student' | 'instructor';
type Step   = 'email' | 'waiting' | 'courses' | 'not-found' | 'loading';
type Course = { courseId: string; courseSlug: string; courseTitleMn: string };

const RESEND_WAIT = 60;

export default function AccessIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const lp = (path: string) => `/${locale}${path}`;

  const [tab,        setTab]        = useState<Tab>('student');
  const [step,       setStep]       = useState<Step>('email');
  const [email,      setEmail]      = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [resendSecs, setResendSecs] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  // ── After magic link click: user returns here with session in URL hash ───
  const handleVerified = useCallback(async (userEmail: string) => {
    setStep('loading');
    try {
      const res = await fetch('/api/access/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail.toLowerCase().trim() }),
      });
      const data = await res.json() as { courses?: Course[] };
      const found = data.courses ?? [];
      if (found.length === 0) { setStep('not-found'); return; }
      if (found.length === 1) {
        router.push(lp(`/courses/${found[0].courseSlug}/learn`));
        return;
      }
      setCourses(found);
      setStep('courses');
    } catch {
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
      setStep('email');
    }
  }, [router, lp]);

  // Listen for Supabase auth state — fires when magic link is clicked
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          await handleVerified(session.user.email);
        }
      }
    );
    // Also check if already signed in on mount (page reload after magic link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        handleVerified(session.user.email).catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, [handleVerified]);

  // ── Step 1: Send magic link ───────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('И-мэйл хаягаа зөв оруулна уу');
      return;
    }
    setSubmitting(true);
    setError('');
    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.href,
      },
    });
    setSubmitting(false);
    if (otpErr && !otpErr.message.toLowerCase().includes('rate')) {
      setError('И-мэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      return;
    }
    setStep('waiting');
    setResendSecs(RESEND_WAIT);
  }

  async function handleResend() {
    if (resendSecs > 0 || submitting) return;
    setError('');
    setSubmitting(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.href },
    });
    setSubmitting(false);
    setResendSecs(RESEND_WAIT);
  }

  function resetToEmail() {
    setStep('email');
    setError('');
    setCourses([]);
    setResendSecs(0);
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
        display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '12px', padding: '4px', marginBottom: '2rem',
        width: '100%', maxWidth: '480px',
      }}>
        <button onClick={() => { setTab('student'); resetToEmail(); }} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px',
          background: tab === 'student' ? '#00B5AD' : 'transparent',
          color: tab === 'student' ? '#fff' : '#6b7280',
        }}>📚 Сурагч</button>
        <button onClick={() => setTab('instructor')} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px',
          background: tab === 'instructor' ? '#6366f1' : 'transparent',
          color: tab === 'instructor' ? '#fff' : '#6b7280',
        }}>👩‍🏫 Багш</button>
      </div>

      {/* ══════════════ STUDENT TAB ══════════════ */}
      {tab === 'student' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Loading ── */}
          {step === 'loading' && (
            <div style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '2.5rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <div style={{ color: '#e5e5e5', fontWeight: 700 }}>Сургалт хайж байна...</div>
            </div>
          )}

          {/* ── Email entry ── */}
          {step === 'email' && (
            <>
              <div style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: '16px', padding: '1.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '24px' }}>🎓</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Хичээлдээ нэвтрэх</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      QPay-р худалдан авахдаа ашигласан и-мэйлээ оруулна уу
                    </div>
                  </div>
                </div>
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="tanii@email.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '13px 14px', borderRadius: '9px',
                      border: `1px solid ${error ? '#ef4444' : '#333'}`,
                      fontSize: '15px', background: '#111', color: '#e5e5e5',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <button type="submit" disabled={submitting} style={{
                    background: submitting ? '#374151' : '#00B5AD',
                    color: '#fff', border: 'none', padding: '13px',
                    borderRadius: '9px', fontWeight: 700, fontSize: '15px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}>
                    {submitting ? 'Илгээж байна...' : 'Нэвтрэх холбоос авах →'}
                  </button>
                </form>
                {error && <p style={{ fontSize: '12px', color: '#f87171', margin: '8px 0 0' }}>{error}</p>}
                <p style={{ fontSize: '11px', color: '#4b5563', margin: '12px 0 0', lineHeight: 1.5 }}>
                  Таны и-мэйл рүү нэвтрэх холбоос илгээгдэнэ. Холбоосыг дарж хичээлдээ нэвтэрнэ.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <ActionCard href={lp('/courses')} icon="🎓" title="Сургалтууд" desc="Бүх хичээлийг үзэх" color="#00B5AD" />
                <ActionCard href={lp('/videos')}  icon="🎬" title="Видео"       desc="Үнэгүй контент"    color="#f59e0b" />
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563' }}>
                Асуулт байвал{' '}
                <a href="mailto:info.mommyoffice@gmail.com" style={{ color: '#00B5AD', textDecoration: 'none' }}>
                  info.mommyoffice@gmail.com
                </a>
              </div>
            </>
          )}

          {/* ── Waiting for magic link click ── */}
          {step === 'waiting' && (
            <div style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '1.75rem',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📬</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '17px', marginBottom: '8px' }}>
                  Шуудан хайрцгаа шалгана уу
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.7 }}>
                  <strong style={{ color: '#e5e5e5' }}>{email}</strong> хаяг руу<br />
                  нэвтрэх холбоос илгээлээ
                </div>
              </div>

              {/* Visual step guide */}
              <div style={{
                background: 'rgba(0,181,173,0.06)', border: '1px solid rgba(0,181,173,0.2)',
                borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem',
              }}>
                {[
                  { n: '1', text: 'И-мэйл хайрцгаа нээнэ үү' },
                  { n: '2', text: '"Supabase Auth" илгээсэн и-мэйлийг олно уу' },
                  { n: '3', text: '"Sign in" товч дарна уу' },
                  { n: '4', text: 'Энэ хуудас руу автоматаар буцна' },
                ].map(({ n, text }) => (
                  <div key={n} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 0',
                    borderBottom: n !== '4' ? '1px solid rgba(0,181,173,0.1)' : 'none',
                  }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: '#00B5AD', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}>{n}</span>
                    <span style={{ fontSize: '13px', color: '#d1d5db' }}>{text}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                {resendSecs > 0 ? (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Дахин илгээх — {resendSecs}с
                  </span>
                ) : (
                  <button onClick={handleResend} disabled={submitting} style={{
                    background: 'none', border: 'none', color: '#00B5AD',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    textDecoration: 'underline', padding: 0,
                  }}>
                    Холбоос дахин илгээх
                  </button>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={resetToEmail} style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0,
                }}>
                  ← Өөр и-мэйл ашиглах
                </button>
              </div>
            </div>
          )}

          {/* ── Course picker ── */}
          {step === 'courses' && (
            <div style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '16px', padding: '1.75rem',
            }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px', marginBottom: '4px' }}>
                Таны худалдан авсан сургалтууд
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '1.25rem' }}>
                Нэвтрэх сургалтаа сонгоно уу
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
                    }}
                  >
                    🎓 {c.courseTitleMn}
                    <span style={{ fontSize: '11px', color: '#00B5AD', marginLeft: '8px', fontWeight: 400 }}>
                      Эхлүүлэх →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Not found ── */}
          {step === 'not-found' && (
            <div style={{
              background: '#1a1a1a', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '16px', padding: '1.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '15px', marginBottom: '6px' }}>
                Худалдан авалт олдсонгүй
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1rem' }}>
                Энэ и-мэйлд холбоотой идэвхтэй сургалт олдсонгүй.
              </p>
              <a
                href="mailto:info.mommyoffice@gmail.com?subject=Хичээлд нэвтрэх тусламж"
                style={{
                  display: 'inline-block', background: '#00B5AD', color: '#fff',
                  padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
                  fontWeight: 700, fontSize: '13px', marginBottom: '12px',
                }}
              >
                Тусламж авах →
              </a>
              <br />
              <button onClick={resetToEmail} style={{
                background: 'none', border: 'none', color: '#6b7280',
                cursor: 'pointer', fontSize: '12px', textDecoration: 'underline',
                padding: 0, marginTop: '8px',
              }}>
                ← Буцах
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ INSTRUCTOR TAB ══════════════ */}
      {tab === 'instructor' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '16px', padding: '1.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Багш нэвтрэх</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Зөвшөөрөгдсөн багш нарт зориулав</div>
              </div>
            </div>
            <a href={lp('/instructor/login')} style={{
              display: 'block', textAlign: 'center',
              background: '#6366f1', color: '#fff', padding: '12px',
              borderRadius: '9px', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>
              Нэвтрэх →
            </a>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(0,181,173,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '16px', padding: '1.75rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '0.75rem' }}>🎓</div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px', marginBottom: '0.5rem' }}>
              MommyOffice-д багш болох
            </div>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              Таны мэдлэгийг олон мянган ээжид хүргэ.
            </p>
            <a href={lp('/become-instructor')} style={{
              display: 'block', background: '#6366f1', color: '#fff',
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
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '12px', padding: '1rem',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '14px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{desc}</div>
        <div style={{ fontSize: '12px', color, marginTop: '8px', fontWeight: 600 }}>Үзэх →</div>
      </div>
    </a>
  );
}
