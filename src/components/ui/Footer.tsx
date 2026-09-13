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

export default async function Footer() {
  const locale = await getLocale();
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  const fb    = settings.footer_facebook_url  || 'https://www.facebook.com/MommyofficeMN';
  const ig    = settings.footer_instagram_url || 'https://www.instagram.com/mommyoffice_mo/';
  const yt    = settings.footer_youtube_url   || '';
  const tt    = settings.footer_tiktok_url    || '';
  const email = settings.footer_contact_email || 'info.mommyoffice@gmail.com';
  const tag   = settings.footer_tagline       || 'Монголын эмэгтэйчүүдийн №1 платформ';

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

          {/* Platform */}
          <nav aria-label="Платформ хэсгүүд">
            <p style={headStyle}>Платформ</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={lp('/courses')}  style={linkStyle}>Хичээлүүд</Link>
              <Link href={lp('/articles')} style={linkStyle}>Нийтлэлүүд</Link>
              <Link href={lp('/videos')}   style={linkStyle}>Кино &amp; Видео</Link>
              <Link href={lp('/shop')}     style={linkStyle}>Дэлгүүр</Link>
            </div>
          </nav>

          {/* Company */}
          <nav aria-label="Компанийн мэдээлэл">
            <p style={headStyle}>Компани</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={lp('/about')}              style={linkStyle}>Бидний тухай</Link>
              <Link href={lp('/contact')}            style={linkStyle}>Холбоо барих</Link>
              <Link href={lp('/become-instructor')}  style={linkStyle}>Багш болох</Link>
              <Link href={lp('/privacy')}            style={linkStyle}>Нууцлалын бодлого</Link>
              <Link href={lp('/terms')}              style={linkStyle}>Үйлчилгээний нөхцөл</Link>
            </div>
          </nav>

          {/* Social */}
          <div>
            <p style={headStyle}>Нийгмийн сүлжээ</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fb && (
                <a href={fb} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  Facebook
                </a>
              )}
              {ig && (
                <a href={ig} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  Instagram
                </a>
              )}
              {yt && (
                <a href={yt} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  YouTube
                </a>
              )}
              {tt && (
                <a href={tt} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  TikTok
                </a>
              )}
              <a href={`mailto:${email}`} style={{ ...linkStyle, marginTop: '0.5rem', color: '#00B5AD' }}>
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
