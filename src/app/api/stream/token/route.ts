/**
 * GET /api/stream/token?videoId=<cloudflare_stream_id>
 *
 * Returns a short-lived Cloudflare Stream signed token.
 * The client uses it as:
 *   https://customer-<SUBDOMAIN>.cloudflarestream.com/<TOKEN>/iframe
 *
 * Required env vars (Vercel + .env.local):
 *   CF_STREAM_KEY_ID        — from CF dashboard → Stream → Signing keys → Key ID
 *   CF_STREAM_KEY_SECRET    — base64url-encoded private key JWK (from same page)
 *   CF_CUSTOMER_SUBDOMAIN   — e.g. "abc123xyz" (from stream.cloudflare.com embed URL)
 *
 * Token expires in 4 hours. Domain restriction is enforced in CF dashboard
 * (Stream → video → Allowed origins: mommyoffice.com, mommyoffice-smoky.vercel.app).
 */

import { NextRequest, NextResponse } from 'next/server';

const KEY_ID     = process.env.CF_STREAM_KEY_ID     ?? '';
const KEY_SECRET = process.env.CF_STREAM_KEY_SECRET  ?? '';  // base64url JWK private key
const EXPIRES_IN = 4 * 60 * 60; // 4 hours in seconds

function base64url(data: ArrayBuffer | Buffer): string {
  return Buffer.from(data as ArrayBuffer)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signToken(videoId: string): Promise<string> {
  // Decode the base64url JWK private key Cloudflare gives us
  const jwkJson = Buffer.from(KEY_SECRET, 'base64').toString('utf-8');
  const jwk = JSON.parse(jwkJson);

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const header  = { alg: 'RS256', kid: KEY_ID };
  const payload = {
    sub: videoId,
    kid: KEY_ID,
    exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    // accessRules: restrict to signed access only
    accessRules: [
      { type: 'any', action: 'allow' },
    ],
  };

  const enc = (obj: object) =>
    base64url(Buffer.from(JSON.stringify(obj)));

  const sigInput = `${enc(header)}.${enc(payload)}`;
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    Buffer.from(sigInput),
  );

  return `${sigInput}.${base64url(sig)}`;
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  // ── Enrollment gate ────────────────────────────────────────────────────────
  // Read the HTTP-only session cookie set by /api/auth/verify-code
  const userEmail = req.cookies.get('mo_user_email')?.value ?? null;
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user has a valid access token for a course that contains this stream video
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const now = new Date().toISOString();

  // Check if the videoId is a course-level stream_id the user is enrolled in
  const { data: courseMatch } = await supabase
    .from('mo_access_tokens')
    .select(`course_id, mo_courses!inner(cloudflare_stream_id)`)
    .eq('email', userEmail)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(50);

  // Also check if videoId is a lesson-level stream_id within a course the user owns
  // We check course_outline_mn for any matching stream_id
  const enrolledCourseIds = (courseMatch ?? []).map((r) => r.course_id);

  let authorized = false;

  if (enrolledCourseIds.length > 0) {
    // Check course-level cloudflare_stream_id
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('id, cloudflare_stream_id, course_outline_mn')
      .in('id', enrolledCourseIds);

    for (const course of courses ?? []) {
      // Match course-level stream
      if (course.cloudflare_stream_id === videoId) { authorized = true; break; }

      // Match lesson-level stream inside course_outline_mn
      try {
        const outline = typeof course.course_outline_mn === 'string'
          ? JSON.parse(course.course_outline_mn)
          : course.course_outline_mn;
        if (Array.isArray(outline)) {
          for (const mod of outline) {
            for (const lesson of (mod?.lessons ?? [])) {
              if (lesson?.stream_id === videoId) { authorized = true; break; }
            }
            if (authorized) break;
          }
        }
      } catch { /* ignore parse errors */ }
      if (authorized) break;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ── End enrollment gate ────────────────────────────────────────────────────

  if (!KEY_ID || !KEY_SECRET) {
    return NextResponse.json(
      { error: 'CF_STREAM_KEY_ID / CF_STREAM_KEY_SECRET not configured' },
      { status: 503 },
    );
  }
  try {
    const token = await signToken(videoId);
    return NextResponse.json({ token }, {
      headers: { 'Cache-Control': 'private, max-age=14400' },
    });
  } catch (err) {
    console.error('[stream/token]', err);
    return NextResponse.json({ error: 'Token signing failed' }, { status: 500 });
  }
}
