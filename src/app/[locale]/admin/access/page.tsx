'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getAdminCourses,
  listAccessGrants,
  grantCourseAccess,
  revokeAccessGrant,
} from '@/app/actions/admin';

type Course = { id: number; title_mn: string; slug: string };
type Grant = {
  id: string;
  email: string;
  courseId: string;
  courseName: string;
  expiresAt: string | null;
  isLifetime: boolean;
  isExpired: boolean;
};

export default function AdminAccessPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'mn';

  // ── courses + grants data ────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  // ── form state ────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isLifetime, setIsLifetime] = useState(true);
  const [durationDays, setDurationDays] = useState('30');
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── revoke state ─────────────────────────────────────────────────────────────
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null); // id being confirmed
  const [revoking, setRevoking] = useState<string | null>(null); // id being deleted

  const reload = useCallback(async () => {
    const [c, g] = await Promise.all([getAdminCourses(), listAccessGrants()]);
    setCourses(c);
    setGrants(g);
    if (c.length > 0 && !courseId) setCourseId(String(c[0].id));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── grant submit ─────────────────────────────────────────────────────────────
  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !courseId) return;
    setSubmitting(true);
    setFormMsg(null);
    const result = await grantCourseAccess({
      email: email.trim(),
      courseId,
      durationDays: isLifetime ? null : (parseInt(durationDays, 10) || 30),
      sendEmail,
    });
    if (result.error) {
      setFormMsg({ type: 'err', text: result.error });
    } else {
      const verb = result.updated ? 'шинэчлэгдлээ' : 'нэмэгдлээ';
      setFormMsg({ type: 'ok', text: `✅ Эрх амжилттай ${verb}. ${sendEmail ? 'И-мэйл илгээгдлээ.' : ''}` });
      setEmail('');
      await reload();
    }
    setSubmitting(false);
  }

  // ── revoke ────────────────────────────────────────────────────────────────────
  async function handleRevoke(id: string) {
    setRevoking(id);
    setRevokeTarget(null);
    const result = await revokeAccessGrant(id);
    if (result.error) {
      alert(`Алдаа: ${result.error}`);
    } else {
      setGrants((prev) => prev.filter((g) => g.id !== id));
    }
    setRevoking(null);
  }

  // ── helpers ───────────────────────────────────────────────────────────────────
  function statusBadge(g: Grant) {
    if (g.isExpired) return { label: 'Дуусcан', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    if (g.isLifetime) return { label: 'Насан туршийн', bg: 'rgba(99,102,241,0.2)', color: '#a78bfa' };
    if (g.expiresAt) {
      const daysLeft = Math.ceil((new Date(g.expiresAt).getTime() - Date.now()) / 86400000);
      if (daysLeft <= 7) return { label: `${daysLeft}х өдөр`, bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    }
    return { label: 'Идэвхтэй', bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '∞';
    return new Date(iso).toLocaleDateString('mn-MN');
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem', color: '#e5e5e5' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#fff' }}>🎫 Сургалтын эрх олгох</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>
            Хэрэглэгчид гараар, дансгүйгээр сургалтын эрх нэмэх
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          style={{ color: '#00B5AD', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          ← Admin
        </Link>
      </div>

      {/* ── Grant Form ── */}
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '16px', padding: '1.75rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 1.25rem' }}>
          Шинэ эрх олгох
        </h2>

        <form onSubmit={handleGrant}>
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>И-мэйл хаяг</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Course */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Сургалт</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              style={inputStyle}
            >
              {courses.length === 0 && <option value="">Ачааллаж байна...</option>}
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.title_mn}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Хугацаа</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="duration"
                  checked={isLifetime}
                  onChange={() => setIsLifetime(true)}
                  style={{ accentColor: '#00B5AD', marginRight: '6px' }}
                />
                Насан туршийн
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="duration"
                  checked={!isLifetime}
                  onChange={() => setIsLifetime(false)}
                  style={{ accentColor: '#00B5AD', marginRight: '6px' }}
                />
                Хязгаарлагдмал —
              </label>
              {!isLifetime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    style={{ ...inputStyle, width: '80px', padding: '6px 10px' }}
                  />
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>өдрөөр</span>
                </div>
              )}
            </div>
          </div>

          {/* Send email toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#d1d5db', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#00B5AD', cursor: 'pointer' }}
              />
              Тавтай морил и-мэйл илгээх
              <span style={{ fontSize: '12px', color: '#6b7280' }}>(Brevo API-аар)</span>
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                background: submitting ? '#005f5b' : '#00B5AD',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 28px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Нэмж байна...' : '🎫 Эрх олгох'}
            </button>

            {formMsg && (
              <span style={{
                fontSize: '13px',
                color: formMsg.type === 'ok' ? '#10b981' : '#ef4444',
                fontWeight: 600,
              }}>
                {formMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Grants Table ── */}
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid #2a2a2a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
            Нийт эрхүүд
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {loading ? '...' : `${grants.length} бичлэг`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Ачааллаж байна...
          </div>
        ) : grants.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563', fontSize: '14px' }}>
            Одоохондоо эрхийн бичлэг байхгүй байна.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.2fr 1fr 88px',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              background: '#141414',
              borderBottom: '1px solid #2a2a2a',
              fontSize: '11px',
              fontWeight: 700,
              color: '#6b7280',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              <span>И-мэйл</span>
              <span>Сургалт</span>
              <span>Статус</span>
              <span>Дуусах</span>
              <span></span>
            </div>

            {/* Rows */}
            {grants.map((g, i) => {
              const badge = statusBadge(g);
              const isConfirming = revokeTarget === g.id;
              const isThisRevoking = revoking === g.id;
              return (
                <div
                  key={g.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1.2fr 1fr 88px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < grants.length - 1 ? '1px solid #1f1f1f' : 'none',
                    opacity: g.isExpired ? 0.55 : 1,
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{
                    fontSize: '13px', color: '#e5e5e5',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {g.email}
                  </span>
                  <span style={{
                    fontSize: '12px', color: '#9ca3af',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {g.courseName}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '11px', fontWeight: 700,
                    padding: '3px 9px', borderRadius: '20px',
                    background: badge.bg, color: badge.color,
                    whiteSpace: 'nowrap',
                  }}>
                    {badge.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {fmtDate(g.expiresAt)}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {isConfirming ? (
                      <>
                        <button
                          onClick={() => handleRevoke(g.id)}
                          style={{ ...dangerBtn, fontSize: '11px', padding: '4px 8px' }}
                        >
                          {isThisRevoking ? '...' : 'Тийм'}
                        </button>
                        <button
                          onClick={() => setRevokeTarget(null)}
                          style={{ ...cancelBtn, fontSize: '11px', padding: '4px 8px' }}
                        >
                          Үгүй
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setRevokeTarget(g.id)}
                        disabled={isThisRevoking}
                        title="Эрх хүчингүй болгох"
                        style={dangerBtn}
                      >
                        {isThisRevoking ? '...' : 'Цуцлах'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f0f0f',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#e5e5e5',
  padding: '10px 14px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#d1d5db',
  fontSize: '14px',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: '6px',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const cancelBtn: React.CSSProperties = {
  background: '#2a2a2a',
  color: '#9ca3af',
  border: '1px solid #333',
  borderRadius: '6px',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
