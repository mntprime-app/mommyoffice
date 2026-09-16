import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/mn/admin/',
          '/en/admin/',
          '/api/',
          '/mn/checkout/',
          '/en/checkout/',
          '/mn/my-courses/',
          '/en/my-courses/',
          '/mn/user/',
          '/en/user/',
          '/mn/access/',
          '/en/access/',
          '/mn/welcome/',
          '/en/welcome/',
        ],
      },
    ],
    sitemap: 'https://mommyoffice.com/sitemap.xml',
    host: 'https://mommyoffice.com',
  };
}
