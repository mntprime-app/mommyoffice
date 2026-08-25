'use client';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function LogoMark() {
  const [hasLogo, setHasLogo] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setHasLogo(true);
    img.onerror = () => setHasLogo(false);
    img.src = '/logo.png';
  }, []);
  if (hasLogo) {
    return <img src="/logo.png" alt="Mommyoffice" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />;
  }
  return <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--teal)', letterSpacing: '-0.5px' }}>MOMMYOFFICE</span>;
}

// SVG icons — no emoji, clean and sharp
function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconCart({ count }: { count: number }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: '-6px', right: '-6px',
          background: '#00B5AD', color: '#fff',
          fontSize: '10px', fontWeight: 800,
          width: '16px', height: '16px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>{count > 9 ? '9+' : count}</span>
      )}
    </div>
  );
}

export default function Navbar() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Read cart count from localStorage
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('mo_cart') || '[]');
      setCartCount(Array.isArray(cart) ? cart.length : 0);
    } catch { setCartCount(0); }
    const onStorage = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('mo_cart') || '[]');
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } catch { setCartCount(0); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const otherLocale = locale === 'mn' ? 'en' : 'mn';
  const lp = (path: string) => `/${locale}${path}`;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(lp(`/search?q=${encodeURIComponent(searchQuery.trim())}`));
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
  }

  const navLinks = [
    { href: lp('/'), label: 'Нүүр', soon: false },
    { href: lp('/courses'), label: 'Сургалтууд', soon: false },
    { href: lp('/articles'), label: 'Нийтлэл', soon: false },
    { href: lp('/videos'), label: 'Кино & Видео', soon: true },
    { href: lp('/shop'), label: 'Дэлгүүр', soon: true },
  ];

  const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#e5e5e5', display: 'flex', alignItems: 'center',
    padding: '6px', borderRadius: '4px', transition: 'color 0.15s',
  };

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
        height: '64px', gap: '1rem',
      }}>

        {/* Logo */}
        <Link href={lp('/')} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <LogoMark />
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{
              color: link.soon ? '#6b7280' : '#e5e5e5', textDecoration: 'none',
              fontWeight: 500, fontSize: '14px', letterSpacing: '0.2px',
              transition: 'color 0.15s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = link.soon ? '#6b7280' : '#e5e5e5')}
            >
              {link.label}
              {link.soon && (
                <span style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
                  background: 'rgba(0,181,173,0.15)', color: '#00B5AD',
                  border: '1px solid rgba(0,181,173,0.3)',
                  padding: '1px 5px', borderRadius: '4px',
                  textTransform: 'uppercase',
                }}>Удахгүй</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right side — search + cart + lang + login */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">

          {/* Netflix-style search */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {searchOpen ? (
              <form onSubmit={handleSearch} style={{
                display: 'flex', alignItems: 'center',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid #555',
                borderRadius: '4px',
                overflow: 'hidden',
                animation: 'searchExpand 0.2s ease',
              }}>
                <button type="button" style={{ ...iconBtn, padding: '6px 8px', color: '#ccc' }}>
                  <IconSearch />
                </button>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Хайх..."
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: '#fff', fontSize: '14px', width: '200px',
                    padding: '6px 4px',
                  }}
                />
                <button type="button" onClick={closeSearch} style={{ ...iconBtn, padding: '6px 8px', color: '#888' }}>
                  <IconClose />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={{ ...iconBtn }}
                title="Хайх" aria-label="Хайх">
                <IconSearch />
              </button>
            )}
          </div>

          {/* Cart */}
          <Link href={lp('/cart')} style={{ ...iconBtn, textDecoration: 'none', position: 'relative' }} title="Сагс">
            <IconCart count={cartCount} />
          </Link>

          {/* Language toggle */}
          <Link href={`/${otherLocale}`} style={{
            padding: '5px 12px', border: '1px solid #444', borderRadius: '6px',
            fontSize: '12px', color: '#ccc', textDecoration: 'none',
            fontWeight: 600, marginLeft: '8px',
            transition: 'border-color 0.15s, color 0.15s',
          }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>

          {/* Login */}
          <Link href={lp('/access')} style={{
            background: 'var(--teal)', color: '#fff',
            padding: '8px 20px', borderRadius: '6px',
            fontWeight: 700, textDecoration: 'none',
            fontSize: '14px', letterSpacing: '0.2px',
          }}>Нэвтрэх</Link>
        </div>

        {/* Mobile hamburger */}
        <div style={{ display: 'none' }} className="mobile-right">
          <Link href={lp('/cart')} style={{ ...iconBtn, textDecoration: 'none', marginRight: '8px' }}>
            <IconCart count={cartCount} />
          </Link>
          <button onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label="Menu">
            <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0' }} />
            <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0' }} />
            <div style={{ width: '22px', height: '2px', background: '#fff', margin: '5px 0' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          borderTop: '1px solid var(--border)', padding: '1rem 2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          background: 'rgba(20,20,20,0.98)',
        }}>
          {/* Mobile search */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center',
            background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', overflow: 'hidden',
          }}>
            <span style={{ padding: '8px 10px', color: '#666' }}><IconSearch /></span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Хайх..."
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', flex: 1, padding: '8px 4px' }}
            />
          </form>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              style={{ color: link.soon ? '#6b7280' : '#e5e5e5', textDecoration: 'none', fontWeight: 500, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {link.label}
              {link.soon && (
                <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0,181,173,0.15)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.3)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' as const }}>Удахгүй</span>
              )}
            </Link>
          ))}
          <Link href={`/${otherLocale}`} style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px' }}>
            {otherLocale === 'mn' ? 'МН' : 'EN'}
          </Link>
          <Link href={lp('/access')} style={{
            background: 'var(--teal)', color: '#fff',
            padding: '10px 18px', borderRadius: '8px', fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
          }}>Нэвтрэх</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-right { display: flex !important; align-items: center; }
        }
        @keyframes searchExpand {
          from { opacity: 0; transform: scaleX(0.7); transform-origin: right; }
          to   { opacity: 1; transform: scaleX(1); }
        }
        button:hover svg { opacity: 0.75; }
      `}</style>
    </header>
  );
}
