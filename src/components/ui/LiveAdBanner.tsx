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

const PLACEHOLDER: Record<BannerType, { w: string; h: string; label: string }> = {
  leaderboard: { w: '100%', h: '80px',  label: '728×90' },
  sidebar:     { w: '100%', h: '250px', label: '300×250' },
  footer:      { w: '100%', h: '80px',  label: '970×90' },
  mobile:      { w: '100%', h: '120px', label: '320×100' },
};

function Placeholder({ type }: { type: BannerType }) {
  const p = PLACEHOLDER[type];
  const isSidebar = type === 'sidebar';
  return (
    <div style={{
      width: p.w, minHeight: p.h,
      background: 'rgba(255,255,255,0.025)',
      border: '1px dashed rgba(255,255,255,0.1)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: isSidebar ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isSidebar ? '6px' : '12px',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      {!isSidebar && (
        <div style={{ width: '32px', height: '32px', background: 'rgba(0,181,173,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '14px' }}>📢</span>
        </div>
      )}
      <div style={{ textAlign: isSidebar ? 'center' : 'left' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#444', margin: '0 0 2px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Сурталчилгааны зай</p>
        <p style={{ fontSize: '10px', color: '#333', margin: 0 }}>{p.label} · info.mommyoffice@gmail.com</p>
      </div>
    </div>
  );
}

interface LiveAdBannerProps {
  slot: string;
  type?: BannerType;
  style?: React.CSSProperties;
}

export default function LiveAdBanner({ slot, type = 'leaderboard', style }: LiveAdBannerProps) {
  const [ad, setAd] = useState<Ad | null | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/${encodeURIComponent(slot)}`)
      .then((r) => r.json())
      .then(({ ad: result }) => { if (!cancelled) setAd(result ?? null); })
      .catch(() => { if (!cancelled) setAd(null); });
    return () => { cancelled = true; };
  }, [slot]);

  // Still fetching — render placeholder silently so layout doesn't shift
  if (ad === 'loading') return <Placeholder type={type} />;

  // No active ad — show placeholder
  if (!ad) return <Placeholder type={type} />;

  const isSidebar = type === 'sidebar';
  const isVideo = ad.media_type === 'video';

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
      onClick={() => {
        // Fire impression log (fire-and-forget)
        fetch(`/api/ads/${encodeURIComponent(slot)}/click?id=${ad.id}`, { method: 'POST' }).catch(() => {});
      }}
    >
      {isVideo ? (
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
