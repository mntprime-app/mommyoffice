'use server';
import { createAdminClient } from '@/lib/supabase/server';

export async function createArticle(data: {
  title_mn: string;
  title_en: string | null;
  excerpt_mn: string | null;
  excerpt_en: string | null;
  body_mn: string | null;
  body_en: string | null;
  cover_image_url: string | null;
  category: string;
  author_name: string | null;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  placement: string;
  is_pinned_trending: boolean;
  pin_rank: number | null;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('mo_articles').insert(data);
  if (error) return { error: error.message };
  return { error: null };
}
