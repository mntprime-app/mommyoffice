import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';

const BASE = 'https://mommyoffice.com';
const LOCALES = ['mn', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ─────────────────────────────────────────────────────────────
  const staticPaths: Array<{ path: string; freq: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }> = [
    { path: '',           freq: 'daily',   priority: 1.0  },
    { path: '/courses',   freq: 'daily',   priority: 0.9  },
    { path: '/articles',  freq: 'daily',   priority: 0.8  },
    { path: '/videos',    freq: 'weekly',  priority: 0.7  },
    { path: '/about',     freq: 'monthly', priority: 0.5  },
    { path: '/contact',   freq: 'monthly', priority: 0.4  },
    { path: '/privacy',   freq: 'yearly',  priority: 0.3  },
    { path: '/terms',     freq: 'yearly',  priority: 0.3  },
  ];

  for (const locale of LOCALES) {
    for (const { path, freq, priority } of staticPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: freq,
        priority,
        alternates: {
          languages: Object.fromEntries(LOCALES.map(l => [l, `${BASE}/${l}${path}`])),
        },
      });
    }
  }

  // ── Dynamic: courses ──────────────────────────────────────────────────────────
  try {
    const supabase = await createAdminClient();
    const { data: courses } = await supabase
      .from('mo_courses')
      .select('slug, updated_at')
      .eq('is_published', true);

    for (const course of courses ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}/${locale}/courses/${course.slug}`,
          lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(LOCALES.map(l => [l, `${BASE}/${l}/courses/${course.slug}`])),
          },
        });
      }
    }
  } catch { /* no DB yet */ }

  // ── Dynamic: articles ─────────────────────────────────────────────────────────
  try {
    const supabase = await createAdminClient();
    const { data: articles } = await supabase
      .from('mo_articles')
      .select('slug, updated_at')
      .eq('is_published', true);

    for (const article of articles ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}/${locale}/articles/${article.slug}`,
          lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.65,
          alternates: {
            languages: Object.fromEntries(LOCALES.map(l => [l, `${BASE}/${l}/articles/${article.slug}`])),
          },
        });
      }
    }
  } catch { /* no DB yet */ }

  // ── Dynamic: videos ───────────────────────────────────────────────────────────
  try {
    const supabase = await createAdminClient();
    const { data: videos } = await supabase
      .from('mo_videos')
      .select('slug, updated_at')
      .not('slug', 'is', null);

    for (const video of videos ?? []) {
      if (!video.slug) continue;
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}/${locale}/videos/${video.slug}`,
          lastModified: video.updated_at ? new Date(video.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(LOCALES.map(l => [l, `${BASE}/${l}/videos/${video.slug}`])),
          },
        });
      }
    }
  } catch { /* no videos table or no slugs */ }

  return entries;
}
