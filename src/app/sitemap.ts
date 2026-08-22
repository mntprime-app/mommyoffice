import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE = 'https://mommyoffice.com';
const LOCALES = ['mn', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPaths = ['', '/courses', '/articles'];
  for (const locale of LOCALES) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.8,
      });
    }
  }

  // Dynamic: courses
  try {
    const supabase = await createClient();
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (courses) {
      for (const course of courses) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE}/${locale}/courses/${course.slug}`,
            lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      }
    }
  } catch { /* no DB yet */ }

  // Dynamic: articles
  try {
    const supabase = await createClient();
    const { data: articles } = await supabase
      .from('mo_articles')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (articles) {
      for (const article of articles) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE}/${locale}/articles/${article.slug}`,
            lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      }
    }
  } catch { /* no DB yet */ }

  return entries;
}
