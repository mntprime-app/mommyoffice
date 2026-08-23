import type { Metadata } from 'next';
import { CartView } from '@/components/ui/CartView';

export const metadata: Metadata = {
  title: 'Сагс | Mommyoffice',
  description: 'Таны сургалтын сагс',
};

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
      <h1 style={{
        fontSize: '26px', fontWeight: 800, color: '#e5e5e5',
        marginBottom: '32px',
      }}>
        🛒 Миний сагс
      </h1>
      <CartView locale={locale} />
    </main>
  );
}
