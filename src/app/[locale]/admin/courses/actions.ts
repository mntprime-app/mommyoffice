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

export async function deleteCourse(id: string) {
  const supabase = await createAdminClient();
  await supabase.from('mo_courses').delete().eq('id', id);
}
