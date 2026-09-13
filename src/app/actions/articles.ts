'use server';
import { createClient } from '@/lib/supabase/server';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ArticleComment = {
  id: string;
  article_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  body: string;
  created_at: string;
};

// ─── GET COMMENTS ─────────────────────────────────────────────────────────────

export async function getArticleComments(articleId: string): Promise<ArticleComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mo_article_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────

export async function addArticleComment(
  articleId: string,
  body: string,
): Promise<{ comment: ArticleComment | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { comment: null, error: 'Нэвтрэх шаардлагатай.' };

  const { data, error } = await supabase
    .from('mo_article_comments')
    .insert({
      article_id: articleId,
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: user.user_metadata?.full_name ?? null,
      body,
    })
    .select()
    .single();

  if (error) return { comment: null, error: error.message };
  return { comment: data, error: null };
}

// ─── DELETE COMMENT (own only) ────────────────────────────────────────────────

export async function deleteArticleComment(
  commentId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Нэвтрэх шаардлагатай.' };

  const { error } = await supabase
    .from('mo_article_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  return { error: error?.message ?? null };
}

// ─── GET CURRENT USER'S REACTION ─────────────────────────────────────────────

export async function getMyArticleReaction(
  articleId: string,
): Promise<'super' | 'up' | 'down' | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('mo_article_reactions')
      .select('type')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .maybeSingle();
    return (data?.type as 'super' | 'up' | 'down') ?? null;
  } catch { return null; }
}

// ─── REACT TO ARTICLE ─────────────────────────────────────────────────────────

export async function reactToArticle(
  articleId: string,
  type: 'super' | 'up' | 'down',
): Promise<{
  counts: { super_likes_count: number; upvotes_count: number; downvotes_count: number } | null;
  error: string | null;
  alreadyReacted?: boolean;
}> {
  const supabase = await createClient();

  // Auth required — same pattern as comments
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { counts: null, error: 'Нэвтрэх шаардлагатай.' };

  // Insert into junction table — PRIMARY KEY (article_id, user_id) enforces uniqueness at DB level
  const { error: insertError } = await supabase
    .from('mo_article_reactions')
    .insert({ article_id: articleId, user_id: user.id, type });

  if (insertError) {
    // Postgres unique violation code — already reacted
    if (insertError.code === '23505') return { counts: null, error: null, alreadyReacted: true };
    return { counts: null, error: insertError.message };
  }

  // Recount from junction table (source of truth) and sync to article columns for card display
  const { data: rows } = await supabase
    .from('mo_article_reactions')
    .select('type')
    .eq('article_id', articleId);

  const counts = {
    super_likes_count: rows?.filter(r => r.type === 'super').length ?? 0,
    upvotes_count:     rows?.filter(r => r.type === 'up').length ?? 0,
    downvotes_count:   rows?.filter(r => r.type === 'down').length ?? 0,
  };

  await supabase.from('mo_articles').update(counts).eq('id', articleId);
  return { counts, error: null };
}
