import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

function getThumb(youtube_id: string | null, thumbnail_url: string | null): string | null {
  if (thumbnail_url) return thumbnail_url;
  if (youtube_id) return `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`;
  return null;
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: video } = await supabase
    .from('mo_videos')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!video) notFound();

  // Increment view count (fire-and-forget)
  supabase
    .from('mo_videos')
    .update({ view_count: (video.view_count || 0) + 1 })
    .eq('id', video.id)
    .then(() => {});

  const title = locale === 'mn' ? video.title_mn : (video.title_en || video.title_mn);
  const description = locale === 'mn' ? video.description_mn : (video.description_en || video.description_mn);
  const thumb = getThumb(video.youtube_id, video.thumbnail_url);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem', color: '#e5e5e5' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.25rem' }}>
        <Link href={`/${locale}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нүүр</Link>
        {' / '}
        <Link href={`/${locale}/videos`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Видео</Link>
        {' / '}
        <span>{title}</span>
      </div>

      {/* Player */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: '56.25%',
        background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem',
      }}>
        {video.youtube_id ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : video.cloudflare_stream_id ? (
          <iframe
            src={`https://customer-stream.cloudflare.com/${video.cloudflare_stream_id}/iframe`}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : thumb ? (
          <img src={thumb} alt={title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            Видео байхгүй
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {video.category && (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: 'rgba(0,181,173,0.12)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.3)' }}>
            {video.category}
          </span>
        )}
        {video.duration_text && (
          <span style={{ fontSize: '11px', color: '#6b7280', padding: '3px 8px' }}>⏱ {video.duration_text}</span>
        )}
        <span style={{ fontSize: '11px', color: '#6b7280', padding: '3px 8px' }}>👁 {(video.view_count || 0).toLocaleString()}</span>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem' }}>{title}</h1>

      {description && (
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 2rem', whiteSpace: 'pre-wrap' }}>{description}</p>
      )}

      <Link
        href={`/${locale}/videos`}
        style={{ fontSize: '14px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}
      >
        ← Бүх видео
      </Link>
    </div>
  );
}
