'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Tab = 'profile' | 'courses' | 'wishlist';

interface Props {
  locale: string;
  userId: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialPhone: string;
}

interface Enrollment {
  course_id: string;
  enrolled_at: string;
  expires_at: string | null;
  mo_courses: {
    id: string;
    slug: string;
    title_mn: string;
    cover_image_url: string | null;
  } | null;
}

interface VideoItem {
  id: string;
  title_mn: string;
  thumbnail_url: string | null;
  duration_text: string | null;
  category: string;
}

// --- helpers ---
function getProgress(slug: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`mo_progress_${slug}`);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { completed?: string[] };
    return Math.min(100, (data.completed?.length ?? 0) * 10);
  } catch { return 0; }
}

const TEAL = '#00B5AD';
const BG   = '#141414';
const CARD = '#1a1a1a';
const CARD2 = '#222';
const BORDER = '#2a2a2a';
const TEXT = '#e5e5e5';
const MUTED = '#888';

// ─── Avatar initials ─────────────────────────────────────────────────────────
function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      background: `linear-gradient(135deg, ${TEAL}, #0d9488)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
      boxShadow: `0 0 0 3px ${BG}, 0 0 0 5px ${TEAL}33`,
    }}>{initials}</div>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────
function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 20px', borderRadius: 24, border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
      background: active ? TEAL : 'transparent',
      color: active ? '#fff' : MUTED,
      boxShadow: active ? `0 2px 12px ${TEAL}44` : 'none',
    }}>{label}</button>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#064e3b' : '#7f1d1d',
      border: `1px solid ${ok ? '#10b981' : '#ef4444'}`,
      color: ok ? '#6ee7b7' : '#fca5a5',
      padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'fadeUp 0.2s ease',
    }}>{ok ? '✓' : '✗'} {msg}</div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function UserProfileClient({ locale, userId, email, initialFirstName, initialLastName, initialPhone }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  // personal info
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName,  setLastName]  = useState(initialLastName);
  const [phone,     setPhone]     = useState(initialPhone);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  // courses
  const [enrollments,     setEnrollments]     = useState<Enrollment[]>([]);
  const [coursesLoading,  setCoursesLoading]  = useState(false);
  const [coursesFetched,  setCoursesFetched]  = useState(false);

  // wishlist
  const [wishlistIds,    setWishlistIds]    = useState<string[]>([]);
  const [wishlistVideos, setWishlistVideos] = useState<VideoItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  // display name for avatar
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // Load courses when tab becomes active
  useEffect(() => {
    if (tab !== 'courses' || coursesFetched) return;
    setCoursesLoading(true);
    fetch(`/api/my-enrollments?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then((json: { ok: boolean; enrollments?: Enrollment[] }) => {
        setEnrollments(json.enrollments || []);
        setCoursesFetched(true);
      })
      .catch(() => setCoursesFetched(true))
      .finally(() => setCoursesLoading(false));
  }, [tab, coursesFetched, email]);

  // Load wishlist IDs from localStorage
  useEffect(() => {
    if (tab !== 'wishlist') return;
    try {
      const raw = localStorage.getItem('mo_watchlist');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setWishlistIds(ids);
      if (ids.length > 0) {
        setWishlistLoading(true);
        fetch(`/api/videos/by-ids?ids=${ids.join(',')}`)
          .then(r => r.json())
          .then((json: { ok: boolean; videos?: VideoItem[] }) => {
            setWishlistVideos(json.videos || []);
          })
          .catch(() => {})
          .finally(() => setWishlistLoading(false));
      }
    } catch {}
  }, [tab]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, phone },
    });
    setSaving(false);
    if (error) showToast('Хадгалахад алдаа гарлаа', false);
    else showToast('Мэдээлэл амжилттай хадгалагдлаа', true);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
  }

  function removeFromWishlist(id: string) {
    const next = wishlistIds.filter(x => x !== id);
    setWishlistIds(next);
    setWishlistVideos(prev => prev.filter(v => v.id !== id));
    try { localStorage.setItem('mo_watchlist', JSON.stringify(next)); } catch {}
  }

  // ── Layout shell ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Avatar name={displayName} email={email} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>
              {displayName}
            </h1>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} disabled={signingOut} style={{
          background: 'transparent', border: `1.5px solid ${BORDER}`,
          borderRadius: 8, padding: '8px 18px', fontSize: 13, color: MUTED,
          cursor: 'pointer', fontWeight: 600,
        }}>
          {signingOut ? 'Гарч байна...' : 'Гарах'}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '2rem', background: CARD, borderRadius: 32, padding: 4, width: 'fit-content', border: `1px solid ${BORDER}` }}>
        <TabPill label="👤 Хувийн мэдээлэл" active={tab === 'profile'}  onClick={() => setTab('profile')} />
        <TabPill label="🎓 Миний сургалтууд" active={tab === 'courses'}  onClick={() => setTab('courses')} />
        <TabPill label="❤️ Миний жагсаалт"   active={tab === 'wishlist'} onClick={() => setTab('wishlist')} />
      </div>

      {/* ── Tab: Personal Info ── */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 520 }}>
          <form onSubmit={handleSaveProfile}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Хувийн мэдээлэл</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Овог" value={lastName} onChange={setLastName} placeholder="Гантулга" />
                <Field label="Нэр" value={firstName} onChange={setFirstName} placeholder="Номин" />
              </div>

              <Field label="Утасны дугаар" value={phone} onChange={setPhone} placeholder="99xxxxxx" type="tel" />

              {/* Email — read only */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: '0.3px' }}>Имэйл хаяг</span>
                <div style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#111', color: '#555', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#444' }}>🔒</span> {email}
                </div>
                <span style={{ fontSize: 11, color: '#444' }}>Имэйл хаягийг өөрчлөх боломжгүй</span>
              </div>

              <button type="submit" disabled={saving} style={{
                marginTop: 4, padding: '13px', borderRadius: 8, border: 'none',
                background: saving ? '#0a6b68' : TEAL, color: '#fff',
                fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : `0 4px 20px ${TEAL}44`, transition: 'background 0.15s',
              }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: My Courses ── */}
      {tab === 'courses' && (
        <div>
          {coursesLoading ? (
            <Spinner />
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="Одоогоор бүртгэлтэй сургалт байхгүй"
              sub="Сургалтаа сонгоод суралцаж эхэлнэ үү!"
              href={`/${locale}/courses`}
              cta="Сургалтууд үзэх →"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1.25rem' }}>
              {enrollments.map((enr, i) => {
                const course = enr.mo_courses;
                if (!course) return null;
                const progress = getProgress(course.slug);
                const isLifetime = !enr.expires_at;
                return (
                  <div key={`${course.id}-${i}`} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
                    {/* Thumb */}
                    <div style={{ height: 150, background: course.cover_image_url ? `url(${course.cover_image_url}) center/cover` : `linear-gradient(135deg,${TEAL},#0d9488)`, position: 'relative' }}>
                      {!course.cover_image_url && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📖</div>
                      )}
                      <div style={{ position: 'absolute', top: 8, right: 8, background: isLifetime ? TEAL : '#f59e0b', color: '#fff', borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>
                        {isLifetime ? '∞ Lifetime' : new Date(enr.expires_at!).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 12px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.title_mn}
                      </p>

                      {/* Progress */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}>
                          <span>Явц</span>
                          <span style={{ fontWeight: 700, color: progress > 0 ? TEAL : '#555' }}>{progress}%</span>
                        </div>
                        <div style={{ height: 5, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : `linear-gradient(90deg,${TEAL},#0d9488)`, borderRadius: 3, transition: 'width 0.5s' }} />
                        </div>
                      </div>

                      <Link href={`/${locale}/courses/${course.slug}/learn`} style={{
                        display: 'block', textAlign: 'center',
                        background: progress === 0 ? TEAL : '#0d9488',
                        color: '#fff', borderRadius: 8, padding: '9px',
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      }}>
                        {progress === 0 ? 'Эхлүүлэх →' : progress === 100 ? '✅ Дуусгасан' : 'Үргэлжлүүлэн үзэх →'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Wishlist ── */}
      {tab === 'wishlist' && (
        <div>
          {wishlistLoading ? (
            <Spinner />
          ) : wishlistIds.length === 0 ? (
            <EmptyState
              icon="❤️"
              title="Жагсаалт хоосон байна"
              sub='Видео үзэх үед "+" товч дарж жагсаалтдаа нэмнэ үү'
              href={`/${locale}/videos`}
              cta="Видео үзэх →"
            />
          ) : wishlistVideos.length === 0 && !wishlistLoading ? (
            /* IDs saved but fetch returned nothing (e.g. deleted videos) */
            <EmptyState
              icon="🔍"
              title="Жагсаалтын зүйлсийг олдсонгүй"
              sub="Видео устгагдсан эсвэл олдсонгүй"
              href={`/${locale}/videos`}
              cta="Видео үзэх →"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
              {wishlistVideos.map(v => (
                <div key={v.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ height: 124, background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover` : `linear-gradient(135deg,#0d1b3e,#1a2a4a)`, position: 'relative' }}>
                    {!v.thumbnail_url && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                    )}
                    {v.duration_text && (
                      <span style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.75)', color: '#e5e5e5', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>{v.duration_text}</span>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.title_mn}
                    </p>
                    <span style={{ fontSize: 10, color: TEAL, fontWeight: 700, display: 'block', marginBottom: 8 }}>{v.category}</span>
                    <button onClick={() => removeFromWishlist(v.id)} style={{
                      width: '100%', padding: '7px', borderRadius: 7, border: `1px solid ${BORDER}`,
                      background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      ✕ Жагсаалтаас хасах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @media(max-width:640px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: '0.3px' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '12px 14px', borderRadius: 8, border: `1px solid ${BORDER}`,
          background: '#111', color: TEXT, fontSize: 14, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = TEAL)}
        onBlur={e  => (e.target.style.borderColor = BORDER)}
      />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${BORDER}`, borderTopColor: TEAL, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EmptyState({ icon, title, sub, href, cta }: { icon: string; title: string; sub: string; href: string; cta: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 52, marginBottom: '1rem' }}>{icon}</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: '1.5rem' }}>{sub}</p>
      <Link href={href} style={{ display: 'inline-block', background: TEAL, color: '#fff', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
        {cta}
      </Link>
    </div>
  );
}
