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

const POPUP_SESSION_KEY = 'mo_homePopupSeen';
const BANNER_SESSION_KEY = 'mo_homeBannerHidden';
const POPUP_DURATION_MS = 8000;

export default function HomeHeroAdBanner() {
  const [ad, setAd] = useState<Ad | null | 'loading'>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const closingRef = useRef(false); // prevents double-trigger during animation

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch active ad for home_below_hero slot
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ads/home_below_hero')
      .then((r) => r.json())
      .then(({ ad: result }) => { if (!cancelled) setAd(result ?? null); })
      .catch(() => { if (!cancelled) setAd(null); });
    return () => { cancelled = true; };
  }, []);

  // Once ad is loaded, determine initial visibility from sessionStorage
  useEffect(() => {
    if (ad === 'loading' || ad === null) return;
    // If video ad on mobile with no fallback, still show banner but skip popup
    const hasMedia = ad.media_type === 'image' || (ad.media_type === 'video' && (!isMobile || !!ad.mobile_image_url));
    if (!hasMedia) return;

    const popupSeen = sessionStorage.getItem(POPUP_SESSION_KEY);
    const bannerHidden = sessionStorage.getItem(BANNER_SESSION_KEY);

    if (!popupSeen) setShowPopup(true);
    if (!bannerHidden) setShowBanner(true);
  }, [ad, isMobile]);

  // Auto-dismiss popup after POPUP_DURATION_MS
  useEffect(() => {
    if (!showPopup) return;
    const dismissTimer = setTimeout(() => dismissPopup(), POPUP_DURATION_MS);
    const countdownInterval = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : c));
    }, 1000);
    return () => {
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup]);

  const dismissPopup = useCallback(() => {
    if (closingRef.current) return; // already animating out — ignore
    closingRef.current = true;
    setIsClosingPopup(true); // triggers exit animation
    setTimeout(() => {
      sessionStorage.setItem(POPUP_SESSION_KEY, '1');
      setShowPopup(false);
      setIsClosingPopup(false);
      closingRef.current = false;
    }, 280); // matches moAdModalOut duration
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_SESSION_KEY, '1');
    setShowBanner(false);
  }, []);

  // Nothing to render
  if (ad === 'loading' || ad === null) return null;
  if (!showPopup && !showBanner) return null;

  // Resolve which media to show
  const useVideo = ad.media_type === 'video' && !isMobile;
  const imageSrc = isMobile && ad.mobile_image_url ? ad.mobile_image_url : ad.media_url;

  // If video on mobile and no mobile_image_url — skip rendering entirely
  if (ad.media_type === 'video' && isMobile && !ad.mobile_image_url) return null;

  const AdMedia = ({ style }: { style?: React.CSSProperties }) =>
    useVideo ? (
      <video
        src={ad.media_url}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={ad.title ?? 'Сурталчилгаа'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
        loading="eager"
      />
    );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          POPUP OVERLAY — full viewport, appears for 8 seconds
          on first homepage visit per session
      ══════════════════════════════════════════════════════ */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1rem' : '2rem',
            // Overlay fades in/out independently of the modal card
            animation: `${isClosingPopup ? 'moAdOverlayOut' : 'moAdOverlayIn'} 0.28s ease forwards`,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) dismissPopup(); }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            // Modal card: spring-scale in, smooth scale-fade out
            animation: `${isClosingPopup ? 'moAdModalOut' : 'moAdModalIn'} 0.32s ${isClosingPopup ? 'ease' : 'cubic-bezier(0.34,1.4,0.64,1)'} forwards`,
          }}>
            {/* Close button — top right. stopPropagation prevents triggering the <a> link. */}
            <button
              onClick={(e) => { e.stopPropagation(); dismissPopup(); }}
              aria-label="Зарыг хаах"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.65)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: '#fff',
                fontSize: '16px',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'rgba(0,0,0,0.9)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'rgba(0,0,0,0.65)')}
            >
              ✕
            </button>

            {/* Countdown chip — bottom left */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '0.3px',
            }}>
              {countdown}с-ын дараа хаагдана
            </div>

            {/* Ad content — clickable */}
            <a
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={ad.title ?? undefined}
              style={{ display: 'block', aspectRatio: isMobile ? '4/3' : '16/6', background: '#111' }}
            >
              <AdMedia style={{ aspectRatio: 'inherit' }} />
            </a>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PERMANENT INLINE BANNER — below Featured Courses,
          above Trending Articles. Dismissible per session.
      ══════════════════════════════════════════════════════ */}
      {showBanner && (
        <section style={{ padding: '0 2rem 2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
            {/* Dismiss button */}
            <button
              onClick={dismissBanner}
              aria-label="Зарыг нуух"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(3px)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'rgba(0,0,0,0.85)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'rgba(0,0,0,0.55)')}
            >
              ✕
            </button>

            <a
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={ad.title ?? undefined}
              style={{
                display: 'block',
                width: '100%',
                minHeight: isMobile ? '100px' : '120px',
              }}
            >
              <AdMedia />
            </a>
          </div>
        </section>
      )}

      {/* Animation keyframes — overlay backdrop + modal card */}
      <style>{`
        /* Overlay backdrop */
        @keyframes moAdOverlayIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes moAdOverlayOut { from { opacity: 1; } to { opacity: 0; } }

        /* Modal card — spring-scale entry, smooth exit */
        @keyframes moAdModalIn {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px);  }
        }
        @keyframes moAdModalOut {
          from { opacity: 1; transform: scale(1)    translateY(0px);  }
          to   { opacity: 0; transform: scale(0.95) translateY(6px);  }
        }
      `}</style>
    </>
  );
}
