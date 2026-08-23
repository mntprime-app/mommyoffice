'use client';
import { useState } from 'react';

interface HeroMediaProps {
  coverImageUrl?: string;
  trailerUrl?: string;   // YouTube video ID
  grad: string;
  title: string;
}

export function HeroMedia({ coverImageUrl, trailerUrl, grad, title }: HeroMediaProps) {
  const [playing, setPlaying] = useState(false);

  return (
    // 16:9 — matches YouTube exactly, no letterbox, no crop on video
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      background: grad,
      borderRadius: '10px',
      overflow: 'hidden',
    }}>

      {/* ── THUMBNAIL STATE ── */}
      {!playing && (
        <>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt={title}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
              }}
            />
          )}

          {/* Play button — only when trailer exists */}
          {trailerUrl && (
            <button
              onClick={() => setPlaying(true)}
              aria-label="Трейлер үзэх"
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.65)',
                border: '2.5px solid rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '68px', height: '68px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: '3px',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                transition: 'background 0.18s, transform 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(0,181,173,0.85)';
                el.style.borderColor = '#00B5AD';
                el.style.transform = 'translate(-50%, -50%) scale(1.08)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(0,0,0,0.65)';
                el.style.borderColor = 'rgba(255,255,255,0.9)';
                el.style.transform = 'translate(-50%, -50%) scale(1)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '4px', marginTop: '-2px' }}>
                <polygon points="5,3 19,12 5,21" />
              </svg>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
                TRAILER
              </span>
            </button>
          )}
        </>
      )}

      {/* ── PLAYING STATE ── */}
      {playing && trailerUrl && (
        <>
          <iframe
            src={`https://www.youtube.com/embed/${trailerUrl}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
          <button
            onClick={() => setPlaying(false)}
            aria-label="Хаах"
            style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 10,
              background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: '15px',
            }}
          >✕</button>
        </>
      )}
    </div>
  );
}
