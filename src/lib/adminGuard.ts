import { createClient } from '@/lib/supabase/server';

/**
 * Throws if the calling user is not a verified admin.
 * Call at the top of any server action that reads or writes privileged data.
 * This is a second line of defence behind proxy.ts middleware.
 */
export async function assertAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const rawList = process.env.ADMIN_EMAILS || 'info.mommyoffice@gmail.com';
  const allowed = rawList.split(',').map((e) => e.trim().toLowerCase());
  if (!allowed.includes((user.email ?? '').toLowerCase())) {
    throw new Error('Forbidden');
  }
}
