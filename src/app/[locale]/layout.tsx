import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isMn = locale === 'mn';

  const title = isMn
    ? 'MommyOffice — Монголын №1 Эмэгтэйчүүдийн Платформ'
    : "MommyOffice — Mongolia's #1 Women's Platform";
  const description = isMn
    ? 'Онлайн хичээл, нийтлэл, lifestyle — Монголын эмэгтэйчүүдэд зориулсан №1 платформ. Хоол, гоо сайхан, эрүүл мэнд, бизнес, хувийн хөгжил.'
    : "Online courses, articles, and lifestyle content for Mongolian women — Mongolia's #1 platform.";

  return {
    title: { default: title, template: '%s | MommyOffice' },
    description,
    keywords: isMn
      ? ['онлайн сургалт монгол', 'монгол онлайн хичээл', 'mommyoffice', 'эмэгтэйчүүдийн платформ', 'хоол хийх сургалт', 'гоо сайхан', 'бизнес сургалт']
      : ['mongolian online courses', 'mommyoffice', 'mongolia women platform', 'online learning mongolia'],
    openGraph: {
      siteName: 'MommyOffice',
      locale: isMn ? 'mn_MN' : 'en_US',
      type: 'website',
      url: `https://mommyoffice.com/${locale}`,
      title,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MommyOffice' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://mommyoffice.com/${locale}`,
      languages: {
        'mn': 'https://mommyoffice.com/mn',
        'en': 'https://mommyoffice.com/en',
        'x-default': 'https://mommyoffice.com/mn',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'mn' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main style={{ overflowX: 'hidden', maxWidth: '100vw' }}>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
