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
}

export default function LiveAdBanner({ slot, type = 'leaderboard', style }: LiveAdBannerProps) {
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
  // - sidebar       → minHeight 250px, objectFit cover (unchanged)
  // - leaderboard / footer → fixed 90px slim strip, objectFit cover (like H1 mobile)
  //   Reason: these slots are DEFINED as horizontal banners. Uploaded images may be
  //   portrait (300×250 sidebar repurposed) — we crop to a slim strip rather than
  //   rendering a giant square block that dominates the page.
  // - mobile / other non-sidebar → height auto (let image dictate height, no crop)
  const mobileNonSidebar  = isMobile && !isSidebar;
  const mobileHorizontal  = isMobile && isHorizontal;   // slim 100px strip (matches H1 mobile)
  const mobileFlowHeight  = mobileNonSidebar && !isHorizontal; // natural height

  const containerStyle: React.CSSProperties = {
    display: 'block',
    borderRadius: '10px',
    overflow: 'hidden',
    textDecoration: 'none',
    width: '100%',
    ...(isSidebar        ? { minHeight: '250px' }
      : mobileHorizontal ? { height: '100px' }
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
          // Leaderboard/footer on mobile: slim 100px horizontal strip (matches H1 mobile), center-cropped
          ? { width: '100%', height: '100px', objectFit: 'cover', display: 'block' }
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
