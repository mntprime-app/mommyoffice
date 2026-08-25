import { createClient } from '@supabase/supabase-js';
import VideosClient from './VideosClient';

export const revalidate = 60; // ISR: refresh every 60s

export type Video = {
  id: string;
  title_mn: string;
  title_en: string | null;
  slug: string | null;
  description_mn: string | null;
  description_en: string | null;
  youtube_id: string | null;
  cloudflare_stream_id: string | null;
  thumbnail_url: string | null;
  duration_text: string;
  category: string;
  view_count: number;
  is_featured: boolean;
  placement: string;
  video_type: string;
  created_at: string;
};

export default async function VideosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: videos } = await supabase
    .from('mo_videos')
    .select(
      'id, title_mn, title_en, slug, description_mn, description_en, youtube_id, cloudflare_stream_id, thumbnail_url, duration_text, category, view_count, is_featured, placement, video_type, created_at',
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return <VideosClient videos={videos ?? []} locale={locale} />;
}
