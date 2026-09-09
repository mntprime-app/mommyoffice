'use client';
/**
 * BUG-069: Secure Passwordless Email OTP (Supabase Auth)
 *
 * Two-step flow (Udemy/Stripe pattern):
 *  1. User enters email → supabase.auth.signInWithOtp() sends 6-digit code
 *  2. User enters code → supabase.auth.verifyOtp() verifies
 *  3. POST /api/access/by-email finds their purchases → redirect to player
 */
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Tab    = 'student' | 'instructor';
type Step   = 'email' | 'otp' | 'courses' | 'not-found';
type Course = { courseId: string; courseSlug: string; courseTitleMn: string };

const RESEND_WAIT = 30; // seconds before resend is allowed

export default function AccessIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const lp = (path: string) => `/${locale}${path}`;

  const [tab,        setTab]        = useState<Tab>('student');
  const [step,       setStep]       = useState<Step>('email');
  const [email,      setEmail]      = useState('');
  const [code,       setCode]       = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [resendSecs, setResendSecs] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────
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
      options: { shouldCreateUser: true },
    });
    setSubmitting(false);

    // Rate-limit error means a code was already sent — still advance to OTP step
    if (otpErr && !otpErr.message.toLowerCase().includes('rate')) {
      setError('И-мэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      return;
    }

    setStep('otp');
    setResendSecs(RESEND_WAIT);
  }

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('6 оронтой кодыг бүрэн оруулна уу');
      return;
    }
    setSubmitting(true);
    setError('');

    const supabase = createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });

    if (verifyErr) {
      setSubmitting(false);
      setError('Код буруу байна эсвэл хугацаа дууссан. Дахин код авна уу.');
      return;
    }

    // OTP valid — look up purchased courses via admin API
    try {
      const res = await fetch('/api/access/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json() as { courses?: Course[]; error?: string };
      const found = data.courses ?? [];

      if (found.length === 0) {
        setStep('not-found');
        setSubmitting(false);
        return;
      }
      if (found.length === 1) {
        // Single course — navigate directly (don't clear submitting; let nav happen)
        router.push(lp(`/courses/${found[0].courseSlug}/learn`));
        return;
      }
      // Multiple courses — show picker
      setCourses(found);
      setStep('courses');
      setSubmitting(false);
    } catch {
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
      setSubmitting(false);
    }
  }

  // ─── Resend OTP ──────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendSecs > 0 || submitting) return;
    setCode('');
    setError('');
    setSubmitting(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setSubmitting(false);
    setResendSecs(RESEND_WAIT);
  }

  function resetToEmail() {
    setStep('email');
    setCode('');
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
        display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
        padding: '4px', marginBottom: '2rem', width: '100%', maxWidth: '480px',
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

          {/* ── STEP: email ── */}
          {step === 'email' && (
            <>
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
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
                    {submitting ? 'Илгээж байна...' : 'Үргэлжлүүлэх →'}
                  </button>
                </form>
                {error && <p style={{ fontSize: '12px', color: '#f87171', margin: '8px 0 0' }}>{error}</p>}
                <p style={{ fontSize: '11px', color: '#4b5563', margin: '12px 0 0', lineHeight: 1.5 }}>
                  Та QPay-р сургалт худалдан авах үед ашигласан и-мэйл рүүгээ нэвтрэх код илгээгдэнэ.
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

          {/* ── STEP: otp ── */}
          {step === 'otp' && (
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📬</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '17px', marginBottom: '6px' }}>
                  Шуудан хайрцгаа шалгана уу
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong style={{ color: '#e5e5e5' }}>{email}</strong> хаяг руу<br />
                  6 оронтой нэвтрэх код илгээлээ
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(v);
                    setError('');
                  }}
                  placeholder="· · · · · ·"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  style={{
                    width: '100%', padding: '18px 14px', borderRadius: '9px',
                    border: `1.5px solid ${error ? '#ef4444' : '#444'}`,
                    fontSize: '32px', fontWeight: 700, letterSpacing: '0.45em',
                    background: '#111', color: '#e5e5e5', textAlign: 'center',
                    outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || code.trim().length !== 6}
                  style={{
                    background: (submitting || code.trim().length !== 6) ? '#374151' : '#00B5AD',
                    color: '#fff', border: 'none', padding: '13px',
                    borderRadius: '9px', fontWeight: 700, fontSize: '15px',
                    cursor: (submitting || code.trim().length !== 6) ? 'not-allowed' : 'pointer',
                    opacity: code.trim().length !== 6 && !submitting ? 0.65 : 1,
                  }}
                >
                  {submitting ? 'Шалгаж байна...' : 'Нэвтрэх'}
                </button>
              </form>

              {error && (
                <p style={{ fontSize: '12px', color: '#f87171', margin: '10px 0 0', textAlign: 'center' }}>{error}</p>
              )}

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
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
                    Код дахин илгээх
                  </button>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button onClick={resetToEmail} style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0,
                }}>
                  ← Өөр и-мэйл ашиглах
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: courses picker ── */}
          {step === 'courses' && (
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

          {/* ── STEP: not-found ── */}
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
                <strong style={{ color: '#e5e5e5' }}>{email}</strong> хаягт холбоотой<br />
                идэвхтэй сургалт олдсонгүй.
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
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '16px', padding: '1.75rem', textAlign: 'center',
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
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '12px', padding: '1rem', cursor: 'pointer',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '14px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{desc}</div>
        <div style={{ fontSize: '12px', color, marginTop: '8px', fontWeight: 600 }}>Үзэх →</div>
      </div>
    </a>
  );
}
