import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieItem = { name: string; value: string; options?: Record<string, unknown> };

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {}
        },
      },
    }
  );
}

export async function createAdminClient() {
  // Must use @supabase/supabase-js createClient directly — NOT createServerClient.
  // createServerClient (@supabase/ssr) adds cookie-based auth headers that interfere
  // with service_role bypass. Raw createClient with service_role_key is the only
  // reliable way to bypass RLS for admin table operations.
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
