'use client';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Read session from localStorage
  useEffect(() => {
    const readSession = () => {
      try {
        const s = localStorage.getItem('mo_session');
        if (s) {
          const parsed = JSON.parse(s);
          setUserEmail(parsed.email || null);
        } else {
          setUserEmail(null);
        }
      } catch { setUserEmail(null); }
    };
    readSession();
    window.addEventListener('mo_session_change', readSession);
    window.addEventListener('storage', readSession);
    return () => {
      window.removeEventListener('mo_session_change', readSession);
      window.removeEventListener('storage', readSession);
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  function handleLogout() {
    try { localStorage.removeItem('mo_session'); } catch { /* */ }
    setUserEmail(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('mo_session_change'));
    router.push(lp('/access'));
  }

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

  const pathname = usePathname();
  const otherLocale = locale === 'mn' ? 'en' : 'mn';
  const lp = (path: string) => `/${locale}${path}`;

  const isActive = (href: string) => {
    if (href === lp('/')) return pathname === lp('/') || pathname === `/${locale}`;
    return pathname === href || pathname.startsWith(href + '/');
  };

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
    { href: lp('/become-instructor'), label: 'Багш болох', soon: false },
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
        <nav style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }} className="desktop-nav">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} style={{
                color: link.soon ? '#6b7280' : active ? '#fff' : '#e5e5e5',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '14px', letterSpacing: '0.2px',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '9999px',
                background: active ? '#3f3f3f' : 'transparent',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
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
            );
          })}
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

          {/* Login / User avatar */}
          {userEmail ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                title={userEmail}
                style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00B5AD 0%, #00d4cb 100%)',
                  border: userMenuOpen ? '2px solid #00B5AD' : '2px solid rgba(0,181,173,0.35)',
                  color: '#fff', fontWeight: 800, fontSize: '15px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textTransform: 'uppercase', flexShrink: 0,
                  boxShadow: userMenuOpen ? '0 0 0 3px rgba(0,181,173,0.2)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {userEmail.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '48px',
                  background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px', overflow: 'hidden', minWidth: '248px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)',
                  zIndex: 200,
                  animation: 'dropdownFade 0.15s ease',
                }}>
                  {/* Profile header */}
                  <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #00B5AD 0%, #00d4cb 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: 800, color: '#fff',
                        border: '2px solid rgba(0,181,173,0.3)',
                      }}>
                        {userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '15px', fontWeight: 700, color: '#fff',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {userEmail.split('@')[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
                        <div style={{
                          fontSize: '12px', color: '#6b7280', marginTop: '2px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: '160px',
                        }}>
                          {userEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px' }}>
                    <Link href={lp('/my-courses')} onClick={() => setUserMenuOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: '8px', textDecoration: 'none',
                      color: '#e5e5e5', fontSize: '14px', fontWeight: 500,
                      transition: 'background 0.12s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B5AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Миний сургалтууд
                    </Link>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 6px' }} />

                  <div style={{ padding: '6px' }}>
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                      padding: '11px 12px', borderRadius: '8px', border: 'none',
                      background: 'transparent', color: '#9ca3af', fontSize: '14px',
                      fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e5e5e5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Гарах
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href={lp('/access')} style={{
              background: 'var(--teal)', color: '#fff',
              padding: '8px 20px', borderRadius: '6px',
              fontWeight: 700, textDecoration: 'none',
              fontSize: '14px', letterSpacing: '0.2px',
            }}>Нэвтрэх</Link>
          )}
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
          {userEmail ? (
            <>
              <Link href={lp('/my-courses')} onClick={() => setOpen(false)} style={{
                color: '#00B5AD', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
              }}>🎓 Миний сургалтууд</Link>
              <button onClick={handleLogout} style={{
                background: 'none', border: 'none', color: '#9ca3af',
                fontWeight: 500, fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'left',
              }}>↩ Гарах</button>
            </>
          ) : (
            <Link href={lp('/access')} style={{
              background: 'var(--teal)', color: '#fff',
              padding: '10px 18px', borderRadius: '8px', fontWeight: 700,
              textDecoration: 'none', textAlign: 'center',
            }}>Нэвтрэх</Link>
          )}
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
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        button:hover svg { opacity: 0.75; }
      `}</style>
    </header>
  );
}
