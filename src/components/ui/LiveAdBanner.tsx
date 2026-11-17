'use client';

import { useEffect, useState } from 'react';

type Ad = {
  id: string;
  slot: string;
  title: string | null;
  target_url: string;
  media_url: string;
  media_type: 'image' | 'video';
  mobile_image_url: string | null;
};

type BannerType = 'leaderboard' | 'sidebar' | 'footer' | 'mobile';

interface LiveAdBannerProps {
  slot: string;
  type?: BannerType;
  style?: React.CSSProperties;
  /** Height (px) to enforce on mobile for leaderboard/footer type. Default 50 (320×50 spec). C1 passes 100. */
  mobileHeight?: number;
}

export default function LiveAdBanner({ slot, type = 'leaderboard', style, mobileHeight = 50 }: LiveAdBannerProps) {
  const [ad, setAd] = useState<Ad | null | 'loading'>('loading');
  const [isMobile, setIsMobile] = useState(false);

  // Detect and track mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch active ad for this slot
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/${encodeURIComponent(slot)}`)
      .then((r) => r.json())
      .then(({ ad: result }) => { if (!cancelled) setAd(result ?? null); })
      .catch(() => { if (!cancelled) setAd(null); });
    return () => { cancelled = true; };
  }, [slot]);

  // Still fetching — render nothing (zero height, no layout shift)
  if (ad === 'loading') return null;

  // No active ad — collapse completely, leave no space
  if (!ad) return null;

  // Mobile: video ads show mobile_image_url fallback (if provided), else collapse
  if (isMobile && ad.media_type === 'video') {
    if (!ad.mobile_image_url) return null;
    // Fall through with image rendering below using mobile_image_url
  }

  const hasLink = !!ad.target_url?.trim();

  const isSidebar    = type === 'sidebar';
  const isHorizontal = type === 'leaderboard' || type === 'footer';

  // Mobile rendering strategy:
  // - sidebar           → minHeight 250px, objectFit cover (unchanged)
  // - leaderboard/footer→ slim strip at mobileHeight px, objectFit cover
  //     Default mobileHeight=50  → A1/A3 (320×50 spec)
  //     C1 passes mobileHeight=100 → courses_sidebar (390×100 spec)
  // - mobile / other non-sidebar → height auto (natural image height, no crop)
  const mobileNonSidebar  = isMobile && !isSidebar;
  const mobileHorizontal  = isMobile && isHorizontal;
  const mobileFlowHeight  = mobileNonSidebar && !isHorizontal;

  const mh = `${mobileHeight}px`;

  const containerStyle: React.CSSProperties = {
    display: 'block',
    borderRadius: '10px',
    overflow: 'hidden',
    textDecoration: 'none',
    width: '100%',
    ...(isSidebar        ? { minHeight: '250px' }
      : mobileHorizontal ? { height: mh }
      : mobileFlowHeight ? {}
      :                    { minHeight: '80px' }),
    background: '#111',
    ...style,
  };

  const media = ad.media_type === 'video' && !isMobile ? (
    <video
      src={ad.media_url}
      autoPlay
      muted
      loop
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isMobile && ad.mobile_image_url ? ad.mobile_image_url : ad.media_url}
      alt={ad.title ?? 'Сурталчилгаа'}
      style={
        mobileHorizontal
          // Leaderboard/footer on mobile: slim strip at mobileHeight (A1/A3=50px, C1=100px), center-cropped
          ? { width: '100%', height: mh, objectFit: 'cover' as const, display: 'block' }
          : mobileFlowHeight
          // Mobile-only slots (ARM etc): natural height, no crop
          ? { width: '100%', height: 'auto', display: 'block' }
          // Desktop: fill the fixed-height container
          : { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
      }
      loading="lazy"
    />
  );

  return hasLink ? (
    <a href={ad.target_url} target="_blank" rel="noopener noreferrer nofollow" title={ad.title ?? undefined} style={containerStyle}>
      {media}
    </a>
  ) : (
    <div style={containerStyle}>{media}</div>
  );
}
