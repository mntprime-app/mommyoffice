import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import ShareButton from './ShareButton';
import ViewCounter from './ViewCounter';
import VideoComments from './VideoComments';

export const revalidate = 60;

function getThumb(youtube_id: string | null, thumbnail_url: string | null): string | null {
  if (thumbnail_url) return thumbnail_url;
  if (youtube_id) return `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`;
  return null;
}

function getThumbHQ(youtube_id: string | null, thumbnail_url: string | null): string | null {
  if (thumbnail_url) return thumbnail_url;
  if (youtube_id) return `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`;
  return null;
}

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const supabase = makeSupabase();
  const { data: video } = await supabase
    .from('mo_videos')
    .select('title_mn, title_en, description_mn, description_en, thumbnail_url, youtube_id')
    .eq('slug', slug)
    .single();

  if (!video) return { title: 'Видео олдсонгүй | MommyOffice' };

  const title = locale === 'mn' ? video.title_mn : (video.title_en || video.title_mn);
  const description = (locale === 'mn' ? video.description_mn : (video.description_en || video.description_mn)) || '';
  const image = getThumbHQ(video.youtube_id, video.thumbnail_url);

  return {
    title: `${title} | MommyOffice`,
    description,
    openGraph: {
      title: `${title} | MommyOffice`,
      description,
      images: image ? [{ url: image, width: 1280, height: 720 }] : [],
      type: 'video.other',
      siteName: 'MommyOffice',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = makeSupabase();

  const { data: video } = await supabase
    .from('mo_videos')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!video) notFound();

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

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
        {video.category && (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: 'rgba(0,181,173,0.12)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.3)' }}>
            {video.category}
          </span>
        )}
        {video.duration_text && video.duration_text !== '0 мин' && (
          <span style={{ fontSize: '11px', color: '#6b7280', padding: '3px 8px' }}>⏱ {video.duration_text}</span>
        )}
        <span style={{ fontSize: '11px', color: '#6b7280', padding: '3px 8px' }}>👁 {(video.view_count || 0).toLocaleString()}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
          {video.video_type === 'free' ? '🔓 Үнэгүй' : '🔐 Гишүүнчлэл'}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem' }}>{title}</h1>

      {/* Description */}
      {description && (
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 1.5rem', whiteSpace: 'pre-wrap' }}>{description}</p>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <ShareButton />
        <Link
          href={`/${locale}/videos`}
          style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Бүх видео
        </Link>
      </div>

      {/* View counter (client, non-blocking) */}
      <ViewCounter videoId={video.id} />

      {/* Comments */}
      <VideoComments
        videoId={video.id}
        commentsEnabled={video.comments_enabled !== false}
        locale={locale}
      />

    </div>
  );
}
