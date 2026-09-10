'use client';
import { useState } from 'react';

interface AddToCartButtonProps {
  locale: string;
  slug: string;
  /** compact=true: renders as a small pill for the mobile sticky bar */
  compact?: boolean;
}

export function AddToCartButton({ locale, slug, compact = false }: AddToCartButtonProps) {
  const [toast, setToast] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    // Add to localStorage cart
    try {
      const cart: string[] = JSON.parse(localStorage.getItem('mo_cart') || '[]');
      if (!cart.includes(slug)) {
        cart.push(slug);
        localStorage.setItem('mo_cart', JSON.stringify(cart));
      }
    } catch {/* ignore */ }
    // Fire storage event so Navbar badge increments immediately — no page redirect
    window.dispatchEvent(new Event('storage'));
    // Show toast — user stays on current page
    setToast(true);
    setTimeout(() => setToast(false), 2800);
  }

  return (
    <>
      <a
        href={`/${locale}/cart?add=${slug}`}
        onClick={handleClick}
        style={compact ? {
          background: 'rgba(255,255,255,0.08)',
          color: '#e5e5e5',
          padding: '13px 14px',
          borderRadius: '10px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '13px',
          border: '1px solid rgba(255,255,255,0.18)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'background 0.15s',
        } : {
          background: 'rgba(255,255,255,0.06)',
          color: '#e5e5e5',
          padding: '13px',
          borderRadius: '8px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '15px',
          border: '1px solid rgba(255,255,255,0.18)',
          textAlign: 'center',
          display: 'block',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = compact ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'; }}
      >
        {compact ? <>🛒 Сагсанд</> : <>🛒 Сагсанд нэмэх</>}
      </a>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#00B5AD',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '40px',
          fontWeight: 700,
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,181,173,0.45)',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          animation: 'mo-toast-in 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>✓</span>
          Сагсанд нэмэгдлээ!
        </div>
      )}

      <style>{`
        @keyframes mo-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
