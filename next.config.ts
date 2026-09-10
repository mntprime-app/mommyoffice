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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://customer-*.cloudflarestream.com https://embed.cloudflarestream.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://i.ytimg.com https://img.youtube.com https://images.unsplash.com https://customer-*.cloudflarestream.com",
      "media-src 'self' blob: https://customer-*.cloudflarestream.com",
      "frame-src https://customer-*.cloudflarestream.com https://embed.cloudflarestream.com https://www.youtube.com https://youtube.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://merchant.qpay.mn https://api.brevo.com https://customer-*.cloudflarestream.com",
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
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
