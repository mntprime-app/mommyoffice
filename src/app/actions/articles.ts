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

// ─── REACT TO ARTICLE ─────────────────────────────────────────────────────────

export async function reactToArticle(
  articleId: string,
  type: 'super' | 'up' | 'down',
): Promise<{ counts: { super_likes_count: number; upvotes_count: number; downvotes_count: number } | null; error: string | null }> {
  const supabase = await createClient();

  const col = type === 'super' ? 'super_likes_count' : type === 'up' ? 'upvotes_count' : 'downvotes_count';

  // Increment via RPC — avoids race conditions
  const { data, error } = await supabase.rpc('increment_article_reaction', {
    p_article_id: articleId,
    p_column: col,
  });

  if (error) {
    // Fallback: manual increment
    const { data: cur } = await supabase
      .from('mo_articles')
      .select('super_likes_count, upvotes_count, downvotes_count')
      .eq('id', articleId)
      .single();

    if (!cur) return { counts: null, error: error.message };

    const updated = {
      super_likes_count: cur.super_likes_count ?? 0,
      upvotes_count: cur.upvotes_count ?? 0,
      downvotes_count: cur.downvotes_count ?? 0,
    };
    updated[col as keyof typeof updated] += 1;

    await supabase.from('mo_articles').update(updated).eq('id', articleId);
    return { counts: updated, error: null };
  }

  return { counts: data, error: null };
}
