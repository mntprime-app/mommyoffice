import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { getSiteSettings } from '@/app/actions/admin';

// Organisation schema injected once per page — helps Google understand the brand
function OrgSchema({ locale }: { locale: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MommyOffice',
    url: `https://mommyoffice.com/${locale}`,
    logo: 'https://mommyoffice.com/whitelogo.png',
    description:
      'Монголын ээжүүд болон эмэгтэйчүүдэд зориулсан амьдралын хэв маяг, хөгжил, боловсрол, цахим худалдааны цогц платформ.',
    sameAs: [
      'https://www.facebook.com/MommyofficeMN',
      'https://www.instagram.com/mommyoffice_mo/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info.mommyoffice@gmail.com',
      contactType: 'customer service',
      availableLanguage: ['Mongolian', 'English'],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const linkStyle: React.CSSProperties = {
  color: '#9ca3af', textDecoration: 'none', fontSize: '14px', lineHeight: '2',
  transition: 'color 0.15s',
};
const headStyle: React.CSSProperties = {
  color: '#fff', fontWeight: 700, fontSize: '14px',
  marginBottom: '0.875rem', letterSpacing: '0.2px',
};

type NavLink = { label: string; href: string };

function parseLinks(raw: string | undefined, fallback: NavLink[]): NavLink[] {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as NavLink[]; } catch { return fallback; }
}

const DEFAULT_PLATFORM: NavLink[] = [
  { label: 'Хичээлүүд',    href: '/courses'  },
  { label: 'Нийтлэлүүд',   href: '/articles' },
  { label: 'Видео & Кино', href: '/videos'   },
  { label: 'Дэлгүүр',      href: '/shop'     },
];

const DEFAULT_COMPANY: NavLink[] = [
  { label: 'Бидний тухай',              href: '/about'               },
  { label: 'Холбоо барих',             href: '/contact'             },
  { label: 'Багш болох',               href: '/become-instructor'   },
  { label: 'Сурталчилгаа байршуулах', href: '/advertise'           },
  { label: 'Нууцлалын бодлого',        href: '/privacy'             },
  { label: 'Үйлчилгээний нөхцөл',     href: '/terms'               },
];

export default async function Footer() {
  const locale = await getLocale();
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  const fb    = settings.footer_facebook_url  || 'https://www.facebook.com/MommyofficeMN';
  const ig    = settings.footer_instagram_url || 'https://www.instagram.com/mommyoffice_mo/';
  const yt    = settings.footer_youtube_url   || '';
  const tt    = settings.footer_tiktok_url    || '';
  const email = settings.footer_contact_email || 'info.mommyoffice@gmail.com';
  const phone = settings.footer_contact_phone || '';
  const tag   = settings.footer_tagline       || 'Монголын эмэгтэйчүүдийн №1 платформ';

  const platformLinks = parseLinks(settings.footer_links_platform, DEFAULT_PLATFORM);
  const companyLinks  = parseLinks(settings.footer_links_company,  DEFAULT_COMPANY);

  const lp = (path: string) => `/${locale}${path}`;

  return (
    <footer
      role="contentinfo"
      style={{
        background: '#0a0a0a', color: '#757575',
        padding: '3.5rem 4% 2rem',
        borderTop: '1px solid #1e1e1e',
      }}
    >
      {/* SEO — Organisation structured data */}
      <OrgSchema locale={locale} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Top grid ─────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem',
        }}>

          {/* Brand */}
          <div>
            <Link href={lp('/')} style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
              <img src="/whitelogo.png" alt="MommyOffice" style={{ height: '34px', width: 'auto' }} />
            </Link>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7, maxWidth: '200px' }}>
              {tag}
            </p>
          </div>

          {/* Platform — dynamic from admin/footer */}
          <nav aria-label="Платформ хэсгүүд">
            <p style={headStyle}>Платформ</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {platformLinks.map((l) => (
                <Link key={l.href} href={lp(l.href)} style={linkStyle}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Company — dynamic from admin/footer */}
          <nav aria-label="Компанийн мэдээлэл">
            <p style={headStyle}>Компани</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {companyLinks.map((l) => (
                <Link
                  key={l.href}
                  href={lp(l.href)}
                  style={l.href === '/advertise'
                    ? { ...linkStyle, color: '#00B5AD', fontWeight: 600 }
                    : linkStyle}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Social */}
          <div>
            <p style={headStyle}>Нийгмийн сүлжээ</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fb && (
                <a href={fb} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8"/></svg>
                  Facebook
                </a>
              )}
              {ig && (
                <a href={ig} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none"/></svg>
                  Instagram
                </a>
              )}
              {yt && (
                <a href={yt} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>
                  YouTube
                </a>
              )}
              {tt && (
                <a href={tt} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.21 8.21 0 0 0 4.81 1.54V6.82a4.85 4.85 0 0 1-1.04-.13z"/></svg>
                  TikTok
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ ...linkStyle, marginTop: '0.5rem', color: '#e5e5e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>
                  {phone}
                </a>
              )}
              <a href={`mailto:${email}`} style={{ ...linkStyle, marginTop: phone ? '0.25rem' : '0.5rem', color: '#00B5AD', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B5AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                {email}
              </a>
            </div>
          </div>

        </div>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid #1e1e1e',
          paddingTop: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          fontSize: '12px',
          color: '#4b5563',
        }}>
          <span>© {year} MommyOffice. Бүх эрх хуулиар хамгаалагдсан.</span>
          <span style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href={lp('/privacy')} style={{ color: '#4b5563', textDecoration: 'none' }}>
              Нууцлал
            </Link>
            <Link href={lp('/terms')} style={{ color: '#4b5563', textDecoration: 'none' }}>
              Нөхцөл
            </Link>
          </span>
        </div>

      </div>
    </footer>
  );
}
