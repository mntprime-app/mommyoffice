import { getLocale } from 'next-intl/server';
import { getSiteSettings } from '@/app/actions/admin';
import AdvertiseSlots from '@/components/ui/AdvertiseSlots';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сурталчилгаа байршуулах | MommyOffice',
  description:
    'MommyOffice платформд сурталчилгаа байршуулж, Монголын шийдвэр гаргагч эмэгтэйчүүдэд хүрнэ үү.',
};

const PACKAGES = [
  {
    id: 'gold',
    name: 'GOLD',
    priceKey: 'advertise_gold_price',
    defaultPrice: '₮900,000',
    color: '#d4a017',
    glow: 'rgba(212,160,23,0.12)',
    border: 'rgba(212,160,23,0.25)',
    badge: 'Эхлэх',
    items: ['🏠 Нүүр хуудасны баннер — 2 долоо хоног', '📄 3 хуудасны баннер', '🎬 1 Reel'],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    priceKey: 'advertise_premium_price',
    defaultPrice: '₮1,800,000',
    color: '#00B5AD',
    glow: 'rgba(0,181,173,0.12)',
    border: 'rgba(0,181,173,0.4)',
    badge: '⭐ Хамгийн алдартай',
    items: ['💥 Popup зар — 1 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 5 хуудасны баннер', '🎬 2 Reel'],
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    priceKey: 'advertise_platinum_price',
    defaultPrice: '₮2,800,000',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.25)',
    badge: 'Максимум',
    items: ['💥 Popup зар — 2 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 Бүх 8 байршуулалт', '🎬 4 Reel', '✍️ 1 Брэндийн нийтлэл'],
  },
];

export default async function AdvertisePage() {
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const email    = settings.advertise_contact_email || settings.footer_contact_email || 'info.mommyoffice@gmail.com';
  const phone    = settings.advertise_contact_phone || '';
  const headline = settings.advertise_hero_headline || 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул';
  const subtitle = settings.advertise_hero_subtitle || '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.';

  void locale;

  return (
    <main style={{ background: '#070707', color: '#e5e5e5', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 1.5rem 3rem',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,181,173,0.1) 0%, transparent 70%)',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 800, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#00B5AD',
          marginBottom: '1.25rem', padding: '5px 16px',
          border: '1px solid rgba(0,181,173,0.3)', borderRadius: '20px',
          display: 'inline-block',
        }}>
          Advertise with MommyOffice
        </span>

        <h1 style={{
          fontSize: 'clamp(2rem, 5.5vw, 3.75rem)',
          fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: '#fff',
          maxWidth: '820px', margin: '0 auto 1.25rem',
        }}>
          {headline}
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
          color: '#6b7280', maxWidth: '520px',
          lineHeight: 1.7, margin: '0 auto 2.5rem',
        }}>
          {subtitle}
        </p>

        <a
          href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
          style={{
            display: 'inline-block', padding: '14px 44px',
            background: '#00B5AD', color: '#fff',
            borderRadius: '100px', fontWeight: 800, fontSize: '15px',
            textDecoration: 'none', boxShadow: '0 0 32px rgba(0,181,173,0.2)',
          }}
        >
          Холбогдох →
        </a>
      </section>

      {/* ═══ STATS — 3 BIG NUMBERS ══════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            { value: '88.8%', label: 'Эмэгтэй үзэгч' },
            { value: '31K+',  label: 'Дагагч' },
            { value: '50K+',  label: 'Сарын хүрэх' },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '2.5rem 1rem',
              borderRight: i < 2 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '0.4rem', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SLOT CARDS (GOGO STYLE) ════════════════════════════════════════ */}
      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Байршуулалтын сонголтууд
            </h2>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Захиалах товч дарж яг тохирох байршуулалтаа сонгоорой
            </p>
          </div>
          <AdvertiseSlots email={email} />
        </div>
      </section>

      {/* ═══ PACKAGES ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '3.5rem 1.5rem', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Багцаар илүү хэмнэнэ
            </h2>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Reel байршуулалт зөвхөн багцад — тусдаа худалдаалагдахгүй
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {PACKAGES.map((pkg) => {
              const price = settings[pkg.priceKey] || pkg.defaultPrice;
              return (
                <div key={pkg.id} style={{
                  position: 'relative',
                  background: '#0f0f0f',
                  border: `1px solid ${pkg.border}`,
                  borderRadius: '16px', padding: '1.75rem',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  {/* glow */}
                  <div style={{
                    position: 'absolute', top: -50, right: -50,
                    width: 160, height: 160, borderRadius: '50%',
                    background: pkg.glow, filter: 'blur(50px)', pointerEvents: 'none',
                  }} />

                  <span style={{
                    display: 'inline-block', fontSize: '11px', fontWeight: 800,
                    padding: '3px 10px', background: `${pkg.color}18`,
                    color: pkg.color, borderRadius: '20px',
                    border: `1px solid ${pkg.border}`,
                    marginBottom: '1.25rem', alignSelf: 'flex-start',
                  }}>
                    {pkg.badge}
                  </span>

                  <h3 style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: pkg.color, margin: '0 0 0.3rem' }}>
                    {pkg.name}
                  </h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                      {price}
                    </span>
                    <span style={{ fontSize: '13px', color: '#4b5563', marginLeft: '4px' }}>/сар</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                    {pkg.items.map((item) => (
                      <li key={item} style={{
                        fontSize: '13px', color: '#9ca3af',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #161616',
                      }}>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`${pkg.name} багцын асуулга`)}`}
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '12px', borderRadius: '10px',
                      border: `1px solid ${pkg.border}`,
                      color: pkg.color, fontWeight: 700, fontSize: '14px',
                      textDecoration: 'none', background: `${pkg.color}0a`,
                    }}
                  >
                    Нэмэлт мэдээлэл авах
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '4rem 1.5rem',
        borderTop: '1px solid #111', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Одоо захиалга өгнө үү
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '2rem', lineHeight: 1.7 }}>
            Та бидэнтэй холбогдоод тохиромжтой байршуулалтаа сонгоорой.
          </p>
          <a
            href={`mailto:${email}?subject=Сурталчилгааны асуулга — MommyOffice`}
            style={{
              display: 'inline-block', padding: '14px 44px',
              background: '#fff', color: '#070707',
              borderRadius: '100px', fontWeight: 800, fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            {email}
          </a>
          {phone && (
            <p style={{ marginTop: '1rem' }}>
              <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ fontSize: '14px', color: '#4b5563', textDecoration: 'none' }}>
                {phone}
              </a>
            </p>
          )}
        </div>
      </section>

    </main>
  );
}
