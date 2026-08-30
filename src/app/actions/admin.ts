'use server';
import { createAdminClient } from '@/lib/supabase/server';
import { SETTING_DEFAULTS } from '@/lib/constants';

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase.from('mo_site_settings').select('key, value');
    const result = { ...SETTING_DEFAULTS };
    if (data) data.forEach((row: { key: string; value: string }) => { result[row.key] = row.value; });
    return result;
  } catch { return { ...SETTING_DEFAULTS }; }
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase.from('mo_site_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

// ─── STORAGE UPLOAD (service role — bypasses bucket RLS) ──────────────────────

const BUCKET = 'mommyoffice-media';

export async function uploadImage(formData: FormData, folder: string): Promise<{ error: string | null; url: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'Файл олдсонгүй', url: null };

  const supabase = await createAdminClient();

  // Ensure bucket exists (service role can create it; ignores error if already exists)
  await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10485760 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg');
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { upsert: true, contentType: file.type || 'image/webp' });

  if (error) return { error: error.message, url: null };

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { error: null, url: publicUrl };
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

export async function getCourseById(id: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase.from('mo_courses').select('*').eq('id', id).single();
  return data || null;
}

export async function getInstructors() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('mo_instructors')
    .select('id, name_mn, name_en, title_mn')
    .order('name_mn');
  return data || [];
}

export async function createInstructorApplication(data: {
  name_mn: string;
  name_en: string | null;
  title_mn: string | null;
  title_en: string | null;
  bio_mn: string | null;
  bio_en: string | null;
  profile_image_url: string | null;
  email: string;
  social_url: string | null;
}) {
  const supabase = await createAdminClient();
  // Check for duplicate email application
  const { data: existing } = await supabase
    .from('mo_instructors')
    .select('id')
    .eq('email', data.email)
    .maybeSingle();
  if (existing) return { error: 'Энэ имэйл хаягаар өргөдөл илгээгдсэн байна.' };

  const { error } = await supabase.from('mo_instructors').insert({
    ...data,
    is_approved: false,
    subscription_status: 'trial',
    onboarding_completed: false,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function listInstructors() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('mo_instructors')
    .select('id, name_mn, name_en, title_mn, title_en, bio_mn, bio_en, profile_image_url, subscription_status, is_approved, approved_at, onboarding_completed, created_at, user_id')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function approveInstructor(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_instructors')
    .update({
      is_approved: true,
      subscription_status: 'active',
      approved_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function suspendInstructor(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_instructors')
    .update({ is_approved: false, subscription_status: 'suspended' })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteInstructorById(id: string) {
  const supabase = await createAdminClient();
  await supabase.from('mo_instructors').delete().eq('id', id);
}

export async function getInstructorCourseCount(instructorId: string): Promise<number> {
  const supabase = await createAdminClient();
  const { count } = await supabase
    .from('mo_courses')
    .select('id', { count: 'exact', head: true })
    .eq('mo_instructor_id', instructorId)
    .eq('is_published', true);
  return count || 0;
}

export async function createCourse(data: {
  title_mn: string;
  title_en: string | null;
  description_mn: string | null;
  description_en: string | null;
  about_course_mn: string | null;
  about_course_en: string | null;
  what_you_learn_mn: string | null;
  what_you_learn_en: string | null;
  requirements_mn: string | null;
  requirements_en: string | null;
  price: number;
  original_price: number | null;
  access_duration_days: number;
  duration_minutes: number | null;
  lecture_count: number | null;
  download_count: number | null;
  exercise_count: number | null;
  has_certificate: boolean;
  is_bestseller: boolean;
  category: string;
  level_mn: string | null;
  cover_image_url: string | null;
  trailer_url: string | null;
  cloudflare_stream_id: string | null;
  slug: string;
  is_published: boolean;
  show_outline: boolean;
  placement: string;
  course_outline_mn: unknown[] | null;
  mo_instructor_id: string | null;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('mo_courses').insert(data);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateCourse(id: string, data: {
  title_mn: string;
  title_en: string;
  description_mn: string;
  description_en: string;
  about_course_mn: string;
  about_course_en: string;
  what_you_learn_mn: string | null;
  what_you_learn_en: string | null;
  requirements_mn: string | null;
  requirements_en: string | null;
  price: number;
  original_price: number;
  access_duration_days: number;
  duration_minutes: number | null;
  lecture_count: number | null;
  download_count: number | null;
  exercise_count: number | null;
  has_certificate: boolean;
  is_bestseller: boolean;
  category: string;
  level_mn: string | null;
  slug: string;
  cover_image_url: string;
  trailer_url: string;
  cloudflare_stream_id: string;
  is_published: boolean;
  show_outline: boolean;
  placement: string;
  course_outline_mn: unknown[] | null;
  mo_instructor_id: string | null;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_courses')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteCourseById(id: string) {
  const supabase = await createAdminClient();
  await supabase.from('mo_courses').delete().eq('id', id);
}

// ─── VIDEOS ───────────────────────────────────────────────────────────────────

export async function listVideos() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('mo_videos')
    .select('id, title_mn, youtube_id, cloudflare_stream_id, category, duration_text, view_count, is_published, is_featured, video_type, created_at')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function createVideo(data: {
  title_mn: string;
  title_en: string | null;
  slug: string;
  description_mn: string | null;
  description_en: string | null;
  youtube_id: string | null;
  cloudflare_stream_id: string | null;
  thumbnail_url: string | null;
  duration_text: string;
  category: string;
  video_type: string;
  is_published: boolean;
  is_featured: boolean;
  placement: string;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('mo_videos').insert(data);
  if (error) return { error: error.message };
  return { error: null };
}

export async function toggleVideoPublished(id: string, current: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_videos')
    .update({ is_published: !current })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteVideoById(id: string) {
  const supabase = await createAdminClient();
  await supabase.from('mo_videos').delete().eq('id', id);
}

export async function getVideoById(id: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase.from('mo_videos').select('*').eq('id', id).single();
  return data || null;
}

export async function updateVideo(id: string, data: {
  title_mn: string;
  title_en: string | null;
  slug: string;
  description_mn: string | null;
  description_en: string | null;
  youtube_id: string | null;
  cloudflare_stream_id: string | null;
  thumbnail_url: string | null;
  duration_text: string;
  category: string;
  video_type: string;
  is_published: boolean;
  is_featured: boolean;
  placement: string;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_videos')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
