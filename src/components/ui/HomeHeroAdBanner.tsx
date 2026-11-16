'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'; // useCallback kept for dismissPopup

type Ad = {
  id: string; slot: string; title: string | null;
  target_url: string; media_url: string;
  media_type: 'image' | 'video'; mobile_image_url: string | null;
};

// ── Module-level component — MUST be outside HomeHeroAdBanner ─────────────
// If AdMedia is defined inside the render function, React creates a new
// component reference every render → unmounts/remounts the <video> element
// on every state change → autoplay is destroyed → banner appears static.
// By placing it here (module level) the reference is stable forever.
function AdMedia({ ad, isMobile, style }: { ad: Ad; isMobile: boolean; style?: React.CSSProperties }) {
  const useVid    = ad.media_type === 'video' && !isMobile;
  const hasMobImg = !!(isMobile && ad.mobile_image_url);
  const src       = hasMobImg ? ad.mobile_image_url! : ad.media_url;
  // Desktop-only 11:1 image letterboxed in a 100px mobile box → use contain.
  // With a dedicated 390×100px mobile upload → cover fills perfectly.
  const fit: React.CSSProperties['objectFit'] = isMobile && !hasMobImg ? 'contain' : 'cover';
  return useVid
    ? <video src={ad.media_url} autoPlay muted loop playsInline
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', background:'#000', ...style }} />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={src} alt={ad.title ?? 'Сурталчилгаа'} loading="eager"
        style={{ width:'100%', height:'100%', objectFit: fit, display:'block', background:'#000', ...style }} />;
}

const POPUP_SESSION_KEY  = 'mo_homePopupSeen';
// H1 banner has no dismiss — it is a permanent paid ad placement.
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
  const [popupAd,    setPopupAd]    = useState<Ad | null | 'loading'>('loading');
  const [bannerAd,   setBannerAd]   = useState<Ad | null | 'loading'>('loading');
  const [isMobile,   setIsMobile]   = useState(false);
  const [showPopup,  setShowPopup]  = useState(false);
  const [scrimIn,    setScrimIn]    = useState(false);
  const [tilePhase,  setTilePhase]  = useState<TilePhase>('entering');
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

    setTilePhase('entering');
    setScrimIn(false);
    setShowPopup(true);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setScrimIn(true);
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
    // On mobile: image ads require a dedicated mobile_image_url (desktop 11:1 image
    // letterboxes to ~34px tall in a 100px box — not usable). Video ads also require
    // mobile_image_url (can't autoplay video on mobile). Neither shows on mobile
    // without a proper 390×100px mobile upload.
    const hasMedia = isMobile
      ? !!bannerAd.mobile_image_url
      : bannerAd.media_type === 'image' || bannerAd.media_type === 'video';
    if (!hasMedia) return;
    // No sessionStorage check — H1 is a permanent paid placement, never dismissable.
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

  // ── Dismiss popup ──────────────────────────────────────────────────────────
  const dismissPopup = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setScrimIn(false);
    setTilePhase('exiting');
    const cols = window.innerWidth < 768 ? COLS_M : COLS_D;
    const rows = window.innerWidth < 768 ? ROWS_M : ROWS_D;
    setTimeout(() => {
      sessionStorage.setItem(POPUP_SESSION_KEY, '1');
      setShowPopup(false);
      closingRef.current = false;
    }, totalMs(cols, rows) + 80);
  }, []);

  // ── Tile grid — ALL hooks must be above any early return ───────────────────
  const cols = isMobile ? COLS_M : COLS_D;
  const rows = isMobile ? ROWS_M : ROWS_D;

  const tiles = useMemo(() => {
    const out: Array<{ r: number; c: number; entryDelay: number; exitDelay: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          r, c,
          entryDelay: (c + r) * STAGGER,
          exitDelay:  ((cols - 1 - c) + (rows - 1 - r)) * STAGGER,
        });
      }
    }
    return out;
  }, [cols, rows]);

  // ── Early exit — only after every hook ────────────────────────────────────
  if (!showPopup && !showBanner) return null;

  const NAV_H  = isMobile ? 60 : 72;
  const isActive = tilePhase === 'active'; // tiles removed from DOM when image fully visible

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          POP-UP BANNER — mosaic tile grid reveal / cover animation
      ══════════════════════════════════════════════════════════════════ */}
      {showPopup && popupAd && popupAd !== 'loading' && (
        <div
          onClick={e => { if (e.target === e.currentTarget) dismissPopup(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            background:    scrimIn ? 'rgba(4,4,14,0.65)' : 'rgba(4,4,14,0)',
            backdropFilter:       scrimIn ? 'blur(6px) saturate(0.6)' : 'blur(0px) saturate(1)',
            WebkitBackdropFilter: scrimIn ? 'blur(6px) saturate(0.6)' : 'blur(0px) saturate(1)',
            transition: 'background 500ms ease, backdrop-filter 500ms ease',
            padding: isMobile
              ? `${NAV_H + 6}px 8px 10px`
              : `${NAV_H + 14}px 1.5rem 1.5rem`,
          }}
        >
          {/* Card + countdown wrapper — column so countdown sits below the card */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '100%', maxWidth: isMobile ? '100%' : '1400px', gap: '10px',
          }}>
          {/* Card */}
          <div style={{
            position: 'relative', width: '100%',
            maxWidth: isMobile ? '100%' : '1400px',
            borderRadius: isMobile ? '10px' : '14px',
            overflow: 'hidden',
            boxShadow: scrimIn
              ? '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 0 0 rgba(0,0,0,0)',
            transition: 'box-shadow 500ms ease',
            background: TILE_CLR,
          }}>
            {/* Ad media — mobile: 2/1 matches 800×400 upload; desktop: 21/8 widescreen */}
            {popupAd.target_url?.trim() ? (
              <a href={popupAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={popupAd.title ?? undefined}
                style={{ display:'block', aspectRatio: isMobile ? '2/1' : '21/8' }}>
                <AdMedia ad={popupAd} isMobile={isMobile} />
              </a>
            ) : (
              <div style={{ display:'block', aspectRatio: isMobile ? '2/1' : '21/8' }}>
                <AdMedia ad={popupAd} isMobile={isMobile} />
              </div>
            )}

            {/* Mosaic tile overlay — removed from DOM in 'active' phase */}
            {!isActive && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 5,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows:    `repeat(${rows}, 1fr)`,
                pointerEvents: 'none',
              }}>
                {tiles.map(({ r, c, entryDelay, exitDelay }) => {
                  const isEntering = tilePhase === 'entering';
                  return (
                    <div
                      key={`${tilePhase}-${r}-${c}`}
                      style={{
                        background: TILE_CLR,
                        outline: '0.5px solid rgba(255,255,255,0.04)',
                        willChange: 'transform, opacity',
                        animation: `${isEntering ? 'mo-tile-reveal' : 'mo-tile-cover'} ${TILE_DUR}ms cubic-bezier(0.4,0,0.2,1) ${isEntering ? entryDelay : exitDelay}ms both`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* "СУРТАЛЧИЛГАА" badge — top-left, matches site pill tag style */}
            <div style={{
              position: 'absolute', top: '14px', left: '14px', zIndex: 10,
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 13px',
              borderRadius: '999px',
              border: '1.5px solid rgba(0,214,196,0.7)',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#00d4c4',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1.4px',
              textTransform: 'uppercase' as const,
              userSelect: 'none',
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#00d4c4', display: 'inline-block', flexShrink: 0,
                boxShadow: '0 0 6px #00d4c4',
              }} />
              Сурталчилгаа
            </div>

            {/* Close button */}
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

          </div>

          {/* Countdown — below the card, never overlaps ad content */}
          <div style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '11px',
            letterSpacing: '0.3px', userSelect: 'none',
          }}>
            {countdown}с-ын дараа хаагдана
          </div>

          </div>{/* end card+countdown wrapper */}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INLINE BANNER — below hero
      ══════════════════════════════════════════════════════════════════ */}
      {showBanner && bannerAd && bannerAd !== 'loading' && (
        <section style={{ padding: isMobile ? '0 0 2rem' : '0 2rem 2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          {/* Mobile: full-bleed (no radius) so 390×100px image shows edge-to-edge without cropping.
              Desktop: rounded card with side padding, same as before. */}
          <div style={{ position: 'relative', borderRadius: isMobile ? '0' : '10px', overflow: 'hidden', background: '#111' }}>
            {bannerAd.target_url?.trim() ? (
              <a href={bannerAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={bannerAd.title ?? undefined}
                style={{ display:'block', width:'100%', height: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} isMobile={isMobile} />
              </a>
            ) : (
              <div style={{ display:'block', width:'100%', height: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} isMobile={isMobile} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mosaic tile keyframes */}
      <style>{`
        @keyframes mo-tile-reveal {
          0%   { transform: perspective(300px) rotateX(0deg)   scale(1);    opacity: 1; }
          45%  { transform: perspective(300px) rotateX(-55deg) scale(0.7);  opacity: 0.6; }
          100% { transform: perspective(300px) rotateX(-90deg) scale(0);    opacity: 0; }
        }
        @keyframes mo-tile-cover {
          0%   { transform: perspective(300px) rotateX(90deg)  scale(0);    opacity: 0; }
          55%  { transform: perspective(300px) rotateX(12deg)  scale(1.08); opacity: 0.9; }
          100% { transform: perspective(300px) rotateX(0deg)   scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
