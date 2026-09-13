import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Холбоо барих | MommyOffice',
    description: 'MommyOffice-тай холбоо барих. Асуулт, санал хүсэлт болон хамтын ажиллагааны талаар бидэнтэй холбогдоорой.',
    openGraph: {
      title: 'Холбоо барих | MommyOffice',
      url: `https://mommyoffice.com/${locale}/contact`,
    },
    alternates: { canonical: `https://mommyoffice.com/${locale}/contact` },
    robots: { index: true, follow: true },
  };
}

const cardStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '12px',
  padding: '1.5rem',
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Холбоо барих — MommyOffice',
    url: `https://mommyoffice.com/${locale}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'MommyOffice',
      email: 'info.mommyoffice@gmail.com',
      sameAs: [
        'https://www.facebook.com/MommyofficeMN',
        'https://www.instagram.com/mommyoffice_mo/',
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 4rem', color: '#e5e5e5' }}>

        <nav aria-label="breadcrumb" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem' }}>
          <Link href={`/${locale}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нүүр</Link>
          {' / '}
          <span>Холбоо барих</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Холбоо барих
        </h1>
        <div style={{ width: '48px', height: '4px', background: '#00B5AD', borderRadius: '2px', marginBottom: '0.75rem' }} />
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: '560px' }}>
          Танд ямар нэг асуулт, санал хүсэлт байвал манай баг тантай холбогдоход бэлэн байна. Доорх хаягуудаар холбогдоорой.
        </p>

        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#00B5AD', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Ерөнхий асуулга
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, marginBottom: '1rem' }}>
              Платформтой холбоотой асуулт, санал гомдол болон бусад хүсэлтийн хувьд:
            </p>
            <a
              href="mailto:info.mommyoffice@gmail.com"
              style={{ color: '#00B5AD', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
            >
              📧 info.mommyoffice@gmail.com
            </a>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Бизнес хамтын ажиллагаа
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, marginBottom: '1rem' }}>
              Брэнд, бизнес эрхлэгчдийн хамтын ажиллагааны санал болон сурталчилгаатай холбоотой асуудлаар:
            </p>
            <a
              href="mailto:info.mommyoffice@gmail.com"
              style={{ color: '#9ca3af', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
            >
              📧 info.mommyoffice@gmail.com
            </a>
          </div>

        </div>

        {/* Response time */}
        <div style={{ background: 'rgba(0,181,173,0.06)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.8, margin: 0 }}>
            🕐 <strong style={{ color: '#e5e5e5' }}>Хариу өгөх хугацаа:</strong> Ажлын 1–2 өдрийн дотор хариу өгнө.
          </p>
        </div>

        {/* Social */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Нийгмийн сүлжээгээр холбогдох
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href="https://www.facebook.com/MommyofficeMN"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...cardStyle, textDecoration: 'none', color: '#e5e5e5', padding: '1rem 1.25rem' }}
            >
              <span style={{ fontSize: '1.25rem' }}>📘</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '0.15rem', color: '#fff' }}>Facebook</p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>facebook.com/MommyofficeMN</p>
              </div>
            </a>
            <a
              href="https://www.instagram.com/mommyoffice_mo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...cardStyle, textDecoration: 'none', color: '#e5e5e5', padding: '1rem 1.25rem' }}
            >
              <span style={{ fontSize: '1.25rem' }}>📷</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '0.15rem', color: '#fff' }}>Instagram</p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>@mommyoffice_mo</p>
              </div>
            </a>
          </div>
        </section>

      </main>
    </>
  );
}
