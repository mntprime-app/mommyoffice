'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getVideoComments, addVideoComment, deleteVideoComment } from '@/app/actions/videos';
import type { VideoComment } from '@/app/actions/videos';
import { createClient } from '@/lib/supabase/client';

const s = {
  section: { marginTop: '2rem', borderTop: '1px solid #2a2a2a', paddingTop: '1.5rem' } as React.CSSProperties,
  heading: { fontSize: '16px', fontWeight: 700, color: '#e5e5e5', marginBottom: '1rem' } as React.CSSProperties,
  disabled: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '13px', color: '#6b7280' } as React.CSSProperties,
  loginBox: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' as const, marginBottom: '1.25rem' } as React.CSSProperties,
  textarea: { width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', color: '#e5e5e5', fontSize: '14px', resize: 'vertical' as const, minHeight: '80px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const } as React.CSSProperties,
  submitBtn: (disabled: boolean): React.CSSProperties => ({ background: disabled ? '#374151' : '#00B5AD', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }),
  commentCard: { background: '#1a1a1a', border: '1px solid #222', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px' } as React.CSSProperties,
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#00B5AD', flexShrink: 0 } as React.CSSProperties,
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Дөнгөж сая';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цаг өмнө`;
  return `${Math.floor(diff / 86400)} өдөр өмнө`;
}

export default function VideoComments({
  videoId,
  commentsEnabled,
  locale,
}: {
  videoId: string;
  commentsEnabled: boolean;
  locale: string;
}) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    if (commentsEnabled) {
      getVideoComments(videoId).then((data) => { setComments(data); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [videoId, commentsEnabled]);

  // Disabled state
  if (!commentsEnabled) {
    return (
      <div style={s.section}>
        <div style={s.disabled}>
          💬 Энэ видеонд сэтгэгдэл бичих боломжгүй байна.
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    const { comment, error } = await addVideoComment(videoId, body.trim());
    if (error) { setSubmitError(error); setSubmitting(false); return; }
    if (comment) setComments((prev) => [comment, ...prev]);
    setBody('');
    setSubmitting(false);
    textareaRef.current?.blur();
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Сэтгэгдлийг устгах уу?')) return;
    const { error } = await deleteVideoComment(commentId);
    if (!error) setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div style={s.section}>
      <h2 style={s.heading}>💬 Сэтгэгдэл{comments.length > 0 ? ` (${comments.length})` : ''}</h2>

      {/* Auth gate / input */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Сэтгэгдлээ бичнэ үү..."
            maxLength={1000}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{body.length}/1000</span>
            <button type="submit" disabled={submitting || !body.trim()} style={s.submitBtn(submitting || !body.trim())}>
              {submitting ? 'Илгээж байна…' : 'Илгээх'}
            </button>
          </div>
          {submitError && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>⚠️ {submitError}</p>}
        </form>
      ) : (
        <div style={s.loginBox}>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
            Сэтгэгдэл бичихийн тулд нэвтрэнэ үү.
          </p>
          <Link
            href={`/${locale}/auth/login`}
            style={{ background: '#00B5AD', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '13px', flexShrink: 0 }}
          >
            Нэвтрэх →
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Уншиж байна…</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Одоохондоо сэтгэгдэл байхгүй байна. Эхний сэтгэгдлийг та бичнэ үү!</p>
      ) : (
        comments.map((c) => {
          const initials = (c.user_name || c.user_email || '?').charAt(0).toUpperCase();
          const displayName = c.user_name || c.user_email?.split('@')[0] || 'Хэрэглэгч';
          const isOwn = user?.id === c.user_id;
          return (
            <div key={c.id} style={s.commentCard}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={s.avatar}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5' }}>{displayName}</span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(c.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer', padding: '0 4px' }}
                        title="Устгах"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
