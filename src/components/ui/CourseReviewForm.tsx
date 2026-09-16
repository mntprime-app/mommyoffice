'use client';

/**
 * CourseReviewForm — star rating + text review submission for enrolled students.
 *
 * Non-regression: this is a brand-new file. It touches no existing component,
 * route, middleware, or CSP configuration.
 *
 * Rendered inside <SectionCard> on the course detail page only when isEnrolled=true.
 * Fetches any existing review on mount so students can update their previous rating.
 */

import { useEffect, useState } from 'react';

interface Props {
  /** Course slug — used to build the API URL */
  slug: string;
  /** Passed from the server component; the form renders only when this is true */
  isEnrolled: boolean;
}

export function CourseReviewForm({ slug, isEnrolled }: Props) {
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [text, setText]           = useState('');
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [existing, setExisting]   = useState<{ rating: number; review_text: string | null } | null>(null);
  const [fetchDone, setFetchDone] = useState(false);
  const [editing, setEditing]     = useState(false);

  // Pre-fetch any existing review this user submitted
  useEffect(() => {
    if (!isEnrolled) return;
    fetch(`/api/courses/${slug}/review`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ existing: prev }) => {
        if (prev) {
          setExisting(prev);
          setRating(prev.rating);
          setText(prev.review_text ?? '');
        }
      })
      .catch(() => {/* ignore — user just starts fresh */})
      .finally(() => setFetchDone(true));
  }, [slug, isEnrolled]);

  if (!isEnrolled) return null;
  if (!fetchDone)  return null; // Don't flash empty form before pre-fill

  // Already reviewed and not editing — show summary with edit option
  if (existing && !editing) {
    return (
      <div style={{
        background: '#111', border: '1px solid #00B5AD44',
        borderRadius: '10px', padding: '1rem 1.25rem', marginTop: '1.25rem',
      }}>
        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#00B5AD', fontWeight: 600 }}>
          Таны үнэлгээ
        </p>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ fontSize: '22px', color: s <= existing.rating ? '#f59e0b' : '#333' }}>★</span>
          ))}
        </div>
        {existing.review_text && (
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#aaa', lineHeight: 1.6 }}>
            {existing.review_text}
          </p>
        )}
        <button
          onClick={() => setEditing(true)}
          style={{
            background: 'transparent', border: '1px solid #00B5AD',
            color: '#00B5AD', borderRadius: '6px', padding: '5px 14px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          Засах
        </button>
      </div>
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      setErrorMsg('Одоор үнэлгээ сонгоно уу');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/courses/${slug}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Алдаа гарлаа. Дахин оролдоно уу.');
        setStatus('error');
        return;
      }
      setExisting({ rating, review_text: text.trim() || null });
      setEditing(false);
      setStatus('success');
    } catch {
      setErrorMsg('Сүлжээний алдаа. Дахин оролдоно уу.');
      setStatus('error');
    }
  }

  const displayRating = hovered || rating;

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #2a2a2a', paddingTop: '1.5rem' }}>
      <p style={{ margin: '0 0 0.75rem', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
        {existing ? 'Үнэлгээ засах' : 'Таны үнэлгээ'}
      </p>

      {/* Star picker */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', cursor: 'pointer' }}>
        {[1,2,3,4,5].map(s => (
          <span
            key={s}
            style={{
              fontSize: '32px',
              color: s <= displayRating ? '#f59e0b' : '#333',
              transition: 'color 0.1s',
              userSelect: 'none',
              lineHeight: 1,
            }}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            role="button"
            aria-label={`${s} од`}
          >
            ★
          </span>
        ))}
        {rating > 0 && (
          <span style={{ alignSelf: 'center', marginLeft: '8px', fontSize: '13px', color: '#aaa' }}>
            {['', 'Маш муу', 'Муу', 'Дундаж', 'Сайн', 'Маш сайн'][rating]}
          </span>
        )}
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Сэтгэгдлээ бичнэ үү... (заавал биш)"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          color: '#e5e5e5',
          padding: '0.75rem',
          fontSize: '14px',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.6,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#00B5AD'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>{text.length}/1000</span>
      </div>

      {/* Error */}
      {errorMsg && (
        <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: '#e53e3e' }}>{errorMsg}</p>
      )}

      {/* Success flash */}
      {status === 'success' && (
        <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: '#00B5AD' }}>
          Үнэлгээ амжилттай илгээгдлээ!
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          style={{
            background: status === 'loading' ? '#555' : '#00B5AD',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {status === 'loading' ? 'Илгээж байна...' : (existing ? 'Засварыг хадгалах' : 'Үнэлгээ илгээх')}
        </button>
        {editing && (
          <button
            onClick={() => { setEditing(false); setRating(existing!.rating); setText(existing!.review_text ?? ''); setErrorMsg(''); }}
            style={{
              background: 'transparent', border: '1px solid #333',
              color: '#aaa', borderRadius: '8px', padding: '10px 16px',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            Болих
          </button>
        )}
      </div>
    </div>
  );
}
