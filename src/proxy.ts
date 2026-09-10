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
    if (!user) {
      const locale = pathname.split('/')[1] || 'mn';
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
