import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

// next-intl handles locale detection + routing
const handleI18n = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Guard: /[locale]/admin/* (except /admin/login) ──────────────────────────
  const adminPattern = /^\/(mn|en)\/admin(\/(?!login).*)?$/;
  const isAdminRoute = adminPattern.test(pathname);

  if (isAdminRoute) {
    // Build a response to pass cookies through (Supabase SSR pattern)
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
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
      // Extract locale from pathname (first segment)
      const locale = pathname.split('/')[1] || 'mn';
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ── All other routes: let next-intl handle locale routing ───────────────────
  return handleI18n(request);
}

export const config = {
  // Match all paths except static files, API routes, and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
