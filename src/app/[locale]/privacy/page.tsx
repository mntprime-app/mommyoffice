import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Нууцлалын бодлого | MommyOffice',
    description: 'MommyOffice платформын нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хамгаалж байгааг мэдэж аваарай.',
    openGraph: {
      title: 'Нууцлалын бодлого | MommyOffice',
      url: `https://mommyoffice.com/${locale}/privacy`,
    },
    alternates: { canonical: `https://mommyoffice.com/${locale}/privacy` },
    robots: { index: true, follow: true },
  };
}

const sectionStyle: React.CSSProperties = { marginBottom: '2.5rem' };
const h2Style: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.875rem' };
const pStyle: React.CSSProperties = { fontSize: '15px', color: '#9ca3af', lineHeight: 1.85, marginBottom: '0.75rem' };
const liStyle: React.CSSProperties = { fontSize: '15px', color: '#9ca3af', lineHeight: 1.8, marginBottom: '0.4rem' };

export default async function PrivacyPage({
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
        <span>Нууцлалын бодлого</span>
      </nav>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
        Нууцлалын бодлого
      </h1>
      <div style={{ width: '48px', height: '4px', background: '#00B5AD', borderRadius: '2px', marginBottom: '0.75rem' }} />
      <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '2.5rem' }}>
        Хүчин төгөлдөр байх огноо: 2026 он · Монгол Улсын Хувь хүний нууцыг хамгаалах тухай хуульд нийцүүлэн боловсруулав.
      </p>

      <p style={pStyle}>
        MommyOffice нь хэрэглэгчдийнхээ хувийн мэдээллийн нууцлалыг дээд зэргээр хүндэтгэн хамгаалдаг.
        Энэхүү нууцлалын бодлого нь манай вэбсайт руу зочлох, үйлчилгээ авах явцдаа бидэнд өгсөн мэдээллийг
        хэрхэн цуглуулж, ашиглаж, хамгаалж байгааг танилцуулах зорилготой.
      </p>

      <section style={sectionStyle}>
        <h2 style={h2Style}>1. Ямар мэдээлэл цуглуулдаг вэ?</h2>
        <p style={pStyle}>Бид платформоо илүү сайн ажиллуулах, танд тохирсон үйлчилгээ үзүүлэхийн тулд дараах мэдээллийг цуглуулж болно:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>Таны имэйл хаяг болон нэр (бүртгүүлэх, нэвтрэх, сургалт авах үед)</li>
          <li style={liStyle}>Төлбөр тооцоо хийх явц дахь шаардлагатай мэдээлэл (QPay болон бусад төлбөрийн хэрэгслээр дамжуулан баталгаажих мэдээлэл)</li>
          <li style={liStyle}>Вэбсайт ашиглалтын явц дахь техникийн өгөгдөл (IP хаяг, хөтчийн төрөл, зочилсон хуудас)</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>2. Мэдээллийг хэрхэн ашигладаг вэ?</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li style={liStyle}>Таны худалдаж авсан сургалт болон контент руу хандах эрхийг баталгаажуулах</li>
          <li style={liStyle}>Үйлчилгээний шинэчлэл, мэдээ мэдээллийг танд хүргэх</li>
          <li style={liStyle}>Вэбсайтын ажиллагааг сайжруулах, хэрэглэгчийн туршлагыг нэмэгдүүлэх</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>3. Гуравдагч талтай хуваалцах уу?</h2>
        <p style={pStyle}>
          MommyOffice нь хэрэглэгчдийнхээ хувийн мэдээллийг гуравдагч этгээдэд худалдахгүй, түрээслэхгүй.
          Зөвхөн хууль тогтоомжид заасан тохиолдолд эсвэл төлбөр тооцоог найдвартай дамжуулах зорилгоор
          эрх бүхий төлбөрийн системтэй (жишээ нь QPay) мэдээлэл солилцож болно.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>4. Күүки (Cookie) ашиглалт</h2>
        <p style={pStyle}>
          Бид вэбсайтынхаа ажиллагааг сайжруулах, таны хандалтыг илүү хялбар болгох зорилгоор күүки (cookies)
          ашигладаг. Та хөтчийнхөө тохиргоогоор дамжуулан күүкийг хүлээж авахаас татгалзах боломжтой боловч
          зарим үйлчилгээ хэвийн ажиллахгүй байж болзошгүй.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>5. Хэрэглэгчийн эрх</h2>
        <p style={pStyle}>
          Та өөрийн бүртгүүлсэн мэдээллээ өөрчлөх, шинэчлэх, эсвэл бүртгэлээ бүрмөсөн устгуулах хүсэлт гаргах
          бүрэн эрхтэй. Энэ тохиолдолд манай имэйл хаягаар холбогдож хүсэлтээ илгээнэ үү.
        </p>
      </section>

      <section style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
        <h2 style={{ ...h2Style, marginBottom: '0.5rem' }}>6. Холбоо барих</h2>
        <p style={{ ...pStyle, marginBottom: 0 }}>
          Нууцлалын бодлоготой холбоотой асуулт байвал:{' '}
          <a href="mailto:info.mommyoffice@gmail.com" style={{ color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
            info.mommyoffice@gmail.com
          </a>
        </p>
      </section>

    </main>
  );
}
