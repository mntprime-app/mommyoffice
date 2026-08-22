import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/mn/admin/', '/en/admin/', '/api/'],
    },
    sitemap: 'https://mommyoffice.com/sitemap.xml',
  };
}
