'use client';

import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Slot {
  id: string;
  name: string;
  placement: string;
  desc: string;
  price: string;
  priceSub?: string;
  size: string;
  fileTypes: string;
  maxSize: string;
  notes?: string;
  wireframe: 'popup' | 'hero' | 'leaderboard' | 'inline' | 'reel';
}

// ─── Slot data ────────────────────────────────────────────────────────────────

const SLOTS: Slot[] = [
  {
    id: 'popup',
    name: 'Popup зар',
    placement: 'Нүүр хуудас — дэлгэцийг бүтэн хамрана',
    desc: 'Хуудас ачаалахад дэлгэцийн дунд гарна. Хамгийн өндөр харагдах чадвар.',
    price: '₮350,000',
    priceSub: '/ 3 хоногийн блок',
    size: '800×600 (desktop) · 390×600 (mobile)',
    fileTypes: 'JPG, PNG, GIF, MP4, WebP',
    maxSize: '2 MB',
    notes: '1 хэрэглэгч 24 цаг тутамд 1 удаа харна. Popup 8 секундэд автоматаар хаагдана.',
    wireframe: 'popup',
  },
  {
    id: 'hero',
    name: 'Нүүр хуудасны баннер',
    placement: 'Нүүр хуудас — hero хэсгийн доор',
    desc: 'Сайтад орсон бүх хэрэглэгч харна. Хамгийн өндөр хүрэх чадвар бүхий байнгын байршуулалт.',
    price: '₮200,000–₮650,000',
    priceSub: '/ 1–4 долоо хоног',
    size: '1600×420 (desktop) · 390×200 (mobile)',
    fileTypes: 'JPG, PNG, GIF, MP4, WebP',
    maxSize: '2 MB',
    notes: 'Байнгын байршуулалт — хааж болохгүй.',
    wireframe: 'hero',
  },
  {
    id: 'articles',
    name: 'Нийтлэлийн баннер',
    placement: 'Нийтлэл хуудас — дээд хэсэг',
    desc: 'Нийтлэлийн жагсаалт болон дэлгэрэнгүй хуудсуудад харагдана.',
    price: '₮100,000-с',
    priceSub: '/ сар',
    size: '1336×120 (desktop) · 390×100 (mobile)',
    fileTypes: 'JPG, PNG, GIF, WebP',
    maxSize: '1 MB',
    wireframe: 'leaderboard',
  },
  {
    id: 'inline',
    name: 'Нийтлэлийн дотор баннер',
    placement: 'Нийтлэлийн эхэнд — агуулгын дотор',
    desc: 'Нийтлэлийг унших үед хуудсыг гүйлгэх явцад харагдана.',
    price: '₮100,000-с',
    priceSub: '/ сар',
    size: '728×90 (desktop) · 390×100 (mobile)',
    fileTypes: 'JPG, PNG, GIF, WebP',
    maxSize: '1 MB',
    wireframe: 'inline',
  },
  {
    id: 'courses',
    name: 'Хичээлийн баннер',
    placement: 'Хичээлүүд хуудас — доод хэсэг',
    desc: 'Хичээл үзэж буй болон сурахыг хүсэж буй хэрэглэгчид харна.',
    price: '₮100,000-с',
    priceSub: '/ сар',
    size: '1336×120 (desktop) · 390×100 (mobile)',
    fileTypes: 'JPG, PNG, GIF, WebP',
    maxSize: '1 MB',
    wireframe: 'leaderboard',
  },
  {
    id: 'videos',
    name: 'Видео хуудасны баннер',
    placement: 'Видео & Кино хуудас — доод хэсэг',
    desc: 'Видео контент үзэж буй хэрэглэгчид харна.',
    price: '₮100,000-с',
    priceSub: '/ сар',
    size: '1336×120 (desktop) · 390×100 (mobile)',
    fileTypes: 'JPG, PNG, GIF, WebP',
    maxSize: '1 MB',
    wireframe: 'leaderboard',
  },
  {
    id: 'reel',
    name: 'Facebook / Instagram Reel',
    placement: 'Нийгмийн сүлжээ',
    desc: 'MommyOffice-ийн Facebook болон Instagram хуудаст Reel байршуулалт. Зөвхөн PREMIUM, PLATINUM багцад.',
    price: '₮500,000',
    priceSub: '/ 1 Reel (зөвхөн багцад)',
    size: '1080×1920 — босоо видео',
    fileTypes: 'MP4',
    maxSize: '100 MB · 15–60 секунд',
    notes: 'Тусдаа худалдаалагдахгүй. PREMIUM (2×) · PLATINUM (4×) багцад орно. Hot Mic Diaries: ₮1.5M–5M/ангид.',
    wireframe: 'reel',
  },
];

// ─── Wireframe previews ────────────────────────────────────────────────────────

function Wireframe({ type }: { type: Slot['wireframe'] }) {
  const AD = '#00B5AD';
  const LINE = '#1e1e1e';
  const BLOCK = '#161616';
  const NAV = '#111';

  const bar = (h = 7, color = LINE, mb = 3, w = '100%') => (
    <div style={{ height: h, background: color, borderRadius: 2, marginBottom: mb, width: w }} />
  );
  const cards = (n: number, h = 22) => (
    <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: h, background: BLOCK, borderRadius: 2 }} />
      ))}
    </div>
  );
  const adStrip = (h = 14, label = 'AD') => (
    <div style={{
      height: h, background: AD, borderRadius: 2, marginBottom: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 8px rgba(0,181,173,0.4)',
    }}>
      <span style={{ fontSize: 5, color: 'rgba(0,0,0,0.7)', fontWeight: 800, letterSpacing: 1 }}>{label}</span>
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div style={{ width: '100%', height: '100%', padding: 8, background: '#0a0a0a', overflow: 'hidden', boxSizing: 'border-box' }}>
      {children}
    </div>
  );

  if (type === 'popup') {
    return wrap(
      <>
        {bar(6, NAV, 3)}
        {bar(5, LINE, 2, '70%')}
        {bar(5, LINE, 0, '50%')}
        {/* popup overlay */}
        <div style={{
          position: 'absolute', top: '20%', left: '12%', right: '12%', bottom: '12%',
          background: '#0d1f1e',
          border: `1.5px solid ${AD}`,
          borderRadius: 4,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
          boxShadow: '0 0 20px rgba(0,181,173,0.2)',
        }}>
          <div style={{ width: '60%', height: 20, background: AD, borderRadius: 2, opacity: 0.9 }} />
          <div style={{ width: '50%', height: 4, background: LINE, borderRadius: 1 }} />
          <div style={{ width: '40%', height: 4, background: LINE, borderRadius: 1 }} />
        </div>
      </>
    );
  }

  if (type === 'hero') {
    return wrap(
      <>
        {bar(6, NAV, 4)}
        {bar(18, BLOCK, 3)}    {/* hero */}
        {adStrip(13, 'БАННЕР')}
        {cards(4, 16)}
      </>
    );
  }

  if (type === 'leaderboard') {
    return wrap(
      <>
        {bar(6, NAV, 4)}
        {cards(3, 20)}
        {bar(4, LINE, 3, '60%')}
        {adStrip(13, 'БАННЕР')}
      </>
    );
  }

  if (type === 'inline') {
    return wrap(
      <>
        {bar(6, NAV, 4)}
        {bar(10, BLOCK, 3)}
        {adStrip(10, 'ДОТОР')}
        {bar(5, LINE, 2)}
        {bar(5, LINE, 2, '80%')}
        {bar(5, LINE, 0, '60%')}
      </>
    );
  }

  if (type === 'reel') {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0a',
      }}>
        {/* phone */}
        <div style={{
          width: 44, height: 72,
          border: `1.5px solid #2a2a2a`,
          borderRadius: 7,
          overflow: 'hidden',
          background: '#111',
          position: 'relative',
        }}>
          <div style={{ height: 4, background: '#1a1a1a', borderRadius: '0 0 2px 2px', margin: '0 auto', width: '40%' }} />
          <div style={{
            margin: '2px 2px 0',
            height: 56,
            background: AD,
            borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(0,181,173,0.4)',
          }}>
            <span style={{ fontSize: 7, color: 'rgba(0,0,0,0.6)', fontWeight: 800 }}>REEL</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  slot,
  email,
  onClose,
}: {
  slot: Slot;
  email: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid #2a2a2a',
          borderRadius: '16px', width: '100%', maxWidth: '480px',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1a1a1a',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
            {slot.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#1e1e1e', border: 'none', color: '#6b7280',
              width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* wireframe preview in modal */}
        <div style={{
          height: '140px', borderBottom: '1px solid #1a1a1a',
          position: 'relative', overflow: 'hidden',
        }}>
          <Wireframe type={slot.wireframe} />
        </div>

        {/* specs */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {slot.desc}
          </p>

          {[
            { label: 'Байршуулалт', value: slot.placement },
            { label: 'Хэмжээ', value: slot.size },
            { label: 'Файлын төрөл', value: slot.fileTypes },
            { label: 'Файлын дээд хэмжээ', value: slot.maxSize },
            ...(slot.notes ? [{ label: 'Тэмдэглэл', value: slot.notes }] : []),
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', gap: '1rem',
              padding: '0.6rem 0',
              borderBottom: '1px solid #161616',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', minWidth: '130px', flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>{value}</span>
            </div>
          ))}

          {/* price */}
          <div style={{
            margin: '1.25rem 0',
            padding: '1rem 1.25rem',
            background: 'rgba(0,181,173,0.06)', border: '1px solid rgba(0,181,173,0.2)',
            borderRadius: '10px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00B5AD', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Үнэ
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{slot.price}</span>
            {slot.priceSub && (
              <span style={{ fontSize: '13px', color: '#4b5563', marginLeft: '4px' }}>{slot.priceSub}</span>
            )}
          </div>

          {/* CTA */}
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`${slot.name} — захиалга`)}`}
            style={{
              display: 'block', textAlign: 'center',
              padding: '14px',
              background: '#00B5AD', color: '#fff',
              borderRadius: '10px', fontWeight: 800,
              fontSize: '14px', textDecoration: 'none',
              letterSpacing: '0.3px',
            }}
          >
            Захиалга өгөх →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── CMS override type ────────────────────────────────────────────────────────

export interface SlotOverride {
  id: string;
  name?: string;
  placement?: string;
  desc?: string;
  price?: string;
  priceSub?: string;
  image?: string;   // custom image URL — replaces wireframe when set
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdvertiseSlots({
  email,
  overrides = [],
}: {
  email: string;
  overrides?: SlotOverride[];
}) {
  const [active, setActive] = useState<Slot | null>(null);

  // Merge CMS overrides into base SLOTS (wireframe always from SLOTS)
  const slots = SLOTS.map((base) => {
    const ov = overrides.find((o) => o.id === base.id);
    if (!ov) return { ...base, image: '' };
    return {
      ...base,
      name:      ov.name      || base.name,
      placement: ov.placement || base.placement,
      desc:      ov.desc      || base.desc,
      price:     ov.price     || base.price,
      priceSub:  ov.priceSub  !== undefined ? ov.priceSub : base.priceSub,
      image:     ov.image     || '',
    };
  });

  return (
    <>
      {/* card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap: '1px',
        border: '1px solid #1a1a1a',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#1a1a1a',
      }}>
        {slots.map((slot) => (
          <div key={slot.id} style={{
            background: '#0d0d0d',
            display: 'grid',
            gridTemplateColumns: 'min(160px, 44%) 1fr',
          }}>
            {/* preview: custom image OR wireframe fallback */}
            <div style={{
              height: '110px',
              borderRight: '1px solid #1a1a1a',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {slot.image ? (
                <img
                  src={slot.image}
                  alt={slot.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Wireframe type={slot.wireframe} />
              )}
            </div>

            {/* text */}
            <div style={{
              padding: '1rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>
                  {slot.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {slot.placement}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#00B5AD' }}>{slot.price}</span>
                  {slot.priceSub && (
                    <span style={{ fontSize: '11px', color: '#3a3a3a', marginLeft: '3px' }}>{slot.priceSub}</span>
                  )}
                </div>
                <button
                  onClick={() => setActive(slot)}
                  style={{
                    padding: '5px 14px',
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    color: '#9ca3af', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Дэлгэрэнгүй
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* modal */}
      {active && (
        <Modal slot={active} email={email} onClose={() => setActive(null)} />
      )}
    </>
  );
}
