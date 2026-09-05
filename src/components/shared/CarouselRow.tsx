'use client';
import { useRef, useState, type ReactNode } from 'react';

/**
 * CarouselRow — horizontal snap carousel with mobile pagination dots.
 *
 * Usage:
 *   <CarouselRow count={items.length}>
 *     {items.map(item => <Card className="mo-snap-card" ... />)}
 *   </CarouselRow>
 *
 * CSS required on the page (add to <style> tag):
 *   .mo-row-wrap { position: relative; overflow: hidden; }
 *   .mo-row-wrap::after { content:''; position:absolute; top:0; right:0; bottom:0;
 *     width:56px; background:linear-gradient(to right,transparent,#141414);
 *     pointer-events:none; z-index:2; }
 *   @media(min-width:768px){ .mo-row-wrap::after { display:none; } }
 *   .mo-carousel-dots { display:none; justify-content:center; gap:5px; margin-top:10px; }
 *   @media(max-width:767px){ .mo-carousel-dots { display:flex; align-items:center; } }
 *   .mo-snap-card { scroll-snap-align: start; }
 */
export default function CarouselRow({
  children,
  count,
  gap = 10,
}: {
  children: ReactNode;
  count: number;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState(0);
  // Cap at 7 dots — more than that is visual noise
  const dots = Math.min(Math.max(count, 0), 7);

  function onScroll() {
    const el = ref.current;
    if (!el || dots <= 1) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    setDot(Math.round((el.scrollLeft / max) * (dots - 1)));
  }

  return (
    <div className="mo-row-wrap" style={{ position: 'relative' }}>
      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: `${gap}px`,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '8px',
        } as React.CSSProperties}
      >
        {children}
      </div>

      {/* Pagination dots — mobile only via .mo-carousel-dots CSS */}
      {dots > 1 && (
        <div className="mo-carousel-dots">
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                height: '3px',
                width: i === dot ? '20px' : '6px',
                borderRadius: '2px',
                background: i === dot ? '#00B5AD' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
