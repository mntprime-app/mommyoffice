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
  return {
    title: {
      default: "Mommyoffice — Mongolia's #1 Women's Platform",
      template: '%s | Mommyoffice',
    },
    description: isMn
      ? 'Хичээл, нийтлэл, lifestyle — Монголын эмэгтэйчүүдэд зориулсан №1 платформ'
      : "Courses, articles, and lifestyle content for Mongolian women — Mongolia's #1 platform",
    openGraph: {
      siteName: 'Mommyoffice',
      locale: isMn ? 'mn_MN' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `https://mommyoffice.com/${locale}`,
      languages: {
        'mn': 'https://mommyoffice.com/mn',
        'en': 'https://mommyoffice.com/en',
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
