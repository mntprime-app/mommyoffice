'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SlotCard {
  code: string;
  name: string;
  placement: string;
  desktop: string;
  mobile: string;
  formats: string;
  imgUrl: string;
}

// ─── SVG wireframe mockup — one per banner code ───────────────────────────────
function SlotMockupSvg({ code }: { code: string }) {
  const W = 320, H = 180;
  const bg = '#070707', nav = '#111111', block = '#0d0d0d';
  const line = '#1a1a1a', line2 = '#141414';
  const tFill = 'rgba(0,181,173,0.16)', tStroke = '#00B5AD', tText = '#00B5AD';

  const NavBar = () => (
    <>
      <rect width={W} height={20} fill={nav}/>
      <rect x="10" y="7" width="34" height="6" rx="2" fill={line}/>
      <rect x="216" y="8" width="22" height="4" rx="1" fill={line2}/>
      <rect x="242" y="8" width="22" height="4" rx="1" fill={line2}/>
      <rect x="268" y="8" width="42" height="4" rx="1" fill={line2}/>
    </>
  );
  const Lines = ({ x, y, w, n, gap = 7 }: { x:number; y:number; w:number; n:number; gap?:number }) => (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? Math.round(w * 0.65) : w} height="3" rx="1" fill={line}/>
      ))}
    </>
  );
  const Banner = ({ x, y, w, h, label }: { x:number; y:number; w:number; h:number; label:string }) => (
    <>
      <rect x={x} y={y} width={w} height={h} fill={tFill} stroke={tStroke} strokeWidth="1.5" rx="1"/>
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fill={tText} fontSize="6.5" fontFamily="monospace" fontWeight="700">{label}</text>
    </>
  );

  if (code === 'POP-UP') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <Lines x={12} y={26} w={180} n={5}/>
      <rect width={W} height={H} fill="rgba(0,0,0,0.52)"/>
      <rect x="68" y="38" width="184" height="104" rx="8" fill="#070f0e" stroke={tStroke} strokeWidth="1.5"/>
      <rect x="82" y="52" width="156" height="62" rx="3" fill={tFill}/>
      <text x="160" y="85" textAnchor="middle" fill={tText} fontSize="7.5" fontFamily="monospace" fontWeight="700">POP-UP</text>
      <text x="160" y="96" textAnchor="middle" fill={tText} fontSize="6" fontFamily="monospace">800 × 400 px</text>
      <text x="242" y="52" fill="#374151" fontSize="12">✕</text>
      <rect x="104" y="128" width="112" height="10" rx="2" fill="rgba(0,181,173,0.2)" stroke={tStroke} strokeWidth="1"/>
      <text x="160" y="136" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="600">Дэлгэцийн дунд · гарах үед</text>
    </svg>
  );

  if (code === 'H1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width={W} height="44" fill="#0c1a18"/>
      <rect x="12" y="30" width="90" height="8" rx="2" fill="#1a2e28"/>
      <rect x="12" y="41" width="65" height="5" rx="1" fill="#152420"/>
      <rect x="12" y="50" width="52" height="9" rx="2" fill="rgba(0,181,173,0.22)" stroke={tStroke} strokeWidth="1"/>
      <Banner x={0} y={64} w={W} h={18} label="H1  ·  1336 × 120 px"/>
      <Lines x={12} y={90} w={W - 24} n={3}/>
      {[0,1,2].map(i => <rect key={i} x={10 + i * 103} y={114} width="97" height="52" rx="4" fill={block}/>)}
    </svg>
  );

  if (code === 'A1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="213" y="20" width="102" height="155" fill={block} opacity="0.25"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <rect x="10" y="36" width="95" height="4" rx="1" fill={line2}/>
      <Lines x={10} y={46} w={188} n={4}/>
      <Banner x={10} y={80} w={190} h={16} label="A1  ·  728 × 90 px"/>
      <Lines x={10} y={102} w={188} n={5}/>
      <rect x="216" y="26" width="96" height="62" rx="3" fill={block}/>
      <rect x="216" y="94" width="96" height="38" rx="3" fill={block}/>
    </svg>
  );

  if (code === 'A2') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={9}/>
      <Banner x={214} y={22} w={100} h={76} label={"A2 · 300×250"}/>
      <rect x="214" y="104" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="140" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="156" width="100" height="14" rx="2" fill="rgba(0,181,173,0.08)" stroke="rgba(0,181,173,0.2)" strokeWidth="1"/>
      <text x="264" y="166" textAnchor="middle" fill={tText} fontSize="5.5">Desktop only</text>
    </svg>
  );

  if (code === 'A3') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="130" fill={block} opacity="0.4"/>
      <rect x="213" y="20" width="102" height="130" fill={block} opacity="0.25"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={6}/>
      <rect x="216" y="26" width="96" height="56" rx="3" fill={block}/>
      <Lines x={10} y={100} w={188} n={3}/>
      <Banner x={5} y={154} w={310} h={18} label="A3  ·  970 × 90 px"/>
    </svg>
  );

  if (code === 'AR1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={9}/>
      <Banner x={214} y={22} w={100} h={76} label={"AR1 · 300×250"}/>
      <rect x="214" y="104" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="140" width="100" height="14" rx="2" fill="rgba(0,181,173,0.1)" stroke={tStroke} strokeWidth="1"/>
      <text x="264" y="150" textAnchor="middle" fill={tText} fontSize="5.5" fontWeight="700">Desktop + Mobile</text>
      <Lines x={10} y={100} w={188} n={5}/>
    </svg>
  );

  if (code === 'C1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <Banner x={0} y={20} w={W} h={18} label="C1  ·  1336 × 120 px"/>
      <rect x="10" y="45" width="96" height="6" rx="2" fill={line}/>
      <rect x="10" y="54" width="68" height="4" rx="1" fill={line2}/>
      {[0,1,2,3,4,5].map(i => <rect key={i} x={10 + (i % 3) * 102} y={64 + Math.floor(i / 3) * 55} width="96" height="49" rx="4" fill={block}/>)}
    </svg>
  );

  if (code === 'V1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <Banner x={0} y={20} w={W} h={18} label="V1  ·  1336 × 120 px"/>
      <rect x="10" y="45" width="78" height="6" rx="2" fill={line}/>
      {[0,1,2,3].map(i => <rect key={i} x={10 + (i % 2) * 156} y={58 + Math.floor(i / 2) * 54} width="150" height="48" rx="4" fill={block}/>)}
      {[0,1,2,3].map(i => <circle key={i} cx={85 + (i % 2) * 156} cy={82 + Math.floor(i / 2) * 54} r="10" fill="rgba(255,255,255,0.07)"/>)}
    </svg>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <text x="160" y="96" textAnchor="middle" fill="#374151" fontSize="14" fontFamily="monospace">{code}</text>
    </svg>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function AdvertiseSlotGrid({ slots }: { slots: SlotCard[] }) {
  const [active, setActive] = useState<SlotCard | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, close]);

  return (
    <>
      {/* ── Grid ── */}
      <style>{`
        .slots-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
        @media(max-width:1024px){.slots-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:640px){.slots-grid{grid-template-columns:repeat(2,1fr);gap:0.875rem}}
        .slot-card{background:#0d0d0d;border-radius:12px;border:1px solid #1a1a1a;overflow:hidden;cursor:pointer;transition:border-color 0.15s,transform 0.15s}
        .slot-card:hover{border-color:rgba(0,181,173,0.4);transform:translateY(-2px)}
        .slot-card-zoom{position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 7px;font-size:11px;color:#9ca3af;line-height:1;opacity:0;transition:opacity 0.15s;pointer-events:none}
        .slot-card:hover .slot-card-zoom{opacity:1}
      `}</style>

      <div className="slots-grid" role="list">
        {slots.map((slot) => (
          <div
            key={slot.code}
            className="slot-card"
            role="listitem"
            onClick={() => setActive(slot)}
            title={`${slot.name} — дэлгэрэнгүй харах`}
            aria-label={`${slot.code} ${slot.name} — дэлгэрэнгүй харах`}
          >
            {/* Mockup preview */}
            <div style={{ aspectRatio: '16/9', background: '#070707', overflow: 'hidden', display: 'flex', alignItems: 'stretch', position: 'relative' }}>
              {slot.imgUrl ? (
                <img src={slot.imgUrl} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <SlotMockupSvg code={slot.code} />
              )}
              <span className="slot-card-zoom">⤢ Томруулах</span>
            </div>
            {/* Info */}
            <div style={{ padding: '0.85rem 1rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <CategoryBadge text={slot.code} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 0.2rem', lineHeight: 1.3 }}>
                {slot.name}
              </h3>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                {slot.placement}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {active && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'lb-in 0.18s ease',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.name} байршуулалтын дэлгэрэнгүй`}
        >
          <style>{`
            @keyframes lb-in { from { opacity:0; } to { opacity:1; } }
            @keyframes lb-panel { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(0,181,173,0.25)',
              borderRadius: '16px',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '860px',
              animation: 'lb-panel 0.2s ease',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,181,173,0.1)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <CategoryBadge text={active.code} size="md" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5' }}>{active.name}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{active.placement}</span>
              </div>
              <button
                onClick={close}
                aria-label="Хаах"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: '6px 10px',
                  flexShrink: 0,
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
              >
                ✕
              </button>
            </div>

            {/* Large preview */}
            <div style={{ aspectRatio: '16/9', background: '#070707', overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
              {active.imgUrl ? (
                <img src={active.imgUrl} alt={active.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <SlotMockupSvg code={active.code} />
              )}
            </div>

            {/* Footer — specs */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem',
              padding: '0.9rem 1.25rem',
              borderTop: '1px solid #1a1a1a',
            }}>
              {[
                { label: 'Desktop', value: active.desktop },
                { label: 'Mobile',  value: active.mobile  },
                { label: 'Формат', value: active.formats  },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: value === '—' ? '#374151' : '#c0c8d2' }}>{value}</span>
                </div>
              ))}
              <span style={{ fontSize: '11px', color: '#374151', marginLeft: 'auto', alignSelf: 'center' }}>
                ESC дарж хаах
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
