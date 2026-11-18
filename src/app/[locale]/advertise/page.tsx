import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { getSiteSettings } from '@/app/actions/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сурталчилгаа байршуулах | MommyOffice',
  description:
    'MommyOffice платформд сурталчилгаа байршуулж, Монголын шийдвэр гаргагч эмэгтэйчүүдэд хүрнэ үү. 31,570+ дагагч, 88.8% эмэгтэй, 85% 25–44 насны үзэгчид.',
};

// ─── Static data ──────────────────────────────────────────────────────────────

const AUDIENCE_STATS = [
  { icon: '👩', label: 'Эмэгтэй үзэгч', value: '88.8%', sub: '85% нь 25–44 нас' },
  { icon: '📍', label: 'Улаанбаатар', value: '74.6%', sub: 'Үлдсэн нь Солонгос, АНУ, Австрали, Япон' },
  { icon: '👥', label: 'Дагагч', value: '31,570+', sub: 'Facebook + Instagram' },
  { icon: '🎬', label: 'Reel үзэлт', value: '40K–800K+', sub: 'Нэг видео тутамд' },
  { icon: '🔁', label: 'Органик шэйр', value: '300–600', sub: 'Нийтлэл тутамд' },
  { icon: '📊', label: 'Сарын хүрэх', value: '50,000+', sub: 'Органик дагагч' },
];

const PACKAGES = [
  {
    name: 'GOLD',
    price: '₮900,000',
    period: '/сар',
    color: '#B8860B',
    bg: 'rgba(184,134,11,0.08)',
    border: 'rgba(184,134,11,0.3)',
    badge: 'Эхлэлийн багц',
    saves: '₮360,000 (29%) хэмнэнэ',
    items: [
      'H1 нүүр хуудасны баннер — 2 долоо хоног',
      'C1 хичээлүүд хуудасны баннер',
      'V1 видео хуудасны баннер',
      '1× Reel байршуулалт (₮500,000 үнэтэй)',
    ],
  },
  {
    name: 'PREMIUM',
    price: '₮1,800,000',
    period: '/сар',
    color: '#00B5AD',
    bg: 'rgba(0,181,173,0.08)',
    border: 'rgba(0,181,173,0.4)',
    badge: '⭐ Хамгийн алдартай',
    saves: '₮1,200,000 (40%) хэмнэнэ',
    items: [
      'POP-UP 7 хоногийн блок',
      'H1 нүүр хуудасны баннер — бүтэн сар',
      'AR1 + C1 + V1 — 3 баннер',
      '2× Reel байршуулалт (₮1,000,000 үнэтэй)',
    ],
  },
  {
    name: 'PLATINUM',
    price: '₮2,800,000',
    period: '/сар',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.3)',
    badge: 'Максимум хүрэх',
    saves: '₮2,550,000 (48%) хэмнэнэ',
    items: [
      'POP-UP 2×7 хоногийн блок',
      'H1 нүүр хуудасны баннер — бүтэн сар',
      'Бүх 6 баннер цэг (AR1, A1, A2, A3, C1, V1)',
      '4× Reel байршуулалт (₮2,000,000 үнэтэй)',
      '1 ивээн тэтгэгчийн редакцийн нийтлэл',
    ],
  },
];

const SLOTS = [
  { code: 'POP-UP', name: 'Popup баннер', size: 'Desktop 800×600 · Mobile 390×600', price: '₮350,000 / 3 хоног', note: 'Bundle only — 1 хэрэглэгч 24цаг тутамд 1 удаа' },
  { code: 'H1', name: 'Нүүр хуудас Hero баннер', size: 'Desktop 1600×420 · Mobile 390×200', price: '₮200K–₮650K', note: '1 долоо хоног–4 долоо хоног' },
  { code: 'A1–A3', name: 'Нийтлэл хуудасны баннерууд', size: 'Desktop 1336×120 · Mobile 390×100', price: 'от ₮100,000', note: 'Leaderboard' },
  { code: 'AR1', name: 'Нийтлэлийн дотор баннер', size: 'Desktop 728×90 · Mobile 390×100', price: 'от ₮100,000', note: 'Нийтлэлийн эхэнд' },
  { code: 'C1', name: 'Хичээлүүд хуудасны баннер', size: 'Desktop 1336×120 · Mobile 390×100', price: 'от ₮100,000', note: 'Leaderboard' },
  { code: 'V1', name: 'Видео хуудасны баннер', size: 'Desktop 1336×120 · Mobile 390×100', price: 'от ₮100,000', note: 'Leaderboard' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdvertisePage() {
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const email   = settings.advertise_contact_email || settings.footer_contact_email || 'info.mommyoffice@gmail.com';
  const phone   = settings.advertise_contact_phone || '';
  const lp = (p: string) => `/${locale}${p}`;

  const sectionHead: React.CSSProperties = {
    fontSize: '11px', fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase', color: '#00B5AD', marginBottom: '0.5rem',
  };

  return (
    <main style={{ background: '#080808', color: '#e5e5e5', minHeight: '100vh' }}>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0D2137 0%, #0a1628 60%, #061018 100%)',
        padding: 'clamp(4rem,10vw,8rem) 6% clamp(3rem,8vw,6rem)',
        borderBottom: '1px solid #1a2a3a',
        textAlign: 'center',
      }}>
        <p style={sectionHead}>Advertise with us</p>
        <h1 style={{
          fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1.15,
          color: '#fff', maxWidth: '860px', margin: '0 auto 1.25rem',
        }}>
          Монголын шийдвэр гаргагч эмэгтэйчүүдийн<br />
          <span style={{ color: '#00B5AD' }}>№1 платформд</span> брэндээ байршуул
        </h1>
        <p style={{
          fontSize: 'clamp(1rem,2vw,1.2rem)', color: '#9ca3af',
          maxWidth: '660px', margin: '0 auto 2.5rem', lineHeight: 1.7,
        }}>
          Өрхийн худалдан авалтын шийдвэр гаргагч, 25–44 насны эмэгтэйчүүдэд чиглэсэн
          эерэг орчинд брэндийн мессежийг хүргэнэ үү.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
            style={{
              display: 'inline-block', padding: '14px 36px',
              background: '#00B5AD', color: '#fff',
              borderRadius: '10px', fontWeight: 800, fontSize: '15px',
              textDecoration: 'none', letterSpacing: '0.3px',
            }}
          >
            Холбогдох →
          </a>
          <a
            href="#packages"
            style={{
              display: 'inline-block', padding: '14px 36px',
              background: 'transparent', color: '#00B5AD',
              border: '1px solid rgba(0,181,173,0.4)',
              borderRadius: '10px', fontWeight: 700, fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            Багцуудыг харах
          </a>
        </div>
      </section>

      {/* ── AUDIENCE STATS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,7vw,5rem) 6%', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ ...sectionHead, textAlign: 'center' }}>Манай үзэгчид</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '2.5rem', color: '#fff' }}>
            Өрхийн шийдвэр гаргагчид — хамгийн чухал зорилтот бүлэг
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.25rem',
          }}>
            {AUDIENCE_STATS.map((s) => (
              <div key={s.label} style={{
                background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: '14px', padding: '1.5rem 1.25rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#00B5AD', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: '0.4rem 0 0.25rem' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ───────────────────────────────────────────────────── */}
      <section id="packages" style={{ padding: 'clamp(3rem,7vw,5rem) 6%', background: '#080808' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ ...sectionHead, textAlign: 'center' }}>Багцууд</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem', color: '#fff' }}>
            Нэг багцаар илүү хэмнэнэ
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '2.5rem' }}>
            Reel байршуулалт зөвхөн багцад орно — тусдаа худалдаалагдахгүй
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} style={{
                background: pkg.bg, border: `1px solid ${pkg.border}`,
                borderRadius: '16px', padding: '2rem 1.75rem',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Badge */}
                <span style={{
                  display: 'inline-block', fontSize: '11px', fontWeight: 800,
                  letterSpacing: '0.5px', padding: '4px 12px',
                  background: `${pkg.color}22`, color: pkg.color,
                  borderRadius: '20px', border: `1px solid ${pkg.border}`,
                  marginBottom: '1rem', alignSelf: 'flex-start',
                }}>
                  {pkg.badge}
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: pkg.color, margin: '0 0 0.25rem' }}>
                  {pkg.name}
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{pkg.price}</span>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>{pkg.period}</span>
                </div>
                {/* Items */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                  {pkg.items.map((item) => (
                    <li key={item} style={{
                      fontSize: '13px', color: '#d1d5db',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                    }}>
                      <span style={{ color: pkg.color, flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {/* Savings callout */}
                <div style={{
                  background: `${pkg.color}15`, border: `1px solid ${pkg.border}`,
                  borderRadius: '8px', padding: '0.75rem 1rem',
                  fontSize: '12px', fontWeight: 700, color: pkg.color,
                  textAlign: 'center',
                }}>
                  🎯 {pkg.saves}
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', marginTop: '1.5rem' }}>
            * Hot Mic Diaries (ижил 25–44 насны эмэгтэй үзэгчид) нэг ангид ₮1,500,000–₮5,000,000 авдаг. MommyOffice Reel ₮500,000 — хамгийн өрсөлдөхүйц үнэ.
          </p>
        </div>
      </section>

      {/* ── AD SLOTS ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,7vw,5rem) 6%', background: '#0d0d0d' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ ...sectionHead, textAlign: 'center' }}>Тусдаа байршуулалт</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '2.5rem', color: '#fff' }}>
            Байршуулалтын цэгүүд
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: '13px', color: '#d1d5db',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['Код', 'Нэр', 'Хэмжээ', 'Үнэ', 'Тэмдэглэл'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 800, letterSpacing: '1px',
                      textTransform: 'uppercase', color: '#6b7280',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot, i) => (
                  <tr key={slot.code} style={{
                    borderBottom: '1px solid #1a1a1a',
                    background: i % 2 === 0 ? 'transparent' : '#111',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', background: 'rgba(0,181,173,0.1)',
                        color: '#00B5AD', fontWeight: 800, fontSize: '11px',
                        padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px',
                      }}>{slot.code}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#e5e5e5' }}>{slot.name}</td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px' }}>{slot.size}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#00B5AD', whiteSpace: 'nowrap' }}>{slot.price}</td>
                    <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '12px' }}>{slot.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── WHY MOMMYOFFICE ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,7vw,5rem) 6%', background: '#080808' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={sectionHead}>Яагаад MommyOffice?</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, marginBottom: '2.5rem', color: '#fff' }}>
            Нэг байршуулалт — долоон цэгийн хүрэх чадвар
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem', textAlign: 'left',
          }}>
            {[
              { icon: '🎯', title: 'Яг зорилтот үзэгч', body: 'Өрхийн шийдвэр гаргагч, худалдан авалтын эрхийг эзэмшигч эмэгтэйчүүд.' },
              { icon: '🤝', title: 'Итгэлийн орчин', body: 'Контент бүр эерэг — брэнд итгэмжлэлтэй орчинд байрладаг.' },
              { icon: '📱', title: 'Вэб + Нийгмийн сүлжээ', body: 'Нэг багцаар вэбсайт болон Facebook/Instagram Reel-д хоёуланд нь хүрнэ.' },
              { icon: '📈', title: 'Хэмжигдэхүйц үр дүн', body: 'GA4-аар клик, хардалт, конверсийн тайлан авах боломжтой.' },
            ].map((item) => (
              <div key={item.title} style={{
                background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: '14px', padding: '1.5rem',
              }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(4rem,8vw,6rem) 6%',
        background: 'linear-gradient(135deg, #0D2137 0%, #061018 100%)',
        textAlign: 'center',
        borderTop: '1px solid #1a2a3a',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
            Одоо захиалга өгнө үү
          </h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.7, marginBottom: '2rem' }}>
            Бидний багтай холбогдоод тохиромжтой багц, байршуулалтын хуваарийг зохицуулна уу.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <a
              href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '16px 48px', background: '#00B5AD', color: '#fff',
                borderRadius: '12px', fontWeight: 800, fontSize: '16px',
                textDecoration: 'none', letterSpacing: '0.3px',
              }}
            >
              ✉ {email}
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} style={{
                fontSize: '15px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600,
              }}>
                📞 {phone}
              </a>
            )}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '12px', color: '#4b5563' }}>
            Та мөн <Link href={lp('/contact')} style={{ color: '#00B5AD', textDecoration: 'none' }}>Холбоо барих</Link> хуудсаар мессеж илгээх боломжтой.
          </p>
        </div>
      </section>

    </main>
  );
}
