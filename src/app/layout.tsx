import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: "Mommyoffice",
  description: "Mongolia's #1 women's lifestyle and learning platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={notoSans.variable}>
      <body>{children}</body>
    </html>
  );
}
