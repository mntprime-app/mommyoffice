'use client';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
        style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
      />
    );
  }
  return (
    <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--teal)', letterSpacing: '-0.5px' }}>
      MOMMYOFFICE
    </span>
  );
}

export default function Navbar() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const otherLocale = locale === 'mn' ? 'en' : 'mn';
  const lp = (path: string) => `/${locale}${path}`;

  const navLinks = [
    { href: lp('/courses'), label: 'Сургалтууд' },
    { href: lp('/articles'), label: 'Нийтлэл' },
    { href: lp('/videos'), label: 'Кино' },
    { href: lp('/shop'), label: 'Дэлгүүр' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(20,20,20,0.97)' : 'rgba(20,20,20,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto', padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logo */}
        <Link href={lp('/')} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <LogoMark />
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: '#e5e5e5',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '14px',
                letterSpacing: '0.2px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#e5e5e5')}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-nav">
          <Link href={`/${otherLocale}`} style={{
            padding: '5px 12px',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#ccc',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'border-color 0.15s, color 0.15s',
          }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>
          <Link href={lp('/access')} style={{
            background: 'var(--teal)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            letterSpacing: '0.2px',
          }}>
            Нэвтрэх
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0', transition: 'all 0.2s' }} />
          <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0' }} />
          <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '1rem 2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          background: 'rgba(20,20,20,0.98)'
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ color: '#e5e5e5', textDecoration: 'none', fontWeight: 500, fontSize: '15px' }}
            >
              {link.label}
            </Link>
          ))}
          <Link href={`/${otherLocale}`} style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px' }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>
          <Link href={lp('/access')} style={{
            background: 'var(--teal)', color: '#fff',
            padding: '10px 18px', borderRadius: '8px', fontWeight: 700,
            textDecoration: 'none', textAlign: 'center'
          }}>
            Нэвтрэх
          </Link>
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
