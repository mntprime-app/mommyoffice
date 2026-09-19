import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { jsonLdWebSite, jsonLdOrganization } from '@/lib/seo';
import './globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mommyoffice.com'),
  title: {
    default: "MommyOffice — Монголын №1 Эмэгтэйчүүдийн Платформ",
    template: '%s | MommyOffice',
  },
  description: "Онлайн сургалт, нийтлэл, lifestyle — Монголын эмэгтэйчүүдэд зориулсан №1 платформ",
  keywords: ['онлайн сургалт', 'монгол сургалт', 'mommyoffice', 'эмэгтэйчүүд', 'хичээл', 'онлайн хичээл монгол'],
  authors: [{ name: 'MommyOffice', url: 'https://mommyoffice.com' }],
  creator: 'MommyOffice',
  publisher: 'MommyOffice',
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  openGraph: {
    type: 'website',
    siteName: 'MommyOffice',
    locale: 'mn_MN',
    url: 'https://mommyoffice.com',
    title: "MommyOffice — Монголын №1 Эмэгтэйчүүдийн Платформ",
    description: "Онлайн сургалт, нийтлэл, lifestyle — Монголын эмэгтэйчүүдэд зориулсан №1 платформ",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MommyOffice' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "MommyOffice — Монголын №1 Эмэгтэйчүүдийн Платформ",
    description: "Онлайн сургалт, нийтлэл, lifestyle — Монголын эмэгтэйчүүдэд зориулсан №1 платформ",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={notoSans.variable}>
      <head>
        <link rel="icon" href="/squarelogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/squarelogo.png" />
        <meta name="theme-color" content="#0d1117" />
        {/* Global structured data — visible to crawlers on every page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization()) }}
        />
      </head>
      <body>
        {children}
        {GA_ID && <GoogleAnalytics measurementId={GA_ID} />}
      </body>
    </html>
  );
}
