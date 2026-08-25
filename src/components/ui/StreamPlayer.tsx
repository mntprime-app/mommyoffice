'use client';
/**
 * StreamPlayer — Cloudflare Stream signed-URL iframe embed.
 *
 * Usage:
 *   <StreamPlayer videoId="a8765f2b3c4d..." />
 *
 * Fetches a signed JWT from /api/stream/token, then renders the CF
 * customer subdomain iframe. Raw video URL never reaches the browser —
 * only the signed token is exposed, and it expires in 4 hours.
 *
 * Domain restrictions (allow only mommyoffice.com + Vercel preview) are
 * enforced in Cloudflare Stream dashboard → video → Allowed origins.
 */

import { useEffect, useState } from 'react';

interface Props {
  videoId: string;
  autoplay?: boolean;
  className?: string;
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; token: string }
  | { status: 'error'; message: string };

const SUBDOMAIN = process.env.NEXT_PUBLIC_CF_CUSTOMER_SUBDOMAIN ?? '';

export default function StreamPlayer({ videoId, autoplay = false }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!videoId) {
      setState({ status: 'error', message: 'Video ID тохируулагдаагүй байна.' });
      return;
    }
    let cancelled = false;
    fetch(`/api/stream/token?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.token) setState({ status: 'ready', token: data.token });
        else setState({ status: 'error', message: data.error ?? 'Token алдаа' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Холболтын алдаа. Дахин оролдоно уу.' });
      });
    return () => { cancelled = true; };
  }, [videoId]);

  if (state.status === 'loading') {
    return (
      <div style={wrapStyle}>
        <div style={overlayStyle}>
          <div style={spinnerStyle} />
          <span style={{ color: '#9ca3af', fontSize: '13px', marginTop: '12px' }}>Видео ачааллаж байна...</span>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={wrapStyle}>
        <div style={overlayStyle}>
          <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</span>
          <span style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', maxWidth: '260px' }}>
            {state.message}
          </span>
        </div>
      </div>
    );
  }

  const src = SUBDOMAIN
    ? `https://customer-${SUBDOMAIN}.cloudflarestream.com/${state.token}/iframe?${autoplay ? 'autoplay=true&' : ''}controls=true&preload=metadata`
    : `https://iframe.cloudflarestream.com/${state.token}?${autoplay ? 'autoplay=true&' : ''}controls=true`;

  return (
    <div style={wrapStyle}>
      <iframe
        src={src}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  paddingBottom: '56.25%', // 16:9
  background: '#0a0a0a',
  borderRadius: '10px',
  overflow: 'hidden',
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
};

const spinnerStyle: React.CSSProperties = {
  width: '36px', height: '36px',
  border: '3px solid #2a2a2a',
  borderTopColor: '#00B5AD',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};
