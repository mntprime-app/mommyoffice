import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  // Prevent the site from being embedded in iframes (clickjacking protection)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send referrer on same origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict powerful browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS for 1 year (only active in production with domain)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Content Security Policy — allow Supabase, Cloudflare Stream, YouTube, Brevo assets
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://customer-*.cloudflarestream.com https://embed.cloudflarestream.com https://iframe.cloudflarestream.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://i.ytimg.com https://img.youtube.com https://images.unsplash.com https://customer-*.cloudflarestream.com https://qpay.mn https://*.qpay.mn https://www.google-analytics.com https://www.googletagmanager.com",
      "media-src 'self' blob: https://customer-*.cloudflarestream.com https://*.supabase.co https://*.supabase.in",
      "frame-src https://customer-*.cloudflarestream.com https://embed.cloudflarestream.com https://iframe.cloudflarestream.com https://www.youtube.com https://youtube.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://merchant.qpay.mn https://api.brevo.com https://customer-*.cloudflarestream.com https://iframe.cloudflarestream.com https://upload.cloudflarestream.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net",
      "font-src 'self' data:",
      "worker-src blob:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: '**.supabase.co' },
      { protocol: 'https' as const, hostname: '**.supabase.in' },
      { protocol: 'https' as const, hostname: 'i.ytimg.com' },
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        // Security headers on all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Long-lived cache for hashed static assets (_next/static is content-addressed)
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Cache public images for 7 days
        source: '/(logo|whitelogo|squarelogo|og-image)(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // Sitemap and robots can be cached for 24h
        source: '/(sitemap.xml|robots.txt)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' }],
      },
    ];
  },
  // Compress responses (Vercel enables Gzip/Brotli by default, this ensures it for self-hosted)
  compress: true,
};

export default withNextIntl(nextConfig);
