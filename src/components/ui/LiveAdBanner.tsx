'use client';

import { useEffect, useState } from 'react';

type Ad = {
  id: string;
  slot: string;
  title: string | null;
  target_url: string;
  media_url: string;
  media_type: 'image' | 'video';
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

  // Mobile: video ads suppressed — image-only on small screens
  if (isMobile && ad.media_type === 'video') return null;

  const isSidebar = type === 'sidebar';

  return (
    <a
      href={ad.target_url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={ad.title ?? undefined}
      style={{
        display: 'block',
        borderRadius: '10px',
        overflow: 'hidden',
        textDecoration: 'none',
        width: '100%',
        ...(isSidebar ? { minHeight: '250px' } : { minHeight: '80px' }),
        background: '#111',
        ...style,
      }}
    >
      {ad.media_type === 'video' ? (
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
          src={ad.media_url}
          alt={ad.title ?? 'Сурталчилгаа'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      )}
    </a>
  );
}
