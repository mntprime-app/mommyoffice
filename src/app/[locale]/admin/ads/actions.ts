'use server';
import { createAdminClient } from '@/lib/supabase/server';

type AdPayload = {
  slot?: string;
  title?: string | null;
  target_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  mobile_image_url?: string | null;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export async function listAds() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('mo_ads')
    .select('id, slot, title, target_url, media_url, media_type, mobile_image_url, is_active, starts_at, ends_at, created_at')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createAd(payload: AdPayload): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('mo_ads').insert(payload);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateAd(id: string, payload: AdPayload): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('mo_ads')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteAd(id: string): Promise<{ error: string | null }> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('mo_ads').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
