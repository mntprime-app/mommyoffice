'use client';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Drop logo.png into /public/ and it will appear automatically.
// Defaults to the teal "M" wordmark; switches to the image only after confirming the file loads.
function LogoMark() {
  const [hasLogo, setHasLogo] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setHasLogo(true);
    img.onerror = () => setHasLogo(false);
    img.src = '/logo.png';
  }, []);

  if (hasLogo) {
    return (
      <img
        src="/logo.png"
        alt="Mommyoffice"
        style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
      />
    );
  }
  return (
    <>
      <div style={{
        width: '36px', height: '36px', background: 'var(--teal)',
        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: '18px'
      }}>M</div>
      <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--teal)', letterSpacing: '-0.5px' }}>
        Mommyoffice
      </span>
    </>
  );
}

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === 'mn' ? 'en' : 'mn';
  const localePath = (path: string) => `/${locale}${path}`;

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link href={localePath('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <LogoMark />
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          <Link href={localePath('/')} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('home')}</Link>
          <Link href={localePath('/courses')} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('courses')}</Link>
          <Link href={localePath('/articles')} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('articles')}</Link>
          <Link href={`/${otherLocale}`} style={{
            padding: '4px 12px', border: '1px solid var(--border)',
            borderRadius: '6px', fontSize: '13px', color: 'var(--foreground)',
            textDecoration: 'none', fontWeight: 500
          }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>
          <Link href={localePath('/access')} style={{
            background: 'var(--teal)', color: '#fff',
            padding: '8px 18px', borderRadius: '8px', fontWeight: 600,
            textDecoration: 'none', fontSize: '14px'
          }}>{t('login')}</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <div style={{ width: '22px', height: '2px', background: 'var(--foreground)', margin: '4px 0' }} />
          <div style={{ width: '22px', height: '2px', background: 'var(--foreground)', margin: '4px 0' }} />
          <div style={{ width: '22px', height: '2px', background: 'var(--foreground)', margin: '4px 0' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff' }}>
          <Link href={localePath('/')} onClick={() => setOpen(false)} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('home')}</Link>
          <Link href={localePath('/courses')} onClick={() => setOpen(false)} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('courses')}</Link>
          <Link href={localePath('/articles')} onClick={() => setOpen(false)} style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500 }}>{t('articles')}</Link>
          <Link href={`/${otherLocale}`} style={{ color: 'var(--foreground)', textDecoration: 'none' }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>
          <Link href={localePath('/access')} style={{
            background: 'var(--teal)', color: '#fff',
            padding: '10px 18px', borderRadius: '8px', fontWeight: 600,
            textDecoration: 'none', textAlign: 'center'
          }}>{t('login')}</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
