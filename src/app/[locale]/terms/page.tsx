import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Үйлчилгээний нөхцөл | MommyOffice',
    description: 'MommyOffice платформын үйлчилгээний нөхцөл. Бүртгэл, төлбөр, буцаалт болон платформ ашиглалтын дүрмийг уншина уу.',
    openGraph: {
      title: 'Үйлчилгээний нөхцөл | MommyOffice',
      url: `https://mommyoffice.com/${locale}/terms`,
    },
    alternates: { canonical: `https://mommyoffice.com/${locale}/terms` },
    robots: { index: true, follow: true },
  };
}

const h2Style: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.875rem' };
const pStyle: React.CSSProperties = { fontSize: '15px', color: '#9ca3af', lineHeight: 1.85, marginBottom: '0.75rem' };
const liStyle: React.CSSProperties = { fontSize: '15px', color: '#9ca3af', lineHeight: 1.8, marginBottom: '0.4rem' };
const sectionStyle: React.CSSProperties = { marginBottom: '2.5rem' };

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem 4rem', color: '#e5e5e5' }}>

      <nav aria-label="breadcrumb" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem' }}>
        <Link href={`/${locale}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нүүр</Link>
        {' / '}
        <span>Үйлчилгээний нөхцөл</span>
      </nav>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
        Үйлчилгээний нөхцөл
      </h1>
      <div style={{ width: '48px', height: '4px', background: '#00B5AD', borderRadius: '2px', marginBottom: '0.75rem' }} />
      <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '2.5rem' }}>
        Хүчин төгөлдөр байх огноо: 2026 он · Монгол Улсын Иргэний хууль болон цахим орчны хууль тогтоомжид нийцүүлэн боловсруулав.
      </p>

      <p style={pStyle}>
        MommyOffice платформд тавтай морилно уу. Манай вэбсайтаар үйлчлүүлснээр та доорх нөхцөлүүдийг хүлээн зөвшөөрсөнд тооцогдох тул анхааралтай уншина уу.
      </p>

      <section style={sectionStyle}>
        <h2 style={h2Style}>1. Ерөнхий нөхцөл</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>Энэхүү вэбсайтыг ашиглаж буй хэрэглэгч нь Монгол Улсын болон олон улсын цахим орчны хэм хэмжээг дагаж мөрдөх үүрэгтэй.</li>
          <li style={liStyle}>MommyOffice нь шаардлагатай тохиолдолд үйлчилгээний нөхцөлд өөрчлөлт оруулах эрхтэй бөгөөд шинэчилсэн нөхцөл нь вэбсайт дээр нийтлэгдсэн үеэсээ хүчин төгөлдөр болно.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>2. Бүртгэл ба нэвтрэлт</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>Хэрэглэгч системд нэвтрэхдээ үнэн зөв имэйл хаяг болон мэдээллээ оруулах ёстой.</li>
          <li style={liStyle}>Нууцлал болон нэвтрэх код (OTP/Magic Link)-ын аюулгүй байдлыг хангах нь хэрэглэгч өөрөө хариуцна.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>3. Төлбөр, буцаалт болон цуцлалтын нөхцөл</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>
            <strong style={{ color: '#e5e5e5' }}>Сургалт худалдан авах:</strong>{' '}
            Хэрэглэгч хүссэн сургалтаа сонгон QPay болон бусад санал болгож буй төлбөрийн хэрэгслүүдээр төлбөрөө бүрэн барагдуулснаар тухайн контент руу хандах эрх үүснэ.
          </li>
          <li style={liStyle}>
            <strong style={{ color: '#e5e5e5' }}>Буцаалтын нөхцөл:</strong>{' '}
            Дижитал контент (онлайн сургалт, видео) шууд идэвхжиж, хэрэглэгчид хүрдэг онцлогтой тул худалдан авсны дараа төлбөрийг буцаан олгох боломжгүйг анхаарна уу.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>4. Хориглогдсон үйлдлүүд</h2>
        <p style={pStyle}>Хэрэглэгч дараах үйлдлийг хийхийг хатуу хориглоно:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>Худалдаж авсан сургалтын эрхийг бусдад дамжуулах, олон нийтийн сүлжээнд задлах, хууль бусаар хуулбарлах</li>
          <li style={liStyle}>Вэбсайтын хэвийн үйл ажиллагаанд санаатайгаар саад учруулах, хакердах оролдлого хийх</li>
          <li style={liStyle}>Бусдын эрх ашгийг хөндсөн зохисгүй контент байрлуулах</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>5. Оюуны өмчийн эрх</h2>
        <p style={pStyle}>
          MommyOffice платформ дээр байрлаж буй бүх сургалт, видео, нийтлэл, лого, дизайн болон бусад контент нь
          Монгол Улсын Оюуны өмчийн хуулиар хамгаалагдсан бөгөөд зөвшөөрөлгүйгээр хуулбарлах, арилжааны
          зорилгоор ашиглахыг хориглоно.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>6. Хариуцлагын хязгаарлалт</h2>
        <p style={pStyle}>
          MommyOffice нь интернет холболтын доголдол, гуравдагч талын үйлчилгээний саатал (жишээ нь банкны сүлжээ
          унах гэх мэт)-ээс үүдэн гарсан хохирлыг хариуцахгүй. Мөн хэрэглэгч сургалтаас олж авсан мэдлэгээ хэрхэн
          ашигласнаас шалтгаалан гарах үр дүнд платформ хариуцлага хүлээхгүй.
        </p>
      </section>

      <section style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
        <h2 style={{ ...h2Style, marginBottom: '0.5rem' }}>7. Холбоо барих</h2>
        <p style={{ ...pStyle, marginBottom: 0 }}>
          Үйлчилгээний нөхцөлтэй холбоотой асуулт байвал:{' '}
          <a href="mailto:info.mommyoffice@gmail.com" style={{ color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
            info.mommyoffice@gmail.com
          </a>
        </p>
      </section>

    </main>
  );
}
