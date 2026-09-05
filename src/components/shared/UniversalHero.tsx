'use client';
/**
 * UniversalHero — MommyOffice platform-wide hero standard
 *
 * Desktop architecture (≥768px) — unchanged from commit f2e2560:
 *  Layer 1: Cover image — objectFit:cover, objectPosition:center top
 *  Layer 2: Optional muted autoplay iframe — scale(1.35), transformOrigin:top center, 2.5s delay
 *  Layer 3: Asymmetric vignette
 *  Layer 4: Badge + title + description + CTA buttons (bottom-left overlay)
 *
 * Mobile architecture (<768px) — Option A overlay (260px landscape card):
 *  - Category badge as text ABOVE the card
 *  - Hero card: 260px fixed height, static poster ONLY — no autoplay, no iframe
 *  - Corner badge anchored to top-right INSIDE card
 *  - Strong vignette (rgba 0→0.92, 70% height) at bottom of card
 *  - Title (15px, w800, 2-line clamp) + CTA buttons overlaid inside card at bottom
 *
 * Height standard (desktop):  clamp(580px, 68vh, 780px)
 * Mobile card height:          260px fixed
 * Grid standard:               maxWidth 1400px · margin 0 auto · padding 12px 2rem 0
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface UniversalHeroProps {
  /** Small label chip — rendered as text above card on mobile, badge inside card on desktop */
  badgeText?: string;
  /** Main headline */
  title: string;
  /** Subtitle / description (max 2-3 lines shown) */
  description?: string;
  /** Full-bleed background image URL. Falls back to dark gradient if empty. */
  coverImage?: string;
  /** YouTube video ID. If provided, muted autoplay fades in after 2.5s (desktop only). */
  youtubeId?: string;
  /** Primary CTA button label */
  primaryActionText?: string;
  /** If set, primary CTA renders as a <Link> */
  primaryHref?: string;
  /** If set, primary CTA fires this callback */
  onPrimaryClick?: () => void;
  /** Secondary CTA button label */
  secondaryActionText?: string;
  /** If set, secondary CTA renders as a <Link> */
  secondaryHref?: string;
  /** If set, secondary CTA fires this callback */
  onSecondaryClick?: () => void;
  /** Bottom-right corner badge on desktop; top-right inside card on mobile */
  cornerBadge?: string;
  /** Background gradient fallback (CSS value) */
  fallbackGradient?: string;
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #0a2744 70%, #061428 100%)';

export default function UniversalHero({
  badgeText,
  title,
  description,
  coverImage,
  youtubeId,
  primaryActionText = 'ҮЗЭХ',
  primaryHref,
  onPrimaryClick,
  secondaryActionText = 'ДЭЛГЭРЭНГҮЙ',
  secondaryHref,
  onSecondaryClick,
  cornerBadge,
  fallbackGradient = DEFAULT_GRADIENT,
}: UniversalHeroProps) {
  const [videoActive, setVideoActive] = useState(false);
  const [muted, setMuted]             = useState(true);
  const [isMobile, setIsMobile]       = useState(false);

  // Detect mobile — used to suppress autoplay timer on mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 2.5s delayed autoplay — desktop only, never on mobile
  useEffect(() => {
    setVideoActive(false);
    if (!youtubeId || isMobile) return;
    const t = setTimeout(() => setVideoActive(true), 2500);
    return () => clearTimeout(t);
  }, [youtubeId, isMobile]);

  // ── Shared icon SVGs ──────────────────────────────────────────────────────
  const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
  );
  const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (<768px) — Option A overlay (260px landscape card)
          Category badge ABOVE card. Title + CTA buttons overlaid INSIDE card.
          CSS class mo-hero-mobile: display:none on desktop, block on mobile.
      ══════════════════════════════════════════════════════════════════════ */}
      {/* ══ MOBILE HERO (<768px) — BUG-048: Pure image card, zero text overlay ══
          A. Pure poster card — image ONLY, no vignette, no text, no buttons
          B. External metadata stack — badge + title + description BELOW image
          C. Full-width stacked buttons — completely outside/below the image card
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mo-hero-mobile" style={{ background: '#141414', padding: '12px 1rem 0' }}>

        {/* A. PURE POSTER CARD — image only, zero overlay content */}
        <div style={{
          position: 'relative', width: '100%', height: '240px',
          borderRadius: '14px', overflow: 'hidden', background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
              }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: fallbackGradient }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(ellipse at 75% 35%, rgba(0,181,173,0.12) 0%, transparent 55%), radial-gradient(ellipse at 15% 75%, rgba(255,217,61,0.06) 0%, transparent 45%)`,
              }} />
            </div>
          )}
          {/* Corner badge — only non-text element allowed inside card */}
          {cornerBadge && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 5,
              background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#e5e5e5', padding: '3px 9px', borderRadius: '20px',
              fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)',
            }}>
              {cornerBadge}
            </div>
          )}
        </div>

        {/* B. EXTERNAL TEXT & METADATA — below image, never overlaid */}
        <div style={{ padding: '10px 2px 0' }}>
          {badgeText && (
            <p style={{
              fontSize: '10px', fontWeight: 700, color: '#00B5AD',
              letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px',
            }}>
              {badgeText}
            </p>
          )}
          <h1 style={{
            fontSize: '20px', fontWeight: 900, lineHeight: 1.2,
            color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </h1>
          {description && (
            <p style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.5)',
              margin: 0, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {description}
            </p>
          )}
        </div>

        {/* C. FULL-WIDTH STACKED ACTION BUTTONS — completely below text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', paddingBottom: '4px' }}>
          {primaryHref ? (
            <Link href={primaryHref} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              background: '#fff', color: '#000',
              padding: '11px 16px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>
              <PlayIcon /> {primaryActionText}
            </Link>
          ) : onPrimaryClick ? (
            <button onClick={onPrimaryClick} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              background: '#fff', color: '#000',
              padding: '11px 16px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
            }}>
              <PlayIcon /> {primaryActionText}
            </button>
          ) : null}

          {secondaryHref ? (
            <Link href={secondaryHref} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              background: 'rgba(30,30,30,0.9)', color: '#fff',
              padding: '11px 16px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <InfoIcon /> {secondaryActionText}
            </Link>
          ) : onSecondaryClick ? (
            <button onClick={onSecondaryClick} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              background: 'rgba(30,30,30,0.9)', color: '#fff',
              padding: '11px 16px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
            }}>
              <InfoIcon /> {secondaryActionText}
            </button>
          ) : null}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (≥768px) — full cinematic hero, unchanged
          CSS class mo-hero-desktop: display:block on desktop, none on mobile.
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mo-hero-desktop" style={{ background: '#141414' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 2rem 0' }}>
          <section style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(580px, 68vh, 780px)',
            overflow: 'hidden',
            background: '#0a0a0a',
            borderRadius: '24px',
          }}>

            {/* Layer 1: Cover image — ALWAYS visible */}
            {coverImage ? (
              <img
                src={coverImage}
                alt={title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center top',
                }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: fallbackGradient }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `radial-gradient(ellipse at 75% 35%, rgba(0,181,173,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 75%, rgba(255,217,61,0.06) 0%, transparent 45%)`,
                }} />
              </div>
            )}

            {/* Layer 2: Muted autoplay iframe (desktop only) */}
            {/* scale(1.35) + transformOrigin:top center — no pillarbox, no head clipping */}
            {youtubeId && !isMobile && (
              <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                opacity: videoActive ? 1 : 0,
                transition: 'opacity 1s ease',
                pointerEvents: 'none',
              }}>
                <iframe
                  key={`hero-bg-${youtubeId}`}
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
                  style={{
                    position: 'absolute',
                    top: 0, left: '50%',
                    transform: 'translateX(-50%) scale(1.35)',
                    transformOrigin: 'top center',
                    width: '100%', height: '100%',
                    border: 'none', pointerEvents: 'none',
                  }}
                  allow="autoplay; fullscreen"
                />
              </div>
            )}

            {/* Layer 3: Asymmetric vignette */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 55%, transparent 72%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%', zIndex: 1,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
            }} />

            {/* TOP-LEFT: badge */}
            {badgeText && (
              <div style={{
                position: 'absolute', top: '24px', left: '24px', zIndex: 5,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,181,173,0.18)', border: '1px solid rgba(0,181,173,0.45)',
                color: '#00B5AD', padding: '4px 12px', borderRadius: '4px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
                backdropFilter: 'blur(6px)',
              }}>
                {badgeText}
              </div>
            )}

            {/* TOP-RIGHT: mute toggle (only when autoplay is live) */}
            {youtubeId && videoActive && !isMobile && (
              <button
                onClick={() => setMuted(m => !m)}
                style={{
                  position: 'absolute', top: '24px', right: '24px',
                  width: '42px', height: '42px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.6)',
                  background: 'rgba(0,0,0,0.4)', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5, backdropFilter: 'blur(8px)',
                }}
                title={muted ? 'Дуу нэмэх' : 'Дуу хаах'}
              >
                {muted
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                }
              </button>
            )}

            {/* BOTTOM-LEFT: title + description + CTAs */}
            <div style={{
              position: 'absolute', bottom: '32px', left: '32px',
              maxWidth: '560px', zIndex: 2,
            }}>
              <h1 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', fontWeight: 800,
                lineHeight: 1.15, color: '#fff',
                marginBottom: '0.5rem', letterSpacing: '-0.5px',
                textShadow: '0 4px 12px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.7)',
              }}>
                {title}
              </h1>
              {description && (
                <p style={{
                  fontSize: '14px', color: '#fff', lineHeight: 1.6,
                  marginBottom: '1.25rem', maxWidth: '440px',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                }}>
                  {description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Primary CTA */}
                {primaryHref ? (
                  <Link href={primaryHref} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#fff', color: '#000',
                    padding: '12px 30px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    {primaryActionText}
                  </Link>
                ) : onPrimaryClick ? (
                  <button onClick={onPrimaryClick} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#fff', color: '#000',
                    padding: '12px 30px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    {primaryActionText}
                  </button>
                ) : null}

                {/* Secondary CTA */}
                {secondaryHref ? (
                  <Link href={secondaryHref} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(109,109,110,0.45)', color: '#fff',
                    padding: '12px 30px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    {secondaryActionText}
                  </Link>
                ) : onSecondaryClick ? (
                  <button onClick={onSecondaryClick} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(109,109,110,0.45)', color: '#fff',
                    padding: '12px 30px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    {secondaryActionText}
                  </button>
                ) : null}
              </div>
            </div>

            {/* BOTTOM-RIGHT: corner badge */}
            {cornerBadge && (
              <div style={{
                position: 'absolute', bottom: '32px', right: '24px', zIndex: 2,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#e5e5e5', padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)',
              }}>
                {cornerBadge}
              </div>
            )}

          </section>
        </div>
      </div>

      {/* ── Media query switcher — CSS-based, zero hydration flash ── */}
      <style>{`
        .mo-hero-mobile  { display: none;  }
        .mo-hero-desktop { display: block; }
        @media (max-width: 767px) {
          .mo-hero-mobile  { display: block; }
          .mo-hero-desktop { display: none;  }
        }
      `}</style>
    </>
  );
}
