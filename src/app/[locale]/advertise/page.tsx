import { getLocale }              from 'next-intl/server';
import { getSiteSettings }         from '@/app/actions/admin';
import AdvertiseSlots              from '@/components/ui/AdvertiseSlots';
import AdvertiseContactForm        from '@/components/ui/AdvertiseContactForm';
import type { Metadata }           from 'next';

export const metadata: Metadata = {
  title: 'Сурталчилгаа байршуулах | MommyOffice',
  description:
    'MommyOffice платформд сурталчилгаа байршуулж, Монголын шийдвэр гаргагч эмэгтэйчүүдэд хүрнэ үү.',
};

// ─── Package config (prices come from CMS) ────────────────────────────────────
const PACKAGES = [
  {
    id: 'gold', name: 'GOLD', priceKey: 'advertise_gold_price', defaultPrice: '₮900,000',
    color: '#d4a017', glow: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.3)',
    badge: 'Эхлэх',
    items: ['🏠 Нүүр хуудасны баннер — 2 долоо хоног', '📄 3 хуудасны баннер', '🎬 1 Reel'],
  },
  {
    id: 'premium', name: 'PREMIUM', priceKey: 'advertise_premium_price', defaultPrice: '₮1,800,000',
    color: '#00B5AD', glow: 'rgba(0,181,173,0.12)', border: 'rgba(0,181,173,0.4)',
    badge: '⭐ Хамгийн алдартай',
    items: ['💥 Popup зар — 1 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 5 хуудасны баннер', '🎬 2 Reel'],
  },
  {
    id: 'platinum', name: 'PLATINUM', priceKey: 'advertise_platinum_price', defaultPrice: '₮2,800,000',
    color: '#a78bfa', glow: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)',
    badge: 'Максимум',
    items: ['💥 Popup зар — 2 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 Бүх 8 байршуулалт', '🎬 4 Reel', '✍️ 1 Брэндийн нийтлэл'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PILLAR_EMOJI = ['🏆', '🚀', '💚', '🏠', '💞', '🎨'];

function s(settings: Record<string, string>, key: string, fallback = '') {
  return settings[key] || fallback;
}

export default async function AdvertisePage() {
  const locale   = await getLocale();
  const settings = await getSiteSettings();

  void locale;

  const email      = s(settings, 'advertise_contact_email', 'info.mommyoffice@gmail.com');
  const phone      = s(settings, 'advertise_contact_phone');
  const headline   = s(settings, 'advertise_hero_headline', 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул');
  const subtitle   = s(settings, 'advertise_hero_subtitle', '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.');
  const heroBg     = s(settings, 'advertise_hero_bg');
  const ctaText    = s(settings, 'advertise_hero_cta', 'Сурталчилгааны мэдээллийг татаж авах');
  const mediakitUrl= s(settings, 'advertise_mediakit_url');
  const statsImg   = s(settings, 'advertise_stats_image');
  const statsTitle = s(settings, 'advertise_stats_title', 'Манай платформын хүрэлцээ');
  const whyTitle   = s(settings, 'advertise_why_title', 'Яагаад MommyOffice-д сурталчлах вэ?');
  const whyText    = s(settings, 'advertise_why_text', 'Монголын өрхийн худалдан авалтын шийдвэрийг гаргадаг 25–44 насны эмэгтэйчүүд бидний гол үзэгчид. Брэндийнхаа мессежийг зорилтот орчинд хүргэн, итгэлийн маркетингийн давуу талыг ашиглаарай.');

  const pillars = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    title: s(settings, `advertise_pillar_${n}_title`, `Багана ${n}`),
    desc:  s(settings, `advertise_pillar_${n}_desc`,  ''),
    image: s(settings, `advertise_pillar_${n}_image`, ''),
    emoji: PILLAR_EMOJI[n - 1],
  }));

  // Hero section background
  const heroBgStyle = heroBg
    ? `url('${heroBg}') center/cover no-repeat, #0a0a0a`
    : 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,181,173,0.08) 0%, transparent 70%), #070707';

  return (
    <main style={{ background: '#070707', color: '#e5e5e5', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 1.5rem 4rem',
        background: heroBgStyle,
      }}>
        {heroBg && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(7,7,7,0.65)',
            pointerEvents: 'none',
          }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 800, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#00B5AD',
            marginBottom: '1.25rem', padding: '5px 18px',
            border: '1px solid rgba(0,181,173,0.3)', borderRadius: '20px',
            display: 'inline-block',
          }}>
            Advertise with MommyOffice
          </span>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: '#fff', margin: '0 auto 1.25rem',
          }}>
            {headline}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            color: '#9ca3af', maxWidth: '540px', margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            {subtitle}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {mediakitUrl ? (
              <a
                href={mediakitUrl}
                target="_blank" rel="noopener noreferrer"
                download
                style={{
                  display: 'inline-block', padding: '14px 32px',
                  background: '#00B5AD', color: '#fff',
                  borderRadius: '100px', fontWeight: 800, fontSize: '14px',
                  textDecoration: 'none', boxShadow: '0 0 32px rgba(0,181,173,0.2)',
                }}
              >
                ⬇ {ctaText}
              </a>
            ) : (
              <a
                href="#contact"
                style={{
                  display: 'inline-block', padding: '14px 32px',
                  background: '#00B5AD', color: '#fff',
                  borderRadius: '100px', fontWeight: 800, fontSize: '14px',
                  textDecoration: 'none', boxShadow: '0 0 32px rgba(0,181,173,0.2)',
                }}
              >
                Холбогдох →
              </a>
            )}
            <a
              href="#contact"
              style={{
                display: 'inline-block', padding: '14px 32px',
                background: 'transparent', color: '#e5e5e5',
                borderRadius: '100px', fontWeight: 700, fontSize: '14px',
                textDecoration: 'none', border: '1px solid #2a2a2a',
              }}
            >
              Асуулга илгээх
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. REACH & STATS
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Stats bar — 3 numbers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: statsImg ? '1px solid #111' : 'none',
          }}>
            {[
              { value: '88.8%', label: 'Эмэгтэй үзэгч' },
              { value: '31K+',  label: 'Дагагч' },
              { value: '50K+',  label: 'Сарын хүрэлцээ' },
            ].map((st, i) => (
              <div key={st.label} style={{
                textAlign: 'center', padding: '2.5rem 1rem',
                borderRight: i < 2 ? '1px solid #111' : 'none',
              }}>
                <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {st.value}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '0.4rem', fontWeight: 500 }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* Optional image / banner */}
          {statsImg && (
            <div style={{ padding: '2.5rem 1.5rem' }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#4b5563', marginBottom: '1.25rem',
              }}>
                {statsTitle}
              </p>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
                <img
                  src={statsImg} alt={statsTitle}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. WHY ADVERTISE
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)',
            fontWeight: 900, color: '#fff', margin: '0 0 1rem',
            letterSpacing: '-0.02em',
          }}>
            {whyTitle}
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.6vw, 16px)', color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
            {whyText}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. 6 CONTENT PILLARS
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '2px',
              textTransform: 'uppercase', color: '#4b5563',
            }}>
              Signature Experiences
            </span>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0.5rem 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              Агуулгын үндсэн баганууд
            </h2>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Брэндийнхаа зорилтот хэрэглэгчидтэй холбогдох 6 платформын тулгуур контент.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {pillars.map((p) => (
              <div key={p.n} style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Image or placeholder */}
                <div style={{
                  width: '100%', aspectRatio: '16/9',
                  background: p.image ? 'transparent' : '#111',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.image ? (
                    <img
                      src={p.image} alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>{p.emoji}</span>
                  )}
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
                    {p.title}
                  </h3>
                  {p.desc && (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                      {p.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. PACKAGES
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
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
                  position: 'relative', background: '#0f0f0f',
                  border: `1px solid ${pkg.border}`, borderRadius: '16px',
                  padding: '1.75rem', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    position: 'absolute', top: -50, right: -50,
                    width: 160, height: 160, borderRadius: '50%',
                    background: pkg.glow, filter: 'blur(50px)', pointerEvents: 'none',
                  }} />
                  <span style={{
                    display: 'inline-block', fontSize: '11px', fontWeight: 800,
                    padding: '3px 10px', background: `${pkg.color}18`,
                    color: pkg.color, borderRadius: '20px', border: `1px solid ${pkg.border}`,
                    marginBottom: '1.25rem', alignSelf: 'flex-start',
                  }}>
                    {pkg.badge}
                  </span>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: pkg.color, margin: '0 0 0.3rem' }}>
                    {pkg.name}
                  </h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                      {price}
                    </span>
                    <span style={{ fontSize: '13px', color: '#4b5563', marginLeft: '4px' }}>/сар</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                    {pkg.items.map((item) => (
                      <li key={item} style={{
                        fontSize: '13px', color: '#9ca3af', padding: '0.5rem 0',
                        borderBottom: '1px solid #161616',
                      }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`#contact`}
                    style={{
                      display: 'block', textAlign: 'center', padding: '12px',
                      borderRadius: '10px', border: `1px solid ${pkg.border}`,
                      color: pkg.color, fontWeight: 700, fontSize: '14px',
                      textDecoration: 'none', background: `${pkg.color}0a`,
                    }}
                  >
                    Асуулга илгээх
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. INDIVIDUAL SLOT PRICING (GOGO.MN STYLE)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              Байршуулалтын сонголтууд
            </h2>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
              Захиалах товч дарж яг тохирох байршуулалтаа сонгоорой
            </p>
          </div>
          <AdvertiseSlots email={email} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. MEDIA KIT DOWNLOAD BANNER
      ══════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '4rem 1.5rem',
        background: 'linear-gradient(135deg, #0a0f0e 0%, #061a18 50%, #0a0f0e 100%)',
        borderBottom: '1px solid #111',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: 800,
            letterSpacing: '2px', textTransform: 'uppercase', color: '#00B5AD',
            marginBottom: '1rem',
          }}>
            Media Kit
          </span>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 900,
            color: '#fff', margin: '0 0 1rem', letterSpacing: '-0.02em',
          }}>
            Дэлгэрэнгүй мэдээллийг татаж авна уу
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem', lineHeight: 1.7 }}>
            Аудиторийн тайлан, байршуулалтын жагсаалт болон үнийн санал бүхий бүрэн медиа кит.
          </p>
          {mediakitUrl ? (
            <a
              href={mediakitUrl}
              target="_blank" rel="noopener noreferrer"
              download
              style={{
                display: 'inline-block', padding: '15px 44px',
                background: '#00B5AD', color: '#fff',
                borderRadius: '100px', fontWeight: 800, fontSize: '15px',
                textDecoration: 'none', boxShadow: '0 0 40px rgba(0,181,173,0.25)',
              }}
            >
              ⬇ {ctaText}
            </a>
          ) : (
            <a
              href={`mailto:${email}?subject=Media Kit хүсэлт — MommyOffice`}
              style={{
                display: 'inline-block', padding: '15px 44px',
                background: '#00B5AD', color: '#fff',
                borderRadius: '100px', fontWeight: 800, fontSize: '15px',
                textDecoration: 'none', boxShadow: '0 0 40px rgba(0,181,173,0.25)',
              }}
            >
              Media Kit хүсэх →
            </a>
          )}
          {phone && (
            <p style={{ marginTop: '1.25rem', fontSize: '14px', color: '#374151' }}>
              Утсаар:{' '}
              <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
                {phone}
              </a>
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. CONTACT FORM
      ══════════════════════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '2px',
              textTransform: 'uppercase', color: '#00B5AD', display: 'block',
              marginBottom: '0.75rem',
            }}>
              Contact Us to Advertise
            </span>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.02em',
            }}>
              Сурталчилгааны асуулга илгээх
            </h2>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: 1.7 }}>
              Таны асуулгыг <strong style={{ color: '#6b7280' }}>{email}</strong>-д шууд хүргэнэ.
              Ойрын ажлын өдрүүдэд хариу өгнө.
            </p>
          </div>
          <AdvertiseContactForm />
        </div>
      </section>

    </main>
  );
}
