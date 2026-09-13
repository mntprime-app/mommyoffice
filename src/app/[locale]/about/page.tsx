import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Бидний тухай | MommyOffice',
    description:
      'MommyOffice бол Монголын ээжүүд, охид бүсгүйчүүд болон гэр бүлүүдэд зориулсан амьдралын хэв маяг, хөгжил, боловсрол, цахим худалдааны цогц платформ юм.',
    keywords: ['MommyOffice', 'Монголын эмэгтэйчүүд', 'ээжүүд платформ', 'онлайн сургалт', 'бидний тухай'],
    openGraph: {
      title: 'Бидний тухай | MommyOffice',
      description: 'Монголын ээжүүд болон эмэгтэйчүүдэд зориулсан №1 цахим платформ.',
      url: `https://mommyoffice.com/${locale}/about`,
      siteName: 'MommyOffice',
      type: 'website',
    },
    alternates: { canonical: `https://mommyoffice.com/${locale}/about` },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Бидний тухай — MommyOffice',
    url: `https://mommyoffice.com/${locale}/about`,
    description:
      'MommyOffice бол Монголын ээжүүд болон эмэгтэйчүүдэд зориулсан хөгжил, боловсрол, цахим худалдааны цогц платформ.',
    mainEntity: {
      '@type': 'Organization',
      name: 'MommyOffice',
      url: 'https://mommyoffice.com',
      logo: 'https://mommyoffice.com/whitelogo.png',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 4rem', color: '#e5e5e5' }}>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem' }}>
          <Link href={`/${locale}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нүүр</Link>
          {' / '}
          <span>Бидний тухай</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Бидний тухай
        </h1>
        <div style={{ width: '48px', height: '4px', background: '#00B5AD', borderRadius: '2px', marginBottom: '2.5rem' }} />

        {/* What is MommyOffice */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            MommyOffice гэж юу вэ?
          </h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.85 }}>
            MommyOffice бол Монголын өнцөг булан бүрт буй ээжүүд, охид бүсгүйчүүд болон гэр бүлүүдэд зориулсан
            амьдралын хэв маяг, хөгжил, боловсрол, цахим худалдааны цогц платформ юм. Бид эмэгтэйчүүдэд гэртээ
            байхдаа суралцах, өөрийгөө хөгжүүлэх, хэрэгцээт мэдээллээ цаг алдалгүй авах боломжийг олгох
            зорилготойгоор үүсэн байгуулагдсан билээ.
          </p>
        </section>

        {/* Problem */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Бидний шийдэж буй асуудал
          </h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.85 }}>
            Орчин үеийн ээжүүд, эмэгтэйчүүдэд хүүхэд асаргаа, гэр орны ажил болон хувь хүний хөгжил, карьераа авч
            явах амьдралын олон үүрэг амжилттай хослуулах шаардлага тулгардаг. Гэсэн хэдий ч цаг зав хомс байх,
            чанартай зөв мэдээлэл олж авах эх сурвалж дутмаг байх зэрэг сорилтууд цөөнгүй байдаг. MommyOffice нь
            энэхүү орон зайг нөхөж, таны хайж буй бүхнийг нэг дор төвлөрүүлсэн найдвартай туслах байх болно.
          </p>
        </section>

        {/* Mission & Vision */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(0,181,173,0.07)', border: '1px solid rgba(0,181,173,0.25)', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#00B5AD', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Эрхэм зорилго · Mission
            </p>
            <p style={{ fontSize: '15px', color: '#e5e5e5', lineHeight: 1.75 }}>
              Монголын ээжүүд болон эмэгтэйчүүдийг мэдлэг боловсролоор дэмжиж, сэтгэл санааны болон эдийн засгийн
              хувьд бие даасан, өөртөө итгэлтэй, аз жаргалтай амьдрахад нь туслах.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Алсын харагдлал · Vision
            </p>
            <p style={{ fontSize: '15px', color: '#e5e5e5', lineHeight: 1.75 }}>
              Монголын хамгийн өндөр хандалттай, олон талт, эрэлттэй гэр бүл болон эмэгтэйчүүдэд зориулсан
              цахим экосистем байх.
            </p>
          </div>
        </div>

        {/* Services */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
            Бид ямар үйлчилгээ санал болгодог вэ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { emoji: '🎓', title: 'Онлайн сургалтууд', desc: 'Эмэгтэйчүүдэд зориулсан хувь хүний хөгжил, гадаад хэл, гэр ахуй, эрүүл мэнд болон бусад ур чадварын практик сургалтууд.' },
              { emoji: '📰', title: 'Нийтлэлүүд', desc: 'Хүүхэд хүмүүжүүлэх ухаан, гэр бүлийн нандин харилцаа, эрүүл мэнд болон амьдралын зөв хэв маягийн тухай хэрэгтэй зөвлөгөө, сонирхолтой мэдээллүүд.' },
              { emoji: '🎬', title: 'Кино & Видео', desc: 'Чөлөөт цагаа үр дүнтэй өнгөрүүлэхэд зориулсан төрөл бүрийн сонирхолтой контент, видео бүтээлүүд.' },
              { emoji: '🛍️', title: 'Онлайн дэлгүүр (тун удахгүй)', desc: 'Гоо сайхан, эрүүл мэнд, хүүхэд болон гэр бүлийн хэрэгцээний сонгомол бараа бүтээгдэхүүнийг танд хүргэх болно.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#e5e5e5', marginBottom: '0.25rem', fontSize: '15px' }}>{title}</p>
                  <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* For businesses */}
        <section style={{ background: 'rgba(0,181,173,0.06)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '12px', padding: '1.75rem', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            Бизнес эрхлэгч, брэндүүдэд
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.8 }}>
            Бид зөвхөн хэрэглэгчдэд зориулаад зогсохгүй, өөрийн бүтээгдэхүүн, үйлчилгээг зорилтот хэрэглэгчдэдээ
            буюу Монголын хамгийн өндөр идэвхтэй ээж, эмэгтэйчүүдэд шууд хүргэх хүсэлтэй бизнес эрхлэгч,
            брэндүүдэд нээлттэй хамтын ажиллагааны боломжийг санал болгодог.
          </p>
          <a href="mailto:info.mommyoffice@gmail.com" style={{ display: 'inline-block', marginTop: '1rem', color: '#00B5AD', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            📧 info.mommyoffice@gmail.com →
          </a>
        </section>

      </main>
    </>
  );
}
