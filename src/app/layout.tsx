import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Mommyoffice",
  description: "Mongolia's #1 women's lifestyle and learning platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
