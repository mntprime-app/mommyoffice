'use client';
import { useRouter } from 'next/navigation';

export type RelatedVideo = {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string | null;
  thumbnail_url: string | null;
  youtube_id: string | null;
  duration_text: string | null;
  category: string;
  view_count: number;
  video_type: string;
};

const GRADIENTS = [
  'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'linear-gradient(135deg,#1c1a00,#3d3600)',
  'linear-gradient(135deg,#1a0d20,#3d1a4b)',
  'linear-gradient(135deg,#001a1a,#003d3a)',
];

function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}к` : String(n);
}

function getThumb(v: RelatedVideo): string | null {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  return null;
}

function hasDuration(d: string | null): boolean {
  return !!d && !/^0\s*(мин|min)?$/i.test(d.trim());
}

export default function RelatedVideosRow({
  videos,
  category,
  locale,
}: {
  videos: RelatedVideo[];
  category: string;
  locale: string;
}) {
  const router = useRouter();
  if (!videos.length) return null;

  return (
    <section style={{ marginTop: '3rem', borderTop: '1px solid #1f1f1f', paddingTop: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#e5e5e5', margin: 0 }}>
            🎬 {category} ангиллын бусад видеонууд
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
            Таны сонирхолд нийцэх контент
          </p>
        </div>
        <a
          href={`/${locale}/videos`}
          style={{ fontSize: '12px', fontWeight: 700, color: '#00B5AD', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Бүгдийг үзэх →
        </a>
      </div>

      {/* Carousel */}
      <div style={{
        display: 'flex',
        gap: '14px',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '12px',
        /* Hide scrollbar — cross-browser */
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}>

        {videos.map((v, i) => {
          const thumb = getThumb(v);
          const title = locale === 'mn' ? v.title_mn : (v.title_en || v.title_mn);

          return (
            <div
              key={v.id}
              onClick={() => router.push(`/${locale}/videos/${v.slug}`)}
              style={{
                flexShrink: 0,
                width: 'clamp(200px, 38vw, 260px)',
                scrollSnapAlign: 'start',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: '1px solid #222',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,181,173,0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#222';
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                background: GRADIENTS[i % GRADIENTS.length],
                position: 'relative',
                overflow: 'hidden',
              }}>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>🎬</div>
                )}

                {/* Duration badge */}
                {hasDuration(v.duration_text) && (
                  <span style={{
                    position: 'absolute', bottom: '7px', right: '8px',
                    background: 'rgba(0,0,0,0.82)', color: '#e5e5e5',
                    fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                  }}>
                    {v.duration_text}
                  </span>
                )}

                {/* Free/paid badge */}
                <span style={{
                  position: 'absolute', top: '7px', left: '8px',
                  background: v.video_type === 'free' ? 'rgba(16,185,129,0.9)' : 'rgba(251,191,36,0.9)',
                  color: '#fff', fontSize: '9px', fontWeight: 700,
                  padding: '2px 7px', borderRadius: '3px', letterSpacing: '0.5px',
                }}>
                  {v.video_type === 'free' ? 'ҮНЭГҮЙ' : 'ГИШҮҮН'}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px 12px' }}>
                <p style={{
                  margin: '0 0 5px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#e5e5e5',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>👁 {fmtViews(v.view_count)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile scroll hint — only visible on small screens via CSS */}
      <style>{`
        @media (max-width: 640px) {
          .mo-related-hint { display: block !important; }
        }
      `}</style>
      <p className="mo-related-hint" style={{ display: 'none', textAlign: 'center', fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
        ← свайп →
      </p>
    </section>
  );
}
