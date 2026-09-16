import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const handleI18n = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Guard: /[locale]/admin/* (except /admin/login) ──────────────────────────
  const adminPattern = /^\/(mn|en)\/admin(\/(?!login).*)?$/;
  if (adminPattern.test(pathname)) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const locale = pathname.split('/')[1] || 'mn';

    // Gate 1: must be logged in
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }

    // Gate 2: must be an allowed admin email (defence-in-depth — blocks any
    // Supabase account that isn't the owner, even if signups are accidentally open).
    // Falls back to the owner address so the gate is always active even without the env var.
    const rawList = process.env.ADMIN_EMAILS || 'info.mommyoffice@gmail.com';
    const allowed = rawList.split(',').map((e) => e.trim().toLowerCase());
    if (!allowed.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }

    return response;
  }

  // ── All other routes: let next-intl handle locale routing ───────────────────
  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
