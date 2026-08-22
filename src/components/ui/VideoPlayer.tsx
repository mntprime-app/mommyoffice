'use client';

interface Props {
  videoId: string;
  provider: 'youtube' | 'cloudflare';
  title?: string;
}

export default function VideoPlayer({ videoId, provider, title }: Props) {
  if (!videoId) {
    return (
      <div style={{
        background: '#1a1a2e', borderRadius: '12px', height: '380px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <p style={{ color: '#9ca3af' }}>Видео олдсонгүй</p>
      </div>
    );
  }

  const src = provider === 'cloudflare'
    ? `https://customer-stream.cloudflare.com/${videoId}/iframe`
    : `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      {title && (
        <div style={{ padding: '0.75rem 1rem', background: '#1a1a2e', color: '#e2e8f0', fontSize: '15px', fontWeight: 600 }}>
          {title}
        </div>
      )}
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={src}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title || 'Course video'}
        />
      </div>
    </div>
  );
}
