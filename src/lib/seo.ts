import type { Metadata } from 'next';

// ── Constants ─────────────────────────────────────────────────────────────────

export const SITE_BASE = 'https://mommyoffice.com';
export const SITE_NAME = 'MommyOffice';

const LOCALES = ['mn', 'en'] as const;
type Locale = (typeof LOCALES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetadataOptions {
  /** Page title (WITHOUT the "| MommyOffice" suffix — added automatically) */
  title: string;
  description: string;
  locale: Locale | string;
  /** Full path starting with /locale, e.g. "/mn/articles/my-slug" */
  path: string;
  /** Absolute URL or root-relative path to OG image (defaults to /og-image.png) */
  image?: string;
  type?: 'website' | 'article';
  /** ISO 8601 — only used when type === 'article' */
  publishedTime?: string;
  modifiedTime?: string;
}

// ── Core metadata builder ─────────────────────────────────────────────────────

/**
 * Centralised Next.js Metadata builder — handles OG, Twitter cards, hreflang
 * alternates and canonical for every dynamic route.
 *
 * Usage (in any generateMetadata):
 *   return buildMetadata({ title, description, locale, path: `/${locale}/articles/${slug}`, type: 'article' });
 */
export function buildMetadata({
  title,
  description,
  locale,
  path,
  image = '/og-image.png',
  type = 'website',
  publishedTime,
  modifiedTime,
}: MetadataOptions): Metadata {
  const canonical = `${SITE_BASE}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${SITE_BASE}${image}`;
  const ogLocale = locale === 'mn' ? 'mn_MN' : 'en_US';

  // Build hreflang alternates for the two supported locales
  const altLocale: Locale = locale === 'mn' ? 'en' : 'mn';
  const altPath = path.replace(new RegExp(`^/${locale}/`), `/${altLocale}/`);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      type,
      siteName: SITE_NAME,
      locale: ogLocale,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime  ? { modifiedTime  } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical,
      languages: {
        [locale]: canonical,
        [altLocale]: `${SITE_BASE}${altPath}`,
      },
    },
  };
}

// ── JSON-LD schema builders ───────────────────────────────────────────────────

/**
 * Schema.org WebSite — place once in the root layout.
 * Enables Google's Sitelinks Searchbox and signals the site's identity.
 */
export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_BASE,
    description: 'Монголын №1 Эмэгтэйчүүдийн Платформ — онлайн сургалт, нийтлэл, lifestyle',
    inLanguage: ['mn', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_BASE}/mn/articles?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Schema.org Organization — place once in the root layout.
 * Surfaces the brand in Google's Knowledge Panel.
 */
export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_BASE,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_BASE}/squarelogo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://www.facebook.com/mommyoffice.mn',
      'https://www.instagram.com/mommyoffice.mn',
    ],
  };
}

/**
 * Schema.org Article — add to every article detail page.
 * Enables Google's Article rich results and improves crawl understanding.
 */
export function jsonLdArticle(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  publishedAt: string | null;
  authorName: string;
}) {
  const imageUrl = opts.image.startsWith('http') ? opts.image : `${SITE_BASE}${opts.image}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    image: imageUrl,
    url: opts.url,
    ...(opts.publishedAt ? { datePublished: opts.publishedAt } : {}),
    author: {
      '@type': 'Person',
      name: opts.authorName || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_BASE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_BASE}/squarelogo.png`,
      },
    },
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_BASE,
    },
  };
}
