'use server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// Public anon client for reads
function anonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type VideoComment = {
  id: string;
  video_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  body: string;
  created_at: string;
};

// ─── GET COMMENTS (public) ────────────────────────────────────────────────────

export async function getVideoComments(videoId: string): Promise<VideoComment[]> {
  try {
    const supabase = anonClient();
    const { data } = await supabase
      .from('mo_video_comments')
      .select('id, video_id, user_id, user_email, user_name, body, created_at')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── ADD COMMENT (auth required) ─────────────────────────────────────────────

export async function addVideoComment(
  videoId: string,
  body: string,
): Promise<{ comment: VideoComment | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { comment: null, error: 'Нэвтрэх шаардлагатай.' };

    const payload = {
      video_id:   videoId,
      user_id:    user.id,
      user_email: user.email ?? null,
      user_name:  user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
      body:       body.slice(0, 1000),
    };

    const { data, error } = await supabase
      .from('mo_video_comments')
      .insert(payload)
      .select('id, video_id, user_id, user_email, user_name, body, created_at')
      .single();

    if (error) return { comment: null, error: error.message };
    return { comment: data, error: null };
  } catch (e) {
    return { comment: null, error: String(e) };
  }
}

// ─── DELETE COMMENT (own comments only) ──────────────────────────────────────

export async function deleteVideoComment(
  commentId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Нэвтрэх шаардлагатай.' };

    const { error } = await supabase
      .from('mo_video_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id); // RLS + double-check

    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── PUBLIC EPISODE FETCH ────────────────────────────────────────────────────

export interface PublicEpisode {
  id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration: string;
  /** @deprecated prefer youtube_id or cloudflare_stream_id */
  video_url: string;
  /** 'youtube' | 'cloudflare' */
  video_provider: string;
  youtube_id: string;
  cloudflare_stream_id: string;
  thumbnail_url: string;
  description: string;
}

/** Fetch published episodes for a video — used by the detail modal */
export async function getPublicVideoEpisodes(videoId: string): Promise<PublicEpisode[]> {
  try {
    const supabase = anonClient();
    const { data } = await supabase
      .from('mo_video_episodes')
      .select('id, season_number, episode_number, title, duration, video_url, video_provider, youtube_id, cloudflare_stream_id, thumbnail_url, description')
      .eq('video_id', videoId)
      .eq('is_published', true)
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true });
    return (data || []) as PublicEpisode[];
  } catch { return []; }
}

/** Fetch a public video record by slug (for home hero modal episodes) */
export async function getPublicVideoBySlug(slug: string) {
  try {
    const supabase = anonClient();
    const { data } = await supabase
      .from('mo_videos')
      .select('id, title_mn, slug, content_type, season_count, youtube_id, thumbnail_url, description_mn, category, duration_text')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    return data || null;
  } catch { return null; }
}

// ─── INCREMENT VIEW COUNT (client-triggered) ──────────────────────────────────

export async function incrementVideoView(videoId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_videos')
      .select('view_count')
      .eq('id', videoId)
      .single();
    await supabase
      .from('mo_videos')
      .update({ view_count: (data?.view_count ?? 0) + 1 })
      .eq('id', videoId);
  } catch {
    // Non-critical — silently ignore
  }
}
