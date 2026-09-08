'use client';
/**
 * HeroDetailModal — Netflix "More Info" panel, MommyOffice edition
 *
 * Netflix reference (studied 2026-09-08, Shawshank + Tudors + Mourinho):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  [cover image / muted YouTube autoplay]      [🔊][×]│
 *   │  ────────────── gradient vignette ──────────────────│
 *   │  [Badge]   TITLE TEXT LARGE                         │
 *   ├─────────────────────────────────────────────────────┤
 *   │  [▶ Үзэх]  [+]                            [🔊 right]│
 *   ├─────────────────────────────────────────────────────┤
 *   │  Left (62%):              │  Right (38%):           │
 *   │  2026 · 45мин · [HD]      │  Ангилал: …            │
 *   │  [🔴 Хамгийн их үзэгдсэн]│  Платформ: MommyOffice │
 *   │  Full description text    │                        │
 *   ├─────────────────────────────────────────────────────┤
 *   │  Үүнтэй төстэй                                      │
 *   │  [card] [card] [card]                               │
 *   │  [card] [card] [card]                               │
 *   └─────────────────────────────────────────────────────┘
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface RelatedItem {
  id: string;
  title: string;
  href: string;
  coverImage?: string;
  youtubeId?: string;
  durationText?: string;
  description?: string;
  category?: string;
}

export interface ModalEpisode {
  id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration: string;
  /** @deprecated prefer youtube_id or cloudflare_stream_id */
  video_url: string;
  /** 'youtube' | 'cloudflare' */
  video_provider: string;
  /** 11-char YouTube video ID */
  youtube_id: string;
  /** Cloudflare Stream video UID */
  cloudflare_stream_id: string;
  thumbnail_url: string;
  description: string;
}

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
  /** e.g. "2026" */
  year?: string;
  /** e.g. "45 мин" or "3 цуврал" */
  durationText?: string;
  /** Shows red 🔴 "Хамгийн их үзэгдсэн" badge */
  isMostLiked?: boolean;
  /** "More Like This" grid — pass related videos / courses */
  relatedItems?: RelatedItem[];
  /** 'movie' | 'series' — controls episode section and CTA text */
  contentType?: string;
  /** Episodes list — shown for series content */
  episodes?: ModalEpisode[];
  /** Number of seasons — shows season selector when > 1 */
  seasonCount?: number;
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
  year,
  durationText,
  isMostLiked,
  relatedItems = [],
  contentType = 'movie',
  episodes = [],
  seasonCount = 1,
}: HeroDetailModalProps) {
  const [muted, setMuted]               = useState(true);
  const [videoActive, setVideoActive]   = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [playingEpisode, setPlayingEpisode] = useState<ModalEpisode | null>(null);

  const isSeries      = contentType === 'series';
  const hasEpisodes   = isSeries && episodes.length > 0;
  const filteredEps   = hasEpisodes
    ? (seasonCount > 1 ? episodes.filter((e) => e.season_number === selectedSeason) : episodes)
    : [];

  // Delay YouTube autoplay 1 second so modal animation finishes first
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

  const hasMetaRow  = !!(year || durationText);
  const hasRightCol = !!badgeText;
  const hasRelated  = relatedItems.length > 0;

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
          width: 'min(92vw, 860px)',
          maxHeight: '92vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1001,
          background: '#181818',
          borderRadius: '12px',
          boxShadow: '0 28px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
          animation: 'moModalIn 0.32s cubic-bezier(0.32,0.72,0,1) forwards',
        }}
      >

        {/* ══════════════════════════════════════════════════════
            1. COVER IMAGE / YOUTUBE HEADER
        ══════════════════════════════════════════════════════ */}
        <div style={{
          position: 'relative',
          width: '100%', aspectRatio: '16/9',
          background: '#0a0a0a',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Static cover — fades out when video kicks in */}
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

          {/* YouTube muted autoplay */}
          {youtubeId && videoActive && (
            <div style={{
              position: 'absolute', inset: 0,
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
                  border: 'none', pointerEvents: 'none',
                }}
                allow="autoplay; fullscreen"
              />
            </div>
          )}

          {/* Gradient fallback */}
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

          {/* Bottom gradient — title lives here */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
            background: 'linear-gradient(to top, rgba(24,24,24,1) 0%, rgba(24,24,24,0.65) 40%, transparent 100%)',
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
            fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)',
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
            {youtubeId && videoActive && (
              <button
                onClick={() => setMuted(m => !m)}
                title={muted ? 'Дуу нэмэх' : 'Дуу хаах'}
                style={circleBtn}
              >
                {muted ? <MuteIcon /> : <UnmuteIcon />}
              </button>
            )}
            <button onClick={onClose} aria-label="Хаах" style={{ ...circleBtn, fontSize: '18px', fontWeight: 400 }}>
              ×
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            2. ACTION ROW  — ▶ Үзэх  |  +  |  (right: nothing)
        ══════════════════════════════════════════════════════ */}
        <div style={{
          padding: '18px 24px 0',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {primaryHref && (
            <Link
              href={hasEpisodes ? (episodes[0]?.video_url || primaryHref) : primaryHref}
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#fff', color: '#000',
                padding: '10px 26px', borderRadius: '6px',
                fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                letterSpacing: '0.3px', flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              {hasEpisodes ? '1-р анги үзэх' : primaryActionText}
            </Link>
          )}
          {/* + Хадгалах (watchlist — visual only for now) */}
          <button
            title="Хадгалах"
            style={{
              ...circleBtn,
              width: '42px', height: '42px',
              border: '2px solid rgba(255,255,255,0.55)',
              fontSize: '22px', fontWeight: 300, lineHeight: 1,
            }}
          >
            +
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            3. METADATA + DESCRIPTION (two-column, Netflix layout)
        ══════════════════════════════════════════════════════ */}
        <div style={{
          padding: '18px 24px 0',
          display: 'grid',
          gridTemplateColumns: hasRightCol ? '62% 38%' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {/* LEFT — metadata row + badge + description */}
          <div>
            {/* Metadata row: year · duration · HD */}
            {hasMetaRow && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                flexWrap: 'wrap', marginBottom: '10px',
              }}>
                {year && (
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {year}
                  </span>
                )}
                {durationText && (
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                    {durationText}
                  </span>
                )}
                {/* HD badge */}
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.35)', borderRadius: '3px',
                  padding: '1px 5px', letterSpacing: '0.5px',
                }}>
                  HD
                </span>
              </div>
            )}

            {/* Most Liked badge */}
            {isMostLiked && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginBottom: '12px',
                fontSize: '13px', fontWeight: 700, color: '#e5e5e5',
              }}>
                <span style={{ fontSize: '16px' }}>🔴</span>
                Хамгийн их үзэгдсэн
              </div>
            )}

            {/* Full description */}
            {description && (
              <p style={{
                margin: 0,
                fontSize: '14px', color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.75,
              }}>
                {description}
              </p>
            )}
          </div>

          {/* RIGHT — category / platform meta */}
          {hasRightCol && (
            <div style={{ paddingTop: hasMetaRow ? '2px' : '0' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: '#888', fontWeight: 600 }}>Ангилал: </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{badgeText}</span>
              </p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: '#888', fontWeight: 600 }}>Платформ: </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>MommyOffice</span>
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            4. АНГИУД (Episodes) — series content only
        ══════════════════════════════════════════════════════ */}
        {hasEpisodes && (
          <div style={{ padding: '24px 24px 0' }}>
            {/* Section header + season selector */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#e5e5e5' }}>
                Ангиуд
              </h3>
              {seasonCount > 1 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  style={{
                    background: '#333', color: '#e5e5e5',
                    border: '1px solid #555', borderRadius: '6px',
                    padding: '6px 14px', fontSize: '13px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {Array.from({ length: seasonCount }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s} style={{ background: '#222' }}>Сезон {s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Inline episode player — shown when an episode row is clicked */}
            {playingEpisode && (() => {
              const src = playingEpisode.video_provider === 'cloudflare' && playingEpisode.cloudflare_stream_id
                ? `https://iframe.cloudflarestream.com/${playingEpisode.cloudflare_stream_id}?autoplay=true&controls=true`
                : playingEpisode.youtube_id
                ? `https://www.youtube-nocookie.com/embed/${playingEpisode.youtube_id}?autoplay=1&rel=0&controls=1&modestbranding=1`
                : null;
              return src ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                  <button
                    onClick={() => setPlayingEpisode(null)}
                    style={{
                      position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                      background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                      width: '32px', height: '32px', color: '#fff', fontSize: '16px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Хаах"
                  >✕</button>
                  <iframe
                    src={src}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : null;
            })()}

            {/* Episode rows — Netflix Tudors style */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredEps.map((ep, idx) => {
                return (
                  <div
                    key={ep.id}
                    onClick={() => setPlayingEpisode(ep)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '14px 0',
                      borderBottom: idx < filteredEps.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderRadius: '6px',
                    }}
                    className="mo-episode-row"
                  >
                    {/* Episode number */}
                    <div style={{
                      width: '28px', flexShrink: 0, textAlign: 'center',
                      paddingTop: '30px',
                      fontSize: '16px', fontWeight: 700, color: '#888',
                    }}>
                      {ep.episode_number}
                    </div>

                    {/* Thumbnail — 16:9 */}
                    <div style={{
                      width: '130px', flexShrink: 0,
                      aspectRatio: '16/9', borderRadius: '4px',
                      overflow: 'hidden', background: '#2a2a2a', position: 'relative',
                    }}>
                      {ep.thumbnail_url ? (
                        <img
                          src={ep.thumbnail_url}
                          alt={ep.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(135deg,#1a1a2e,#0d2137)',
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#e5e5e5', lineHeight: 1.3 }}>
                          {ep.title}
                        </p>
                        {ep.duration && (
                          <span style={{ fontSize: '13px', color: '#888', flexShrink: 0, paddingTop: '1px' }}>
                            {ep.duration}
                          </span>
                        )}
                      </div>
                      {ep.description && (
                        <p style={{
                          margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)',
                          lineHeight: 1.55,
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {ep.description}
                        </p>
                      )}
                      {/* Provider badge */}
                      <div style={{ marginTop: '6px' }}>
                        {ep.video_provider === 'cloudflare' ? (
                          <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>🔐 Premium</span>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#00B5AD', fontWeight: 600 }}>▶ Үнэгүй</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. "ҮҮНТЭЙ ТӨСТЭЙ"  (More Like This)
        ══════════════════════════════════════════════════════ */}
        {hasRelated && (
          <div style={{ padding: '28px 24px 32px' }}>
            {/* Section heading */}
            <h3 style={{
              margin: '0 0 16px',
              fontSize: '20px', fontWeight: 700, color: '#e5e5e5',
              letterSpacing: '-0.3px',
            }}>
              Үүнтэй төстэй
            </h3>

            {/* 3-column grid — matches Netflix "More Like This" card grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}>
              {relatedItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="mo-related-card"
                    style={{
                      background: '#2a2a2a',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'transform 0.18s',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      position: 'relative',
                      width: '100%', aspectRatio: '16/9',
                      background: '#1a1a1a', overflow: 'hidden',
                    }}>
                      {(item.coverImage || item.youtubeId) ? (
                        <img
                          src={item.coverImage || `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                          alt={item.title}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', display: 'block',
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(135deg,#1a1a2e,#0d2137)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2rem',
                        }}>
                          🎬
                        </div>
                      )}
                      {/* Duration badge — top-right overlay (Netflix pattern) */}
                      {item.durationText && (
                        <span style={{
                          position: 'absolute', top: '6px', right: '6px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#e5e5e5', fontSize: '11px', fontWeight: 600,
                          padding: '2px 6px', borderRadius: '3px',
                          backdropFilter: 'blur(4px)',
                        }}>
                          {item.durationText}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '10px 12px 12px' }}>
                      {/* Category tag + HD badge — Netflix quality row */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginBottom: '6px', flexWrap: 'wrap',
                      }}>
                        {item.category && (
                          <span style={{
                            fontSize: '9px', fontWeight: 700, color: '#00B5AD',
                            border: '1px solid rgba(0,181,173,0.35)',
                            padding: '1px 5px', borderRadius: '3px',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>
                            {item.category}
                          </span>
                        )}
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          color: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          padding: '1px 4px', borderRadius: '2px',
                        }}>
                          HD
                        </span>
                      </div>

                      {/* Title */}
                      <p style={{
                        margin: '0 0 5px',
                        fontSize: '12px', fontWeight: 700, color: '#e5e5e5',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.title}
                      </p>

                      {/* Description */}
                      {item.description && (
                        <p style={{
                          margin: 0,
                          fontSize: '11px', color: 'rgba(255,255,255,0.45)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding when no related items */}
        {!hasRelated && <div style={{ height: '28px' }} />}
      </div>

      {/* ── Keyframes + hover styles ── */}
      <style>{`
        @keyframes moBackdropIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes moModalIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 32px)); }
          to   { opacity: 1; transform: translate(-50%, -50%);              }
        }
        @keyframes moFadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        .mo-related-card:hover { transform: scale(1.03); }
        .mo-episode-row:hover { background: rgba(255,255,255,0.04); border-radius: 6px; }
        @media (max-width: 600px) {
          .mo-related-card { border-radius: 6px; }
        }
      `}</style>
    </>
  );
}

/* ── Shared icon components ── */
const circleBtn: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.55)',
  background: 'rgba(20,20,20,0.65)', color: '#fff',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)', flexShrink: 0,
};

function MuteIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>;
}
function UnmuteIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>;
}
