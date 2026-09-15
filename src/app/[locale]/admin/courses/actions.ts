'use server';
import { createAdminClient } from '@/lib/supabase/server';

export async function listCourses() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('mo_courses')
    .select('id, title_mn, title_en, price, original_price, category, is_published, slug, placement, is_bestseller, created_at')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function toggleCoursePublish(id: string, current: boolean) {
  const supabase = await createAdminClient();
  await supabase.from('mo_courses').update({ is_published: !current }).eq('id', id);
}

export async function deleteCourse(id: string): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();

  // Cascade-delete child rows first — FK constraints block the course delete otherwise.
  // Order matters: reviews → access_tokens → orders → course
  const { error: e1 } = await supabase.from('mo_reviews').delete().eq('course_id', id);
  if (e1) return { error: `Үнэлгээ устгахад алдаа: ${e1.message}` };

  const { error: e2 } = await supabase.from('mo_access_tokens').delete().eq('course_id', id);
  if (e2) return { error: `Хандалтын токен устгахад алдаа: ${e2.message}` };

  const { error: e3 } = await supabase.from('mo_orders').delete().eq('course_id', id);
  if (e3) return { error: `Захиалга устгахад алдаа: ${e3.message}` };

  const { error: e4 } = await supabase.from('mo_courses').delete().eq('id', id);
  if (e4) return { error: `Хичээл устгахад алдаа: ${e4.message}` };

  return { error: null };
}
