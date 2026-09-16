import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const handleI18n = createMiddleware(routing);

// ── Shared admin identity check (used by both page-route and API-route guards) ──
async function verifyAdmin(request: NextRequest): Promise<{ user: { email?: string | null } } | null> {
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
  if (!user) return null;
  const rawList = process.env.ADMIN_EMAILS || 'info.mommyoffice@gmail.com';
  const allowed = rawList.split(',').map((e) => e.trim().toLowerCase());
  if (!allowed.includes((user.email ?? '').toLowerCase())) return null;
  return user;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Guard: privileged API routes — return 401 JSON if not admin ─────────────
  // Covers /api/admin/* and other admin-only endpoint paths.
  const privilegedApiPattern = /^\/(api\/admin\/|api\/video\/request-upload|api\/course-staging\/presign)/;
  if (privilegedApiPattern.test(pathname)) {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next({ request });
  }

  // ── Guard: /[locale]/admin/* (except /admin/login) — redirect to login ───────
  const adminPattern = /^\/(mn|en)\/admin(\/(?!login).*)?$/;
  if (adminPattern.test(pathname)) {
    const user = await verifyAdmin(request);
    const locale = pathname.split('/')[1] || 'mn';
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
    return NextResponse.next({ request });
  }

  // ── All other routes: let next-intl handle locale routing ───────────────────
  return handleI18n(request);
}

export const config = {
  // Include /api/admin/* in the matcher so the guard above runs for those routes.
  // All other /api/* and static asset routes are still excluded.
  matcher: [
    '/api/admin/:path*',
    '/api/video/request-upload',
    '/api/course-staging/presign',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
