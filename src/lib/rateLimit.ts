/**
 * Simple in-memory IP rate limiter for Vercel serverless functions.
 * Each function instance has its own Map (no shared state across instances),
 * but combined with DB-level email rate limiting this provides adequate protection.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check and increment rate limit for a given key (e.g. IP address).
 * Returns { limited: true } if the limit is exceeded, { limited: false } otherwise.
 *
 * @param key      - Unique key (IP address or composite key)
 * @param limit    - Max requests allowed in the window
 * @param windowMs - Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { limited: true, remaining: 0 };
  }

  entry.count++;
  return { limited: false, remaining: limit - entry.count };
}

/** Get the client IP from a Next.js request (works on Vercel). */
export function getClientIp(req: Request): string {
  const headers = new Headers((req as unknown as { headers: Headers }).headers);
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
