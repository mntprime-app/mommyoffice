'use server';
import { createAdminClient } from '@/lib/supabase/server';

export async function listArticles() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('mo_articles')
    .select('id, title_mn, title_en, category, is_published, published_at, slug, is_pinned_trending, pin_rank, placement')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function toggleArticlePublish(id: string, current: boolean) {
  const supabase = await createAdminClient();
  await supabase.from('mo_articles').update({
    is_published: !current,
    published_at: !current ? new Date().toISOString() : null,
  }).eq('id', id);
}

export async function deleteArticleById(id: string) {
  const supabase = await createAdminClient();
  await supabase.from('mo_articles').delete().eq('id', id);
}

export async function getArticleById(id: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase.from('mo_articles').select('*').eq('id', id).single();
  return data || null;
}

export async function updateArticle(id: string, data: {
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
  const { error } = await supabase.from('mo_articles').update(data).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

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
