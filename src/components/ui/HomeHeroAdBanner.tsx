'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type Ad = {
  id: string;
  slot: string;
  title: string | null;
  target_url: string;
  media_url: string;
  media_type: 'image' | 'video';
  mobile_image_url: string | null;
};

const POPUP_SESSION_KEY  = 'mo_homePopupSeen';
const BANNER_SESSION_KEY = 'mo_homeBannerHidden';
const POPUP_DURATION_MS  = 8000;
const EXIT_DURATION_MS   = 380; // must match CSS transition durations below

export default function HomeHeroAdBanner() {
  const [popupAd,  setPopupAd]  = useState<Ad | null | 'loading'>('loading');
  const [bannerAd, setBannerAd] = useState<Ad | null | 'loading'>('loading');
  const [isMobile, setIsMobile] = useState(false);

  // showPopup = DOM exists; popupIn = CSS transition "entered" state
  const [showPopup, setShowPopup] = useState(false);
  const [popupIn,   setPopupIn]   = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown]   = useState(8);
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
    let cancelled = false;
    fetch('/api/ads/home_popup')
      .then((r) => r.json())
      .then(({ ad }) => { if (!cancelled) setPopupAd(ad ?? null); })
      .catch(() => { if (!cancelled) setPopupAd(null); });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch inline banner ad ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ads/home_below_hero')
      .then((r) => r.json())
      .then(({ ad }) => { if (!cancelled) setBannerAd(ad ?? null); })
      .catch(() => { if (!cancelled) setBannerAd(null); });
    return () => { cancelled = true; };
  }, []);

  // ── Activate popup (mount + transition in) ─────────────────────────────────
  useEffect(() => {
    if (popupAd === 'loading' || !popupAd) return;
    if (!popupAd.media_url?.startsWith('http')) return;
    const hasMedia = popupAd.media_type === 'image' ||
      (popupAd.media_type === 'video' && (!isMobile || !!popupAd.mobile_image_url));
    if (!hasMedia) return;
    if (sessionStorage.getItem(POPUP_SESSION_KEY)) return;

    setShowPopup(true);
    // Double rAF ensures the element is painted (opacity:0) before we flip to opacity:1
    // so the browser actually plays the CSS transition instead of jumping to final state.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPopupIn(true))
    );
  }, [popupAd, isMobile]);

  // ── Activate inline banner ─────────────────────────────────────────────────
  useEffect(() => {
    if (bannerAd === 'loading' || !bannerAd) return;
    if (!bannerAd.media_url?.startsWith('http')) return;
    const hasMedia = bannerAd.media_type === 'image' ||
      (bannerAd.media_type === 'video' && (!isMobile || !!bannerAd.mobile_image_url));
    if (!hasMedia) return;
    if (!sessionStorage.getItem(BANNER_SESSION_KEY)) setShowBanner(true);
  }, [bannerAd, isMobile]);

  // ── Auto-dismiss after 8s + countdown tick ─────────────────────────────────
  useEffect(() => {
    if (!showPopup) return;
    const timer    = setTimeout(() => dismissPopup(), POPUP_DURATION_MS);
    const interval = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : c)), 1000);
    return () => { clearTimeout(timer); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup]);

  // ── Dismiss with exit transition ───────────────────────────────────────────
  const dismissPopup = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setPopupIn(false); // flip to exit state → CSS transitions play
    setTimeout(() => {
      sessionStorage.setItem(POPUP_SESSION_KEY, '1');
      setShowPopup(false);
      closingRef.current = false;
    }, EXIT_DURATION_MS);
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_SESSION_KEY, '1');
    setShowBanner(false);
  }, []);

  if (!showPopup && !showBanner) return null;

  // ── Media helper ───────────────────────────────────────────────────────────
  const AdMedia = ({ ad, style }: { ad: Ad; style?: React.CSSProperties }) => {
    const useVid = ad.media_type === 'video' && !isMobile;
    const src = isMobile && ad.mobile_image_url ? ad.mobile_image_url : ad.media_url;
    return useVid ? (
      <video
        src={ad.media_url}
        autoPlay muted loop playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={ad.title ?? 'Сурталчилгаа'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
        loading="eager"
      />
    );
  };

  // Nav height offsets — popup anchors just below the nav, overlaying the Hero
  const NAV_H = isMobile ? 60 : 72;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          POP-UP  — anchored below navbar, overlays Hero section.
          Uses CSS transitions (not keyframes) for reliable enter/exit.
          ════════════════════════════════════════════════════════════════ */}
      {showPopup && popupAd && popupAd !== 'loading' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) dismissPopup(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            // Lighter scrim — hero context stays visible through the blur
            background: popupIn ? 'rgba(0,0,0,0.52)' : 'rgba(0,0,0,0)',
            backdropFilter: popupIn ? 'blur(4px)' : 'blur(0px)',
            WebkitBackdropFilter: popupIn ? 'blur(4px)' : 'blur(0px)',
            transition: `background ${EXIT_DURATION_MS}ms ease, backdrop-filter ${EXIT_DURATION_MS}ms ease`,
            padding: isMobile
              ? `${NAV_H + 8}px 12px 12px`
              : `${NAV_H + 16}px 2rem 2rem`,
          }}
        >
          {/* ── Modal card — spring in from top, fade-scale out ── */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1100px',
              borderRadius: isMobile ? '12px' : '16px',
              overflow: 'hidden',
              boxShadow: popupIn
                ? '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 0 0 rgba(0,0,0,0)',
              // CSS transition — spring entry, smooth exit
              transition: popupIn
                ? `opacity 0.32s ease, transform 0.42s cubic-bezier(0.34,1.4,0.64,1), box-shadow ${EXIT_DURATION_MS}ms ease`
                : `opacity ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease, box-shadow ${EXIT_DURATION_MS}ms ease`,
              opacity:   popupIn ? 1 : 0,
              transform: popupIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(-18px)',
            }}
          >
            {/* ✕ Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); dismissPopup(); }}
              aria-label="Зарыг хаах"
              style={{
                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(255,255,255,0.28)',
                color: '#fff', fontSize: '15px', lineHeight: 1,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.88)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.6)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>

            {/* Countdown chip */}
            <div style={{
              position: 'absolute', bottom: '12px', left: '12px', zIndex: 10,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.82)', fontSize: '11px',
              padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.3px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {countdown}с-ын дараа хаагдана
            </div>

            {/* Ad media — full banner, clickable if URL provided */}
            {popupAd.target_url?.trim() ? (
              <a
                href={popupAd.target_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={popupAd.title ?? undefined}
                style={{ display: 'block', aspectRatio: isMobile ? '4/3' : '16/6', background: '#111' }}
              >
                <AdMedia ad={popupAd} />
              </a>
            ) : (
              <div style={{ display: 'block', aspectRatio: isMobile ? '4/3' : '16/6', background: '#111' }}>
                <AdMedia ad={popupAd} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          INLINE BANNER  — below Featured Courses, above Trending Articles
          ════════════════════════════════════════════════════════════════ */}
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
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)')}
            >
              ✕
            </button>
            {bannerAd.target_url?.trim() ? (
              <a
                href={bannerAd.target_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={bannerAd.title ?? undefined}
                style={{ display: 'block', width: '100%', minHeight: isMobile ? '100px' : '120px' }}
              >
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
    </>
  );
}
