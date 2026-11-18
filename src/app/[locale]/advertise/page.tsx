import { getLocale } from 'next-intl/server';
import { getSiteSettings } from '@/app/actions/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сурталчилгаа байршуулах | MommyOffice',
  description:
    'MommyOffice платформд сурталчилгаа байршуулж, Монголын шийдвэр гаргагч эмэгтэйчүүдэд хүрнэ үү.',
};

// ─── Package data ─────────────────────────────────────────────────────────────

const PACKAGES = [
  {
    id: 'gold',
    name: 'GOLD',
    priceKey: 'advertise_gold_price',
    defaultPrice: '₮900,000',
    period: '/сар',
    color: '#d4a017',
    glow: 'rgba(212,160,23,0.15)',
    badge: 'Эхлэх',
    items: [
      '🏠  Нүүр хуудасны баннер — 2 долоо хоног',
      '📄  3 хуудасны баннер',
      '🎬  1 Facebook / Instagram Reel',
    ],
    cta: 'Нэмэлт мэдээлэл авах',
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    priceKey: 'advertise_premium_price',
    defaultPrice: '₮1,800,000',
    period: '/сар',
    color: '#00B5AD',
    glow: 'rgba(0,181,173,0.15)',
    badge: '⭐ Хамгийн алдартай',
    items: [
      '💥  Popup зар — 1 долоо хоног',
      '🏠  Нүүр хуудасны баннер — бүтэн сар',
      '📄  5 хуудасны баннер',
      '🎬  2 Facebook / Instagram Reel',
    ],
    cta: 'Нэмэлт мэдээлэл авах',
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    priceKey: 'advertise_platinum_price',
    defaultPrice: '₮2,800,000',
    period: '/сар',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    badge: 'Максимум',
    items: [
      '💥  Popup зар — 2 долоо хоног',
      '🏠  Нүүр хуудасны баннер — бүтэн сар',
      '📄  Бүх 8 байршуулалт',
      '🎬  4 Facebook / Instagram Reel',
      '✍️  1 Брэндийн нийтлэл',
    ],
    cta: 'Нэмэлт мэдээлэл авах',
  },
];

const STATS = [
  { value: '88.8%', label: 'Эмэгтэй үзэгч' },
  { value: '31K+', label: 'Дагагч' },
  { value: '50K+', label: 'Сарын хүрэх' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdvertisePage() {
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const email    = settings.advertise_contact_email || settings.footer_contact_email || 'info.mommyoffice@gmail.com';
  const phone    = settings.advertise_contact_phone || '';
  const headline = settings.advertise_hero_headline || 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул';
  const subtitle = settings.advertise_hero_subtitle || '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.';

  void locale; // locale available for future i18n use

  return (
    <main style={{ background: '#070707', color: '#e5e5e5', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 1.5rem 4rem',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,181,173,0.12) 0%, transparent 70%), #070707',
      }}>
        {/* eyebrow */}
        <span style={{
          display: 'inline-block',
          fontSize: '11px', fontWeight: 800, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#00B5AD',
          marginBottom: '1.5rem',
          padding: '5px 16px',
          border: '1px solid rgba(0,181,173,0.3)',
          borderRadius: '20px',
        }}>
          Advertise with MommyOffice
        </span>

        {/* headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          maxWidth: '820px',
          margin: '0 auto 1.5rem',
        }}>
          {headline}
        </h1>

        {/* subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
          color: '#6b7280',
          maxWidth: '560px',
          lineHeight: 1.75,
          margin: '0 auto 3rem',
        }}>
          {subtitle}
        </p>

        {/* CTA */}
        <a
          href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
          style={{
            display: 'inline-block',
            padding: '16px 48px',
            background: '#00B5AD',
            color: '#fff',
            borderRadius: '100px',
            fontWeight: 800,
            fontSize: '15px',
            textDecoration: 'none',
            letterSpacing: '0.3px',
            boxShadow: '0 0 40px rgba(0,181,173,0.25)',
          }}
        >
          Холбогдох →
        </a>

        {/* scroll hint */}
        <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, #2a2a2a)' }} />
          <span style={{ fontSize: '11px', color: '#3a3a3a', letterSpacing: '2px', textTransform: 'uppercase' }}>scroll</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          AUDIENCE — 3 BIG NUMBERS
      ════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '5rem 1.5rem',
        borderTop: '1px solid #111',
        borderBottom: '1px solid #111',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              borderRight: i < STATS.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500, letterSpacing: '0.5px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PACKAGES — NETFLIX CARDS
      ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* section header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem',
            }}>
              Сурталчилгааны багцууд
            </h2>
            <p style={{ fontSize: '15px', color: '#4b5563', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              Нэг багцаар олон байршуул — тусдаа худалдан авснаас хэмнэлттэй
            </p>
          </div>

          {/* cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {PACKAGES.map((pkg) => {
              const price = settings[pkg.priceKey] || pkg.defaultPrice;
              return (
                <div key={pkg.id} style={{
                  position: 'relative',
                  background: '#0f0f0f',
                  border: `1px solid ${pkg.id === 'premium' ? pkg.color + '55' : '#1e1e1e'}`,
                  borderRadius: '20px',
                  padding: '2.25rem 2rem',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  {/* glow blob */}
                  <div style={{
                    position: 'absolute', top: '-60px', right: '-60px',
                    width: '200px', height: '200px',
                    borderRadius: '50%',
                    background: pkg.glow,
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                  }} />

                  {/* badge */}
                  <span style={{
                    display: 'inline-block',
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
                    padding: '4px 12px',
                    background: `${pkg.color}18`,
                    color: pkg.color,
                    borderRadius: '20px',
                    border: `1px solid ${pkg.color}44`,
                    marginBottom: '1.5rem',
                    alignSelf: 'flex-start',
                  }}>
                    {pkg.badge}
                  </span>

                  {/* name + price */}
                  <h3 style={{
                    fontSize: '13px', fontWeight: 800, letterSpacing: '3px',
                    textTransform: 'uppercase', color: pkg.color,
                    margin: '0 0 0.5rem',
                  }}>
                    {pkg.name}
                  </h3>
                  <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {price}
                    </span>
                    <span style={{ fontSize: '14px', color: '#4b5563' }}>{pkg.period}</span>
                  </div>

                  {/* items */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', flex: 1 }}>
                    {pkg.items.map((item) => (
                      <li key={item} style={{
                        fontSize: '14px',
                        color: '#9ca3af',
                        padding: '0.6rem 0',
                        borderBottom: '1px solid #161616',
                        lineHeight: 1.5,
                      }}>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`${pkg.name} багцын асуулга — MommyOffice`)}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: '12px',
                      border: `1px solid ${pkg.color}66`,
                      color: pkg.color,
                      fontWeight: 700,
                      fontSize: '14px',
                      textDecoration: 'none',
                      background: `${pkg.color}0d`,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {pkg.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTACT CTA
      ════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(4rem,8vw,7rem) 1.5rem',
        borderTop: '1px solid #111',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.02em',
            margin: '0 0 1rem',
          }}>
            Одоо захиалга өгнө үү
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Та бидэнтэй холбогдоод тохиромжтой багцаа сонгоорой.
          </p>
          <a
            href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
            style={{
              display: 'inline-block',
              padding: '16px 48px',
              background: '#fff',
              color: '#070707',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              letterSpacing: '0.3px',
            }}
          >
            {email}
          </a>
          {phone && (
            <p style={{ marginTop: '1.25rem' }}>
              <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ fontSize: '15px', color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>
                {phone}
              </a>
            </p>
          )}
        </div>
      </section>

    </main>
  );
}
