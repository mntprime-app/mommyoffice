'use client';
import { useState } from 'react';

interface AddToCartButtonProps {
  locale: string;
  slug: string;
}

export function AddToCartButton({ locale, slug }: AddToCartButtonProps) {
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
    // Show toast
    setToast(true);
    setTimeout(() => setToast(false), 2800);
    // Navigate after brief delay
    setTimeout(() => { window.location.href = `/${locale}/cart?add=${slug}`; }, 400);
  }

  return (
    <>
      <a
        href={`/${locale}/cart?add=${slug}`}
        onClick={handleClick}
        style={{
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
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      >
        🛒 Сагсанд нэмэх
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
