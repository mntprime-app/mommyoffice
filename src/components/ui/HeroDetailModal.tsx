'use client';
/**
 * HeroDetailModal — Netflix-style "More Info" panel for the home hero
 *
 * Design reference: Netflix "More Info" modal (studied 2026-09-08)
 *   • Floating card ~860px wide, dark backdrop rgba(0,0,0,0.75)
 *   • Top: 16:9 cover image (or muted YouTube autoplay) with:
 *       – title + badge overlaid at bottom-left (gradient vignette)
 *       – close ×  and optional mute toggle anchored top-right
 *   • Below image: primary "▶ Үзэх" white CTA button
 *   • Body: two-column — description (left 62%) · meta tags (right 38%)
 *   • ESC key and backdrop click close the modal
 *   • Body scroll is locked while modal is open
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface HeroDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  coverImage?: string;
  youtubeId?: string;
  badgeText?: string;
  primaryHref?: string;
  primaryActionText?: string;
}

export default function HeroDetailModal({
  isOpen,
  onClose,
  title,
  description,
  coverImage,
  youtubeId,
  badgeText,
  primaryHref,
  primaryActionText = 'ҮЗЭХ',
}: HeroDetailModalProps) {
  const [muted, setMuted]           = useState(true);
  const [videoActive, setVideoActive] = useState(false);

  // Delay YouTube autoplay 1s after modal opens (let animation finish first)
  useEffect(() => {
    if (!isOpen) { setVideoActive(false); return; }
    if (!youtubeId) return;
    const t = setTimeout(() => setVideoActive(true), 1000);
    return () => clearTimeout(t);
  }, [isOpen, youtubeId]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(3px)',
          animation: 'moBackdropIn 0.22s ease forwards',
        }}
      />

      {/* ── Modal card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 860px)',
          maxHeight: '92vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1001,
          background: '#181818',
          borderRadius: '12px',
          boxShadow: '0 28px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
          animation: 'moModalIn 0.32s cubic-bezier(0.32,0.72,0,1) forwards',
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}
      >
        {/* ══ TOP: cover image / YouTube section ══ */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#0a0a0a',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Static cover image — always visible, fades out when video starts */}
          {coverImage && (
            <img
              src={coverImage}
              alt={title}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                opacity: videoActive ? 0 : 1,
                transition: 'opacity 1s ease',
              }}
            />
          )}

          {/* YouTube muted autoplay — fades in after cover */}
          {youtubeId && videoActive && (
            <div style={{
              position: 'absolute', inset: 0,
              opacity: 1,
              animation: 'moFadeIn 1s ease forwards',
              pointerEvents: 'none',
            }}>
              <iframe
                key={`modal-yt-${youtubeId}`}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&modestbranding=1&iv_load_policy=3`}
                style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  transform: 'translateX(-50%) scale(1.08)',
                  transformOrigin: 'top center',
                  width: '100%', height: '100%',
                  border: 'none',
                  pointerEvents: 'none',
                }}
                allow="autoplay; fullscreen"
              />
            </div>
          )}

          {/* Gradient fallback when no image or video */}
          {!coverImage && !youtubeId && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #0a2744 70%, #061428 100%)',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                  radial-gradient(ellipse at 70% 30%, rgba(0,181,173,0.15) 0%, transparent 55%),
                  radial-gradient(ellipse at 20% 80%, rgba(255,217,61,0.08) 0%, transparent 40%)
                `,
              }} />
            </div>
          )}

          {/* Bottom vignette — title lives here */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '65%',
            background: 'linear-gradient(to top, rgba(24,24,24,1) 0%, rgba(24,24,24,0.7) 40%, transparent 100%)',
            zIndex: 2,
          }} />

          {/* Badge — top-left */}
          {badgeText && (
            <div style={{
              position: 'absolute', top: '18px', left: '20px', zIndex: 5,
              background: 'rgba(0,181,173,0.18)', border: '1px solid rgba(0,181,173,0.5)',
              color: '#00B5AD', padding: '3px 11px', borderRadius: '4px',
              fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
              backdropFilter: 'blur(6px)',
            }}>
              {badgeText}
            </div>
          )}

          {/* Title — bottom-left */}
          <h2 style={{
            position: 'absolute', bottom: '20px', left: '20px', zIndex: 3,
            margin: 0,
            fontSize: 'clamp(1.4rem, 4vw, 2.6rem)',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.5px', lineHeight: 1.1,
            textShadow: '0 4px 16px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7)',
            maxWidth: '75%',
          }}>
            {title}
          </h2>

          {/* Controls — top-right: mute + close */}
          <div style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 5,
            display: 'flex', gap: '8px',
          }}>
            {/* Mute toggle — only when video is playing */}
            {youtubeId && videoActive && (
              <button
                onClick={() => setMuted(m => !m)}
                title={muted ? 'Дуу нэмэх' : 'Дуу хаах'}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.55)',
                  background: 'rgba(20,20,20,0.6)', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)', flexShrink: 0,
                }}
              >
                {muted
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                }
              </button>
            )}

            {/* Close × */}
            <button
              onClick={onClose}
              aria-label="Хаах"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.55)',
                background: 'rgba(20,20,20,0.6)', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', flexShrink: 0,
                fontSize: '18px', fontWeight: 400, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ══ ACTION ROW ══ */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {primaryHref && (
            <Link
              href={primaryHref}
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#fff', color: '#000',
                padding: '11px 28px', borderRadius: '6px',
                fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                letterSpacing: '0.3px',
                transition: 'background 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              {primaryActionText}
            </Link>
          )}
        </div>

        {/* ══ METADATA BODY ══ */}
        <div style={{
          padding: '20px 24px 32px',
          display: 'grid',
          gridTemplateColumns: description && badgeText ? '62% 38%' : '1fr',
          gap: '1.5rem',
        }}>
          {/* Left — full description */}
          {description && (
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.75,
            }}>
              {description}
            </p>
          )}

          {/* Right — category / meta tags */}
          {badgeText && (
            <div style={{ paddingTop: '2px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                <span style={{ color: '#888', fontWeight: 600 }}>Ангилал: </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{badgeText}</span>
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                <span style={{ color: '#888', fontWeight: 600 }}>Платформ: </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>MommyOffice</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes moBackdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes moModalIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 28px)); }
          to   { opacity: 1; transform: translate(-50%, -50%);              }
        }
        @keyframes moFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        /* Custom scrollbar for the modal */
        .mo-modal-scroll::-webkit-scrollbar { width: 4px; }
        .mo-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .mo-modal-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </>
  );
}
