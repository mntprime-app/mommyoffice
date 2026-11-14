'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

type Ad = {
  id: string; slot: string; title: string | null;
  target_url: string; media_url: string;
  media_type: 'image' | 'video'; mobile_image_url: string | null;
};

const POPUP_SESSION_KEY  = 'mo_homePopupSeen';
const BANNER_SESSION_KEY = 'mo_homeBannerHidden';
const POPUP_DURATION_MS  = 8000;

// ── Mosaic tile grid config ────────────────────────────────────────────────────
const COLS_D = 8,  ROWS_D = 4;   // desktop grid
const COLS_M = 4,  ROWS_M = 3;   // mobile grid
const STAGGER   = 52;             // ms between diagonal steps
const TILE_DUR  = 260;            // ms per tile flip animation
const TILE_CLR  = '#06060f';      // tile fill — dark navy, matches site bg

function totalMs(cols: number, rows: number) {
  return (cols + rows - 2) * STAGGER + TILE_DUR;
}

type TilePhase = 'entering' | 'active' | 'exiting';

export default function HomeHeroAdBanner() {
  const [popupAd,   setPopupAd]   = useState<Ad | null | 'loading'>('loading');
  const [bannerAd,  setBannerAd]  = useState<Ad | null | 'loading'>('loading');
  const [isMobile,  setIsMobile]  = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [scrimIn,   setScrimIn]   = useState(false);
  const [tilePhase, setTilePhase] = useState<TilePhase>('entering');
  const [showBanner, setShowBanner] = useState(false);
  const [countdown,  setCountdown]  = useState(8);
  const closingRef = useRef(false);

  // ── Mobile detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Fetch popup ad ─────────────────────────────────────────────────────────
  useEffect(() => {
    let c = false;
    fetch('/api/ads/home_popup')
      .then(r => r.json()).then(({ ad }) => { if (!c) setPopupAd(ad ?? null); })
      .catch(() => { if (!c) setPopupAd(null); });
    return () => { c = true; };
  }, []);

  // ── Fetch inline banner ────────────────────────────────────────────────────
  useEffect(() => {
    let c = false;
    fetch('/api/ads/home_below_hero')
      .then(r => r.json()).then(({ ad }) => { if (!c) setBannerAd(ad ?? null); })
      .catch(() => { if (!c) setBannerAd(null); });
    return () => { c = true; };
  }, []);

  // ── Activate popup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (popupAd === 'loading' || !popupAd) return;
    if (!popupAd.media_url?.startsWith('http')) return;
    const hasMedia = popupAd.media_type === 'image' ||
      (popupAd.media_type === 'video' && (!isMobile || !!popupAd.mobile_image_url));
    if (!hasMedia || sessionStorage.getItem(POPUP_SESSION_KEY)) return;

    // 1. Mount DOM (tiles are covering the image — no animation yet)
    setTilePhase('entering');
    setScrimIn(false);
    setShowPopup(true);

    // 2. After 2 frames: start tile-reveal wave + fade scrim in
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setScrimIn(true);
        // tilePhase stays 'entering' — triggers mo-tile-reveal on each tile
        // After all tiles have revealed, switch to 'active' (remove tiles from DOM)
        const cols = window.innerWidth < 768 ? COLS_M : COLS_D;
        const rows = window.innerWidth < 768 ? ROWS_M : ROWS_D;
        setTimeout(() => setTilePhase('active'), totalMs(cols, rows));
      })
    );
  }, [popupAd, isMobile]);

  // ── Activate inline banner ─────────────────────────────────────────────────
  useEffect(() => {
    if (bannerAd === 'loading' || !bannerAd) return;
    if (!bannerAd.media_url?.startsWith('http')) return;
    const hasMedia = bannerAd.media_type === 'image' ||
      (bannerAd.media_type === 'video' && (!isMobile || !!bannerAd.mobile_image_url));
    if (!hasMedia || sessionStorage.getItem(BANNER_SESSION_KEY)) return;
    setShowBanner(true);
  }, [bannerAd, isMobile]);

  // ── 8-second auto-dismiss + countdown ─────────────────────────────────────
  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => dismissPopup(), POPUP_DURATION_MS);
    const i = setInterval(() => setCountdown(c => c > 1 ? c - 1 : c), 1000);
    return () => { clearTimeout(t); clearInterval(i); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup]);

  // ── Dismiss: play exit mosaic then unmount ─────────────────────────────────
  const dismissPopup = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setScrimIn(false);
    setTilePhase('exiting'); // triggers mo-tile-cover wave

    const cols = window.innerWidth < 768 ? COLS_M : COLS_D;
    const rows = window.innerWidth < 768 ? ROWS_M : ROWS_D;
    setTimeout(() => {
      sessionStorage.setItem(POPUP_SESSION_KEY, '1');
      setShowPopup(false);
      closingRef.current = false;
    }, totalMs(cols, rows) + 80); // +80ms safety buffer
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_SESSION_KEY, '1');
    setShowBanner(false);
  }, []);

  if (!showPopup && !showBanner) return null;

  // ── Tile grid ──────────────────────────────────────────────────────────────
  // Memoised so the array doesn't recreate on every render
  // Key includes tilePhase so React remounts tiles when phase changes
  // (required to restart the CSS animation on the same element)
  const cols = isMobile ? COLS_M : COLS_D;
  const rows = isMobile ? ROWS_M : ROWS_D;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tiles = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Enter wave: top-left → bottom-right
        const entryDelay = (c + r) * STAGGER;
        // Exit wave: bottom-right → top-left (reverse diagonal)
        const exitDelay  = ((cols - 1 - c) + (rows - 1 - r)) * STAGGER;
        out.push({ r, c, entryDelay, exitDelay });
      }
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows]);

  // ── Media helper ───────────────────────────────────────────────────────────
  const AdMedia = ({ ad, style }: { ad: Ad; style?: React.CSSProperties }) => {
    const useVid = ad.media_type === 'video' && !isMobile;
    const src    = isMobile && ad.mobile_image_url ? ad.mobile_image_url : ad.media_url;
    return useVid
      ? <video src={ad.media_url} autoPlay muted loop playsInline
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...style }} />
      // eslint-disable-next-line @next/next/no-img-element
      : <img src={src} alt={ad.title ?? 'Сурталчилгаа'} loading="eager"
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...style }} />;
  };

  const NAV_H = isMobile ? 60 : 72;
  const isActive = tilePhase === 'active'; // tiles removed from DOM when fully revealed

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          POP-UP BANNER — mosaic tile grid reveal / cover animation
      ══════════════════════════════════════════════════════════════════ */}
      {showPopup && popupAd && popupAd !== 'loading' && (
        <div
          onClick={e => { if (e.target === e.currentTarget) dismissPopup(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background:    scrimIn ? 'rgba(4,4,14,0.65)' : 'rgba(4,4,14,0)',
            backdropFilter:       scrimIn ? 'blur(6px) saturate(0.6)' : 'blur(0px) saturate(1)',
            WebkitBackdropFilter: scrimIn ? 'blur(6px) saturate(0.6)' : 'blur(0px) saturate(1)',
            transition: 'background 500ms ease, backdrop-filter 500ms ease',
            padding: isMobile
              ? `${NAV_H + 6}px 10px 10px`
              : `${NAV_H + 14}px 1.5rem 1.5rem`,
          }}
        >
          {/* Card — static; the mosaic IS the animation (no card transform) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: isMobile ? '100%' : '1400px',
              borderRadius: isMobile ? '10px' : '14px',
              overflow: 'hidden',
              boxShadow: scrimIn
                ? '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 0 0 rgba(0,0,0,0)',
              transition: 'box-shadow 500ms ease',
              background: TILE_CLR,
            }}
          >
            {/* ── Ad media (image or video) ─────────────────────────── */}
            {popupAd.target_url?.trim() ? (
              <a href={popupAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={popupAd.title ?? undefined}
                style={{ display:'block', aspectRatio: isMobile ? '4/3' : '21/8' }}>
                <AdMedia ad={popupAd} />
              </a>
            ) : (
              <div style={{ display:'block', aspectRatio: isMobile ? '4/3' : '21/8' }}>
                <AdMedia ad={popupAd} />
              </div>
            )}

            {/* ── Mosaic tile overlay ───────────────────────────────── */}
            {/* Removed from DOM once tiles have revealed (tilePhase='active')
                Remounted with new keys when exiting to restart animation   */}
            {!isActive && (
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 5,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows:    `repeat(${rows}, 1fr)`,
                  pointerEvents: 'none',
                }}
              >
                {tiles.map(({ r, c, entryDelay, exitDelay }) => {
                  const isEntering = tilePhase === 'entering';
                  const delay = isEntering ? entryDelay : exitDelay;
                  const anim  = isEntering ? 'mo-tile-reveal' : 'mo-tile-cover';
                  return (
                    <div
                      key={`${tilePhase}-${r}-${c}`}
                      style={{
                        background: TILE_CLR,
                        // Subtle grid lines between tiles — grid-gap alternative
                        outline: '0.5px solid rgba(255,255,255,0.04)',
                        willChange: 'transform, opacity',
                        animation: `${anim} ${TILE_DUR}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms both`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* ── Close button ─────────────────────────────────────── */}
            <button
              onClick={e => { e.stopPropagation(); dismissPopup(); }}
              aria-label="Зарыг хаах"
              style={{
                position: 'absolute', top: '14px', right: '14px', zIndex: 10,
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(255,255,255,0.28)',
                color: '#fff', fontSize: '15px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.15s, transform 0.2s cubic-bezier(0.34,1.4,0.64,1)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.9)';
                (e.currentTarget as HTMLButtonElement).style.transform  = 'scale(1.14) rotate(90deg)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.6)';
                (e.currentTarget as HTMLButtonElement).style.transform  = 'scale(1) rotate(0deg)';
              }}
            >✕</button>

            {/* ── Countdown chip ───────────────────────────────────── */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '14px', zIndex: 10,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.84)', fontSize: '11px',
              padding: '5px 12px', borderRadius: '20px',
              letterSpacing: '0.4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {countdown}с-ын дараа хаагдана
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INLINE BANNER — below Featured Courses, above Trending Articles
      ══════════════════════════════════════════════════════════════════ */}
      {showBanner && bannerAd && bannerAd !== 'loading' && (
        <section style={{ padding: '0 2rem 2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
            <button
              onClick={dismissBanner} aria-label="Зарыг нуух"
              style={{
                position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.75)', fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(3px)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)')}
            >✕</button>
            {bannerAd.target_url?.trim() ? (
              <a href={bannerAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={bannerAd.title ?? undefined}
                style={{ display:'block', width:'100%', minHeight: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} />
              </a>
            ) : (
              <div style={{ display:'block', width:'100%', minHeight: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Mosaic tile keyframes ──────────────────────────────────────────── */}
      <style>{`
        /* REVEAL: tile flips / scales away → image visible underneath */
        @keyframes mo-tile-reveal {
          0%   { transform: perspective(300px) rotateX(0deg)    scale(1);   opacity: 1; }
          45%  { transform: perspective(300px) rotateX(-55deg)  scale(0.7); opacity: 0.6; }
          100% { transform: perspective(300px) rotateX(-90deg)  scale(0);   opacity: 0; }
        }
        /* COVER: tile flips / scales in → image hidden again */
        @keyframes mo-tile-cover {
          0%   { transform: perspective(300px) rotateX(90deg)   scale(0);   opacity: 0; }
          55%  { transform: perspective(300px) rotateX(12deg)   scale(1.08); opacity: 0.9; }
          100% { transform: perspective(300px) rotateX(0deg)    scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
