'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSetting } from '@/app/actions/admin';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── Shared styles ────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700,
  color: '#9ca3af', marginBottom: '6px',
  letterSpacing: '0.8px', textTransform: 'uppercase',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2a2a2a', background: '#0d0d0d',
  color: '#e5e5e5', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: '72px', lineHeight: 1.6 };
const field: React.CSSProperties = { marginBottom: '1.25rem' };
function SectionHead({ label }: { label: string }) {
  return (
    <h2 style={{
      fontSize: '14px', fontWeight: 800, color: '#e5e5e5',
      margin: '2.25rem 0 1.25rem', paddingBottom: '8px',
      borderBottom: '1px solid #1e1e1e',
    }}>
      {label}
    </h2>
  );
}

// ─── Default slot data (mirrors AdvertiseSlots SLOTS) ────────────────────────
const DEFAULT_SLOTS = [
  { id: 'C1',  name: 'C1 — Контент лидерборд',    placement: 'Нийтлэлийн эхэнд',          desc: 'Нийтлэлийн эхэнд том хэмжээний баннер',  price: '₮400,000', priceSub: '/сар' },
  { id: 'C2',  name: 'C2 — Контент лидерборд',    placement: 'Нийтлэлийн дунд',           desc: 'Нийтлэлийн дунд байрлах баннер',         price: '₮350,000', priceSub: '/сар' },
  { id: 'V1',  name: 'V1 — Видео лидерборд',      placement: 'Видео хуудасны эхэнд',      desc: 'Видео контентын дэргэдэх баннер',        price: '₮380,000', priceSub: '/сар' },
  { id: 'H1',  name: 'H1 — Нүүр хуудасны баннер', placement: 'Нүүр хуудасны эхэнд',      desc: 'Нүүр хуудасны хамгийн дээд байр',       price: '₮500,000', priceSub: '/сар' },
  { id: 'POP', name: 'POP — Попап зар',            placement: 'Сайтын бүх хуудас',         desc: 'Нэг удаагийн попап зар бүх хуудаст',    price: '₮600,000', priceSub: '/сар' },
  { id: 'AR1', name: 'AR1 — Нийтлэлийн хажуу',    placement: 'Нийтлэлийн хажуугийн баар', desc: 'Sticky sidebar баннер',                 price: '₮300,000', priceSub: '/сар' },
  { id: 'SH1', name: 'SH1 — Дэлгүүрийн баннер',   placement: 'Дэлгүүрийн хуудас',         desc: 'Дэлгүүрийн хуудасны дээд баннер',       price: '₮320,000', priceSub: '/сар' },
];

// ─── Default package data ─────────────────────────────────────────────────────
const DEFAULT_PACKAGES = [
  { id: 'gold',     name: 'GOLD',     badge: 'Эхлэх',               price: '₮900,000',  items: ['🏠 Нүүр хуудасны баннер — 2 долоо хоног', '📄 3 хуудасны баннер', '🎬 1 Reel'] },
  { id: 'premium',  name: 'PREMIUM',  badge: '⭐ Хамгийн алдартай', price: '₮1,800,000', items: ['💥 Popup зар — 1 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 5 хуудасны баннер', '🎬 2 Reel'] },
  { id: 'platinum', name: 'PLATINUM', badge: 'Максимум',             price: '₮2,800,000', items: ['💥 Popup зар — 2 долоо хоног', '🏠 Нүүр хуудасны баннер — бүтэн сар', '📄 Бүх 8 байршуулалт', '🎬 4 Reel', '✍️ 1 Брэндийн нийтлэл'] },
];

// ─── Keys loaded into the flat v{} map ───────────────────────────────────────
const FLAT_KEYS = [
  // Hero
  'advertise_hero_headline', 'advertise_hero_subtitle',
  'advertise_hero_bg', 'advertise_hero_cta', 'advertise_hero_cta2', 'advertise_mediakit_url',
  // Stats numbers
  'advertise_stat_1_value', 'advertise_stat_1_label',
  'advertise_stat_2_value', 'advertise_stat_2_label',
  'advertise_stat_3_value', 'advertise_stat_3_label',
  'advertise_stats_image',  'advertise_stats_title',
  // Why
  'advertise_why_title', 'advertise_why_text',
  // Pillars section heading
  'advertise_pillars_section_title', 'advertise_pillars_section_desc',
  // 6 pillar cards
  ...([1,2,3,4,5,6].flatMap((n) => [
    `advertise_pillar_${n}_title`,
    `advertise_pillar_${n}_desc`,
    `advertise_pillar_${n}_image`,
  ])),
  // Packages section heading
  'advertise_packages_section_title', 'advertise_packages_section_desc',
  // Slots section heading
  'advertise_slots_section_title', 'advertise_slots_section_desc',
  // Media Kit section heading
  'advertise_mediakit_section_title', 'advertise_mediakit_section_desc',
  // Contact
  'advertise_contact_email', 'advertise_contact_phone',
];

// ─── Types ────────────────────────────────────────────────────────────────────
type V = Record<string, string>;

interface SlotItem {
  id: string; name: string; placement: string;
  desc: string; price: string; priceSub: string; image: string;
}

interface PackageItem {
  id: string; name: string; badge: string; price: string;
  itemsText: string; // newline-separated feature bullets
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminAdvertisePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [v,        setV]        = useState<V>({});
  const [slots,    setSlots]    = useState<SlotItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      // flat keys
      const init: V = {};
      FLAT_KEYS.forEach((k) => { init[k] = s[k] ?? ''; });
      setV(init);

      // slot state
      let savedSlots: Partial<SlotItem>[] = [];
      try { savedSlots = JSON.parse(s['advertise_slots_data'] ?? '[]'); } catch { savedSlots = []; }
      setSlots(DEFAULT_SLOTS.map((def) => {
        const ov = savedSlots.find((x) => x.id === def.id) ?? {};
        return { ...def, ...ov } as SlotItem;
      }));

      // package state
      let savedPkgs: Partial<{ id: string; name: string; badge: string; price: string; items: string[] }>[] = [];
      try { savedPkgs = JSON.parse(s['advertise_packages_data'] ?? '[]'); } catch { savedPkgs = []; }
      setPackages(DEFAULT_PACKAGES.map((def) => {
        const ov = savedPkgs.find((x) => x.id === def.id) ?? {};
        const merged = { ...def, ...ov };
        return { ...merged, itemsText: (merged.items ?? def.items).join('\n') } as PackageItem;
      }));

      setLoading(false);
    });
  }, []);

  function set(key: string, val: string) {
    setV((prev) => ({ ...prev, [key]: val }));
  }
  function setSlotField(id: string, f: keyof SlotItem, val: string) {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [f]: val } : s));
  }
  function setPkgField(id: string, f: keyof PackageItem, val: string) {
    setPackages((prev) => prev.map((p) => p.id === id ? { ...p, [f]: val } : p));
  }

  async function handleSave() {
    setSaving(true);
    for (const key of FLAT_KEYS) {
      await updateSiteSetting(key, v[key] ?? '');
    }
    await updateSiteSetting('advertise_slots_data', JSON.stringify(slots));
    await updateSiteSetting('advertise_packages_data', JSON.stringify(
      packages.map(({ id, name, badge, price, itemsText }) => ({
        id, name, badge, price,
        items: itemsText.split('\n').map((x) => x.trim()).filter(Boolean),
      }))
    ));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ padding: '3rem', color: '#555' }}>Уншиж байна...</div>;

  function Field({ k, label, hint, type = 'text' }: { k: string; label: string; hint?: string; type?: string }) {
    return (
      <div style={field}>
        <label style={lbl}>{label}</label>
        {type === 'textarea' ? (
          <textarea value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} style={ta} />
        ) : (
          <input type={type} value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} style={inp} />
        )}
        {hint && <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>{hint}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Admin панел руу буцах
      </Link>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e5e5e5', marginBottom: '0.25rem' }}>
        Сурталчлагчид хуудас — Бүтэн CMS
      </h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '0.5rem' }}>
        <code style={{ color: '#00B5AD', fontSize: '12px' }}>/advertise</code> хуудасны <strong style={{ color: '#9ca3af' }}>бүх</strong> агуулга, тоо, текст эндээс засна.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <a href={`/${locale}/advertise`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
          /advertise харах ↗
        </a>
        <Link href={`/${locale}/admin/footer`} style={{ fontSize: '12px', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
          Footer цэс →
        </Link>
        <Link href={`/${locale}/admin/ads`} style={{ fontSize: '12px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
          Баннер зарууд →
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="🎯  Hero хэсэг" />
      <Field k="advertise_hero_headline" label="Гарчиг (H1)" type="textarea" hint="Хуудасны том гарчиг." />
      <Field k="advertise_hero_subtitle" label="Дэд гарчиг" type="textarea" />
      <Field k="advertise_hero_bg"       label="Дэвсгэр зургийн URL" hint="Hero хэсгийн дэвсгэр зураг. Хоосон үлдээвэл teal gradient харагдана." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field k="advertise_hero_cta"  label="Үндсэн товчны текст"    hint='Жнь: "Санал татаж авах"' />
        <Field k="advertise_hero_cta2" label="Хоёр дахь товчны текст" hint='Жнь: "Асуулга илгээх"' />
      </div>
      <Field k="advertise_mediakit_url" label="Media Kit PDF URL" hint="PDF URL байвал шууд татаж авна. Хоосон бол contact form руу scroll хийнэ." />

      {/* ══════════════════════════════════════════════════════════
          2. STATS
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="📊  Статистик тоонууд" />
      <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
        Hero-ийн доор харагдах 3 том тоо. Хэзээ ч шинэчлэх боломжтой.
      </p>
      {[1,2,3].map((n) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={lbl}>Тоо #{n}</label>
            <input value={v[`advertise_stat_${n}_value`] ?? ''} onChange={(e) => set(`advertise_stat_${n}_value`, e.target.value)} style={inp} placeholder={['88.8%','31K+','50K+'][n-1]} />
          </div>
          <div>
            <label style={lbl}>Шошго #{n}</label>
            <input value={v[`advertise_stat_${n}_label`] ?? ''} onChange={(e) => set(`advertise_stat_${n}_label`, e.target.value)} style={inp} placeholder={['Эмэгтэй үзэгч','Нийт дагагч','Сарын хүрэлцээ'][n-1]} />
          </div>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
        <Field k="advertise_stats_title" label="Нэмэлт зургийн гарчиг" hint="Тоонуудын доорх зурагт харагдах шошго." />
        <Field k="advertise_stats_image" label="Нэмэлт зургийн URL"    hint="Хоосон үлдээвэл нуугдана." />
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. WHY ADVERTISE
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="💡  Яагаад MommyOffice?" />
      <Field k="advertise_why_title" label="Гарчиг" />
      <Field k="advertise_why_text"  label="Текст" type="textarea" hint="Товч тайлбар (2–3 өгүүлбэр)." />

      {/* ══════════════════════════════════════════════════════════
          4. 6 CONTENT PILLARS
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="🏆  Агуулгын 6 багана" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field k="advertise_pillars_section_title" label="Хэсгийн гарчиг" />
        <Field k="advertise_pillars_section_desc"  label="Хэсгийн дэд текст" />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Зургийн URL байхгүй бол emoji placeholder харагдана.
      </p>
      {[1,2,3,4,5,6].map((n) => (
        <div key={n} style={{
          background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
          padding: '1.25rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 1rem' }}>Багана {n}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Гарчиг</label>
              <input value={v[`advertise_pillar_${n}_title`] ?? ''} onChange={(e) => set(`advertise_pillar_${n}_title`, e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Зургийн URL</label>
              <input value={v[`advertise_pillar_${n}_image`] ?? ''} onChange={(e) => set(`advertise_pillar_${n}_image`, e.target.value)} style={inp} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label style={lbl}>Тайлбар</label>
            <textarea value={v[`advertise_pillar_${n}_desc`] ?? ''} onChange={(e) => set(`advertise_pillar_${n}_desc`, e.target.value)} style={{ ...ta, minHeight: '56px' }} />
          </div>
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════
          5. PACKAGES
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="💰  Багцууд (Gold / Premium / Platinum)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field k="advertise_packages_section_title" label="Хэсгийн гарчиг" />
        <Field k="advertise_packages_section_desc"  label="Хэсгийн дэд текст" />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Онцлог жагсаалтыг мөр мөрөөр оруулна уу. Нэг мөр = нэг онцлог.
      </p>
      {packages.map((pkg) => (
        <div key={pkg.id} style={{
          background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
          padding: '1.25rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {pkg.id}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Нэр</label>
              <input value={pkg.name}  onChange={(e) => setPkgField(pkg.id, 'name', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Badge шошго</label>
              <input value={pkg.badge} onChange={(e) => setPkgField(pkg.id, 'badge', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Үнэ</label>
              <input value={pkg.price} onChange={(e) => setPkgField(pkg.id, 'price', e.target.value)} style={inp} placeholder="₮0,000" />
            </div>
          </div>
          <div>
            <label style={lbl}>Онцлогууд (мөр мөрөөр)</label>
            <textarea
              value={pkg.itemsText}
              onChange={(e) => setPkgField(pkg.id, 'itemsText', e.target.value)}
              style={{ ...ta, minHeight: '100px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder={'🏠 Нүүр хуудасны баннер\n📄 3 хуудасны баннер\n🎬 1 Reel'}
            />
            <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
              Нэг мөр = нэг зүйл. Хоосон мөр үл тооцно.
            </p>
          </div>
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════
          6. SLOT CARDS
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="🗂  Байршуулалтын карт (7 слот)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field k="advertise_slots_section_title" label="Хэсгийн гарчиг" />
        <Field k="advertise_slots_section_desc"  label="Хэсгийн дэд текст" />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Зурган URL оруулбал wireframe-ийн оронд тухайн зураг харагдана.
      </p>
      {slots.map((slot) => (
        <div key={slot.id} style={{
          background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
          padding: '1.25rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#00B5AD', margin: '0 0 1rem', letterSpacing: '1px' }}>{slot.id}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Нэр</label>
              <input value={slot.name}      onChange={(e) => setSlotField(slot.id, 'name', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Байршуулалт</label>
              <input value={slot.placement} onChange={(e) => setSlotField(slot.id, 'placement', e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={lbl}>Зургийн URL</label>
            <input value={slot.image} onChange={(e) => setSlotField(slot.id, 'image', e.target.value)} placeholder="https://..." style={inp} />
            <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>Хоосон үлдээвэл CSS wireframe харагдана.</p>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={lbl}>Тайлбар</label>
            <textarea value={slot.desc} onChange={(e) => setSlotField(slot.id, 'desc', e.target.value)} style={{ ...ta, minHeight: '52px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Үнэ</label>
              <input value={slot.price}    onChange={(e) => setSlotField(slot.id, 'price', e.target.value)} placeholder="₮0,000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Үнийн давтамж</label>
              <input value={slot.priceSub} onChange={(e) => setSlotField(slot.id, 'priceSub', e.target.value)} placeholder="/сар" style={inp} />
            </div>
          </div>
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════
          7. MEDIA KIT BANNER
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="📥  Media Kit баннер" />
      <Field k="advertise_mediakit_section_title" label="Гарчиг" />
      <Field k="advertise_mediakit_section_desc"  label="Дэд текст" type="textarea" />

      {/* ══════════════════════════════════════════════════════════
          8. CONTACT
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="📬  Холбоо барих" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={lbl}>Имэйл</label>
          <input type="email" value={v['advertise_contact_email'] ?? ''} onChange={(e) => set('advertise_contact_email', e.target.value)} style={inp} placeholder="info.mommyoffice@gmail.com" />
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>Асуулга энд очно.</p>
        </div>
        <div>
          <label style={lbl}>Утасны дугаар</label>
          <input type="tel" value={v['advertise_contact_phone'] ?? ''} onChange={(e) => set('advertise_contact_phone', e.target.value)} style={inp} placeholder="+976 9900 0000" />
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>Хоосон үлдээвэл нуугдана.</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SAVE
      ══════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1e1e1e' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '13px 36px', borderRadius: '8px', border: 'none',
            cursor: saving ? 'default' : 'pointer',
            background: saved ? '#10b981' : '#00B5AD',
            color: '#fff', fontWeight: 800, fontSize: '14px',
            opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Хадгалж байна...' : saved ? '✓ Хадгалагдлаа!' : 'Бүгдийг хадгалах'}
        </button>
        <p style={{ fontSize: '12px', color: '#374151', marginTop: '0.75rem' }}>
          Хадгалсны дараа /advertise хуудас шинэчлэгдэнэ.
        </p>
      </div>
    </div>
  );
}
