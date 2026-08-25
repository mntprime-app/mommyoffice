import Link from 'next/link';

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛍️</div>
        <div style={{
          display: 'inline-block', marginBottom: '1.25rem',
          fontSize: '10px', fontWeight: 800, color: '#00B5AD',
          border: '1px solid rgba(0,181,173,0.4)',
          padding: '3px 12px', borderRadius: '4px',
          letterSpacing: '2px', textTransform: 'uppercase',
        }}>
          Тун удахгүй
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem', lineHeight: 1.2 }}>
          Дэлгүүр
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, marginBottom: '2rem' }}>
          Гоо сайхан, эрүүл мэнд болон хүүхэд хамгааллын сонгомол бүтээгдэхүүнүүд удахгүй та бүхэнд хүрч ирнэ. Шинэ бүтээгдэхүүн нэмэгдэх бүрт мэдэгдэл авахын тулд бүртгүүлээрэй.
        </p>
        <Link href={`/${locale}/courses`} style={{
          display: 'inline-block',
          background: '#00B5AD', color: '#fff',
          padding: '12px 28px', borderRadius: '10px',
          fontWeight: 700, textDecoration: 'none', fontSize: '15px',
        }}>
          Сургалтуудыг үзэх →
        </Link>
      </div>
    </main>
  );
}
