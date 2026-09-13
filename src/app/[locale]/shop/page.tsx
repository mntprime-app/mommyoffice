export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  // locale reserved for future i18n use
  await params;
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '620px' }}>

        {/* Icon */}
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛍️</div>

        {/* Badge */}
        <div style={{
          display: 'inline-block', marginBottom: '1.25rem',
          fontSize: '10px', fontWeight: 800, color: '#00B5AD',
          border: '1px solid rgba(0,181,173,0.4)',
          padding: '3px 12px', borderRadius: '4px',
          letterSpacing: '2px', textTransform: 'uppercase',
        }}>
          Тун удахгүй
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 1.5rem', lineHeight: 1.2 }}>
          Дэлгүүр
        </h1>

        {/* Main description */}
        <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.8, marginBottom: '1.75rem', textAlign: 'left' }}>
          Ээжүүд, охид бүсгүйчүүд болон гэр бүлийн хэрэгцээнд зориулсан гоо сайхан, эрүүл мэнд, гэр ахуйн чанартай бүтээгдэхүүнүүдийг тун удахгүй та бүхэнд хүргэх гэж байна.
        </p>

        {/* For businesses */}
        <div style={{
          background: 'rgba(0,181,173,0.06)',
          border: '1px solid rgba(0,181,173,0.2)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          textAlign: 'left',
        }}>
          <p style={{ color: '#e5e5e5', fontSize: '15px', fontWeight: 700, margin: '0 0 0.6rem' }}>
            Бизнес эрхлэгч, брэндүүдэд:
          </p>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.8, margin: '0 0 1rem' }}>
            Ээжүүд, эмэгтэйчүүдийн дунд хамгийн өндөр хандалттай онлайн платфортод өөрийн дэлгүүрээ нээж, бараа бүтээгдэхүүнээ шууд борлуулах боломжийг бид санал болгож байна.
          </p>
          <p style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Давуу талууд:
          </p>
          <ul style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.9, margin: 0, paddingLeft: '1.25rem', listStyleType: 'disc' }}>
            <li>Өөр өөр үнийн сонголттойгоор бараагаа санал болгох</li>
            <li>Үнийн санал авах (bid) систем</li>
            <li>Борлуулалтаас хувь хүртэх реферал (referral) орлого олох</li>
            <li>Өөрийн Facebook Messenger дээр дэлгүүрээ давхар нээх зэрэг олон дэвшилтэт боломж, шинэ үйлчилгээнүүд тун удахгүй нэмэгдэх болно</li>
          </ul>
        </div>

        {/* Contact */}
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.7 }}>
          📧 Холбоо барих:{' '}
          <a
            href="mailto:info.mommyoffice@gmail.com"
            style={{ color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}
          >
            info.mommyoffice@gmail.com
          </a>
        </p>

      </div>
    </main>
  );
}
