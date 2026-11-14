'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type Ad = {
  id: string; slot: string; title: string | null;
  target_url: string; media_url: string;
  media_type: 'image' | 'video'; mobile_image_url: string | null;
};

const POPUP_SESSION_KEY  = 'mo_homePopupSeen';
const BANNER_SESSION_KEY = 'mo_homeBannerHidden';
const POPUP_DURATION_MS  = 8000;
const EXIT_MS            = 420;

export default function HomeHeroAdBanner() {
  const [popupAd,   setPopupAd]   = useState<Ad | null | 'loading'>('loading');
  const [bannerAd,  setBannerAd]  = useState<Ad | null | 'loading'>('loading');
  const [isMobile,  setIsMobile]  = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupIn,   setPopupIn]   = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown]   = useState(8);
  const closingRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let c = false;
    fetch('/api/ads/home_popup')
      .then(r => r.json())
      .then(({ ad }) => { if (!c) setPopupAd(ad ?? null); })
      .catch(() => { if (!c) setPopupAd(null); });
    return () => { c = true; };
  }, []);

  useEffect(() => {
    let c = false;
    fetch('/api/ads/home_below_hero')
      .then(r => r.json())
      .then(({ ad }) => { if (!c) setBannerAd(ad ?? null); })
      .catch(() => { if (!c) setBannerAd(null); });
    return () => { c = true; };
  }, []);

  useEffect(() => {
    if (popupAd === 'loading' || !popupAd) return;
    if (!popupAd.media_url?.startsWith('http')) return;
    const hasMedia = popupAd.media_type === 'image' ||
      (popupAd.media_type === 'video' && (!isMobile || !!popupAd.mobile_image_url));
    if (!hasMedia || sessionStorage.getItem(POPUP_SESSION_KEY)) return;
    setShowPopup(true);
    // Double rAF — paint invisible frame first, then transition to visible
    requestAnimationFrame(() => requestAnimationFrame(() => setPopupIn(true)));
  }, [popupAd, isMobile]);

  useEffect(() => {
    if (bannerAd === 'loading' || !bannerAd) return;
    if (!bannerAd.media_url?.startsWith('http')) return;
    const hasMedia = bannerAd.media_type === 'image' ||
      (bannerAd.media_type === 'video' && (!isMobile || !!bannerAd.mobile_image_url));
    if (!hasMedia || sessionStorage.getItem(BANNER_SESSION_KEY)) return;
    setShowBanner(true);
  }, [bannerAd, isMobile]);

  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => dismissPopup(), POPUP_DURATION_MS);
    const i = setInterval(() => setCountdown(c => c > 1 ? c - 1 : c), 1000);
    return () => { clearTimeout(t); clearInterval(i); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup]);

  const dismissPopup = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setPopupIn(false);
    setTimeout(() => {
      sessionStorage.setItem(POPUP_SESSION_KEY, '1');
      setShowPopup(false);
      closingRef.current = false;
    }, EXIT_MS);
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_SESSION_KEY, '1');
    setShowBanner(false);
  }, []);

  if (!showPopup && !showBanner) return null;

  const AdMedia = ({ ad, style }: { ad: Ad; style?: React.CSSProperties }) => {
    const useVid = ad.media_type === 'video' && !isMobile;
    const src    = isMobile && ad.mobile_image_url ? ad.mobile_image_url : ad.media_url;
    return useVid
      ? <video src={ad.media_url} autoPlay muted loop playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
      // eslint-disable-next-line @next/next/no-img-element
      : <img src={src} alt={ad.title ?? 'Сурталчилгаа'} loading="eager"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />;
  };

  const NAV_H = isMobile ? 60 : 72;

  /* ─────────────────────────────────────────────────────────────────────────
     ANIMATION DESIGN — 3D billboard-fold reveal
     Entry:  panel is folded backward in 3D (rotateX = −60°) and pivots open
             from its top edge, settling flat with a spring overshoot.
     Exit:   folds gently forward (rotateX = +18°) and fades out quickly.
   ───────────────────────────────────────────────────────────────────────── */
  const enterTransform = 'perspective(1100px) rotateX(0deg) translateY(0px) scale(1)';
  const exitTransform  = 'perspective(1100px) rotateX(18deg) translateY(-12px) scale(0.97)';
  const initTransform  = 'perspective(1100px) rotateX(-62deg) translateY(-55px) scale(0.88)';

  // Transition string differs for entry vs exit
  const cardTransition = popupIn
    ? `opacity 0.38s ease,
       transform 0.56s cubic-bezier(0.16, 1.1, 0.3, 1),
       box-shadow 0.4s ease`
    : `opacity ${EXIT_MS}ms ease,
       transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1),
       box-shadow ${EXIT_MS}ms ease`;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          POP-UP BANNER
          Anchors just below navbar so it feels like a hero section takeover.
          Full-hero-width card, 3D fold reveal on entry.
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
            /* Scrim transitions with popup — lighter so hero shows through */
            background: popupIn ? 'rgba(5,5,15,0.6)' : 'rgba(5,5,15,0)',
            backdropFilter: popupIn ? 'blur(5px) saturate(0.7)' : 'blur(0px) saturate(1)',
            WebkitBackdropFilter: popupIn ? 'blur(5px) saturate(0.7)' : 'blur(0px) saturate(1)',
            transition: `background ${EXIT_MS}ms ease, backdrop-filter ${EXIT_MS}ms ease`,
            padding: isMobile
              ? `${NAV_H + 6}px 10px 10px`
              : `${NAV_H + 12}px 1.5rem 1.5rem`,
          }}
        >
          {/* Card — full hero width, 3D fold-reveal animation */}
          <div
            style={{
              position: 'relative',
              /* Match hero section: calc(100vw − padding) up to 1400px */
              width: '100%',
              maxWidth: isMobile ? '100%' : '1400px',
              borderRadius: isMobile ? '10px' : '14px',
              overflow: 'hidden',
              boxShadow: popupIn
                ? '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07)'
                : '0 0 0 rgba(0,0,0,0)',
              /* ✦ 3D fold pivot: rotates from the TOP edge of the card */
              transformOrigin: '50% 0%',
              transform: popupIn ? enterTransform : initTransform,
              opacity:   popupIn ? 1 : 0,
              transition: cardTransition,
              /* Keeps 3D on child elements during the rotation */
              transformStyle: 'preserve-3d',
            }}
          >
            {/* ✕ Close */}
            <button
              onClick={e => { e.stopPropagation(); dismissPopup(); }}
              aria-label="Зарыг хаах"
              style={{
                position: 'absolute', top: '14px', right: '14px', zIndex: 10,
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.58)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: '15px', lineHeight: 1,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.15s, transform 0.18s cubic-bezier(0.34,1.4,0.64,1)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.9)';
                (e.currentTarget as HTMLButtonElement).style.transform  = 'scale(1.15) rotate(90deg)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.58)';
                (e.currentTarget as HTMLButtonElement).style.transform  = 'scale(1) rotate(0deg)';
              }}
            >
              ✕
            </button>

            {/* Countdown chip */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '14px', zIndex: 10,
              background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.84)', fontSize: '11px',
              padding: '5px 12px', borderRadius: '20px',
              letterSpacing: '0.4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {countdown}с-ын дараа хаагдана
            </div>

            {/* Ad media */}
            {popupAd.target_url?.trim() ? (
              <a href={popupAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={popupAd.title ?? undefined}
                style={{ display: 'block', aspectRatio: isMobile ? '4/3' : '21/8', background: '#0a0a0a' }}>
                <AdMedia ad={popupAd} />
              </a>
            ) : (
              <div style={{ display: 'block', aspectRatio: isMobile ? '4/3' : '21/8', background: '#0a0a0a' }}>
                <AdMedia ad={popupAd} />
              </div>
            )}
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
              onClick={dismissBanner}
              aria-label="Зарыг нуух"
              style={{
                position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.75)', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(3px)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)')}
            >
              ✕
            </button>
            {bannerAd.target_url?.trim() ? (
              <a href={bannerAd.target_url} target="_blank" rel="noopener noreferrer nofollow"
                title={bannerAd.title ?? undefined}
                style={{ display: 'block', width: '100%', minHeight: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} />
              </a>
            ) : (
              <div style={{ display: 'block', width: '100%', minHeight: isMobile ? '100px' : '120px' }}>
                <AdMedia ad={bannerAd} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Exit keyframe for the closing fold-forward effect */}
      <style>{`
        @keyframes mo-fold-exit {
          from { opacity:1; transform: perspective(1100px) rotateX(0deg) translateY(0) scale(1); }
          to   { opacity:0; transform: perspective(1100px) rotateX(18deg) translateY(-12px) scale(0.97); }
        }
      `}</style>
    </>
  );
}
