'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSetting, uploadImage } from '@/app/actions/admin';
import ImageInput from '@/components/admin/ImageInput';
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

function SectionHead({ label, toggleValue, onToggle }: {
  label: string;
  toggleValue?: string;
  onToggle?: (val: string) => void;
}) {
  const isOn = (toggleValue ?? '1') !== '0';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '2.25rem 0 1.25rem', paddingBottom: '8px', borderBottom: '1px solid #1e1e1e',
    }}>
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#e5e5e5', margin: 0 }}>
        {label}
      </h2>
      {onToggle && (
        <button
          type="button"
          onClick={() => onToggle(isOn ? '0' : '1')}
          title={isOn ? 'Нуух' : 'Харуулах'}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: isOn ? 'rgba(0,181,173,0.08)' : 'rgba(107,114,128,0.08)',
            border: `1px solid ${isOn ? 'rgba(0,181,173,0.25)' : '#2a2a2a'}`,
            borderRadius: '20px', padding: '4px 10px 4px 6px', cursor: 'pointer',
          }}
        >
          {/* pill track */}
          <span style={{
            width: '30px', height: '17px', borderRadius: '9px', flexShrink: 0,
            background: isOn ? '#00B5AD' : '#2a2a2a',
            position: 'relative', display: 'inline-block', transition: 'background 0.18s',
          }}>
            <span style={{
              position: 'absolute', top: '2px',
              left: isOn ? '15px' : '2px',
              width: '13px', height: '13px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.18s',
            }} />
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
            textTransform: 'uppercase', color: isOn ? '#00B5AD' : '#6b7280',
          }}>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </button>
      )}
    </div>
  );
}

// ─── Extract YouTube ID from URL, youtu.be link, or bare 11-char ID ──────────
function extractYouTubeId(input: string): string {
  if (!input) return '';
  const full = input.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (full) return full[1];
  const short = input.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return short[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return '';
}

// ─── Default slot data — IDs must match AdvertiseSlots SLOTS ─────────────────
const DEFAULT_SLOTS = [
  { id: 'popup',    name: 'Popup зар',               placement: 'Нүүр хуудас — дэлгэцийн дунд',    desc: 'Хуудас ачаалахад дэлгэцийн дунд гарна. Хамгийн өндөр харагдах чадвар.',               price: '₮350,000',         priceSub: '/ 3 хоногийн блок' },
  { id: 'hero',     name: 'Нүүр хуудасны баннер',    placement: 'Нүүр хуудас — hero хэсгийн доор', desc: 'Сайтад орсон бүх хэрэглэгч харна. Хамгийн өндөр хүрэх чадвар бүхий байнгын байршуулалт.', price: '₮200,000–₮650,000', priceSub: '/ 1–4 долоо хоног' },
  { id: 'articles', name: 'Нийтлэлийн баннер',       placement: 'Нийтлэл хуудас — дээд хэсэг',     desc: 'Нийтлэлийн жагсаалт болон дэлгэрэнгүй хуудсуудад харагдана.',                          price: '₮100,000-с',       priceSub: '/ сар' },
  { id: 'inline',   name: 'Нийтлэлийн дотор баннер', placement: 'Нийтлэлийн эхэнд — агуулгын дотор', desc: 'Нийтлэлийг унших үед хуудсыг гүйлгэх явцад харагдана.',                             price: '₮100,000-с',       priceSub: '/ сар' },
  { id: 'courses',  name: 'Хичээлийн баннер',         placement: 'Хичээлүүд хуудас — доод хэсэг',   desc: 'Хичээл үзэж буй болон сурахыг хүсэж буй хэрэглэгчид харна.',                          price: '₮100,000-с',       priceSub: '/ сар' },
  { id: 'videos',   name: 'Видео хуудасны баннер',    placement: 'Видео & Кино хуудас — доод хэсэг', desc: 'Видео контент үзэж буй хэрэглэгчид харна.',                                           price: '₮100,000-с',       priceSub: '/ сар' },
  { id: 'reel',     name: 'Facebook / Instagram Reel', placement: 'Нийгмийн сүлжээ',               desc: 'MommyOffice-ийн Facebook болон Instagram хуудаст Reel байршуулалт.',                   price: '₮500,000',         priceSub: '/ 1 Reel (зөвхөн багцад)' },
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
  'advertise_hero_bg', 'advertise_hero_cta', 'advertise_hero_cta2',
  'advertise_hero_youtube_id',
  'advertise_mediakit_url',
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
  // Media Kit section
  'advertise_mediakit_section_title', 'advertise_mediakit_section_desc',
  'advertise_mediakit_section_bg',
  // Contact
  'advertise_contact_email', 'advertise_contact_phone',
  // Section visibility toggles (default ON — missing key = shown)
  'advertise_show_hero', 'advertise_show_stats', 'advertise_show_why',
  'advertise_show_pillars', 'advertise_show_packages', 'advertise_show_slots',
  'advertise_show_specs', 'advertise_show_mediakit', 'advertise_show_contact',
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

// ─── DocumentInput — MODULE LEVEL (never define inside a component render!) ──
// Defining a component inside another component causes React to see a NEW
// component type on every re-render, forcing unmount+remount on every keystroke.
function DocumentInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const filename = value ? (value.split('/').pop()?.split('?')[0] ?? 'файл') : '';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploading(true); setIsError(false); setStatus('Файл upload хийж байна...');
    try {
      const fd = new FormData();
      fd.append('file', raw);
      // uploadImage accepts any file type; 'advertise' folder is now supported
      const { error, url } = await uploadImage(fd, 'advertise' as 'articles');
      if (error || !url) {
        setIsError(true); setStatus(`Алдаа: ${error ?? 'URL хоосон'}`);
      } else {
        onChange(url);
        setStatus('✓ Амжилттай upload хийлээ');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch {
      setIsError(true); setStatus('Upload хийхэд алдаа гарлаа.');
    }
    setUploading(false);
  }

  return (
    <div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px 12px', background: 'rgba(0,181,173,0.08)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '8px' }}>
          <span style={{ fontSize: '18px' }}>📄</span>
          <span style={{ fontSize: '12px', color: '#00B5AD', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</span>
          <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2a2a2a', border: '1px solid #333', color: '#e5e5e5', padding: '9px 16px', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
          {uploading ? '⏳ Uploading...' : '📁 Файл upload (.pdf .docx .pptx)'}
          <input type="file" accept=".pdf,.docx,.pptx,.doc" disabled={uploading} onChange={handleFile} style={{ display: 'none' }} />
        </label>
        <input type="url" value={value} onChange={(e) => { onChange(e.target.value); setStatus(''); }} placeholder="https://...pdf (URL-аар оруулах)" style={{ ...inp, flex: 1, minWidth: '180px' }} />
      </div>
      {status && (
        <p style={{ fontSize: '12px', marginTop: '6px', padding: '6px 12px', borderRadius: '6px', background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: isError ? '#fca5a5' : '#6ee7b7', margin: '6px 0 0' }}>
          {status}
        </p>
      )}
    </div>
  );
}

// ─── Field — MODULE LEVEL (same reason: stable reference = no remount on type) ─
function Field({ label, hint, type = 'text', value, onChange }: {
  label: string; hint?: string; type?: string;
  value: string; onChange: (val: string) => void;
}) {
  return (
    <div style={field}>
      <label style={lbl}>{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} style={ta} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inp} />
      )}
      {hint && <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>{hint}</p>}
    </div>
  );
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
      const init: V = {};
      FLAT_KEYS.forEach((k) => { init[k] = s[k] ?? ''; });
      setV(init);

      let savedSlots: Partial<SlotItem>[] = [];
      try { savedSlots = JSON.parse(s['advertise_slots_data'] ?? '[]'); } catch { savedSlots = []; }
      setSlots(DEFAULT_SLOTS.map((def) => {
        const ov = savedSlots.find((x) => x.id === def.id) ?? {};
        return { ...def, ...ov, image: (ov as SlotItem).image ?? '' } as SlotItem;
      }));

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
    // Run all updates in parallel — was sequential (48 round-trips ~7s), now ~200ms
    await Promise.all([
      ...FLAT_KEYS.map((key) => updateSiteSetting(key, v[key] ?? '')),
      updateSiteSetting('advertise_slots_data', JSON.stringify(slots)),
      updateSiteSetting('advertise_packages_data', JSON.stringify(
        packages.map(({ id, name, badge, price, itemsText }) => ({
          id, name, badge, price,
          items: itemsText.split('\n').map((x) => x.trim()).filter(Boolean),
        }))
      )),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ padding: '3rem', color: '#555' }}>Уншиж байна...</div>;

  // ── YouTube ID ──────────────────────────────────────────────────────────
  const ytId = extractYouTubeId(v['advertise_hero_youtube_id'] ?? '');

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
      <SectionHead label="🎯  Hero хэсэг" toggleValue={v['advertise_show_hero'] ?? '1'} onToggle={(val) => set('advertise_show_hero', val)} />
      <Field label="Гарчиг (H1)" type="textarea" hint="Хуудасны том гарчиг." value={v['advertise_hero_headline'] ?? ''} onChange={(val) => set('advertise_hero_headline', val)} />
      <Field label="Дэд гарчиг" type="textarea" value={v['advertise_hero_subtitle'] ?? ''} onChange={(val) => set('advertise_hero_subtitle', val)} />

      <div style={field}>
        <label style={lbl}>Дэвсгэр зураг (Hero background)</label>
        <ImageInput
          value={v['advertise_hero_bg'] ?? ''}
          onChange={(url) => set('advertise_hero_bg', url)}
          folder="advertise"
          hint="💡 Hero дэвсгэр зураг — заавал ӨРГӨН LANDSCAPE хэлбэртэй байх: 1600×480px (3.3:1 харьцаа). Portrait эсвэл square зураг objectFit:cover-ээр таслагдана. Макс 5MB."
        />
      </div>

      {/* YouTube autoplay */}
      <div style={field}>
        <label style={lbl}>▶ YouTube Autoplay (заавал биш)</label>
        <input
          type="text"
          value={v['advertise_hero_youtube_id'] ?? ''}
          onChange={(e) => set('advertise_hero_youtube_id', e.target.value)}
          placeholder="YouTube URL эсвэл Video ID (жнь: dQw4w9WgXcQ)"
          style={inp}
        />
        <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
          Desktop-д 2.5 секундын дараа дуугүйгээр autoplay хийнэ. Mobile-д харагдахгүй.
        </p>
        {ytId && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt="YouTube preview"
              style={{ width: '180px', height: '101px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a', flexShrink: 0 }}
            />
            <p style={{ fontSize: '11px', color: '#00B5AD', margin: 0 }}>✓ YouTube ID: <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>{ytId}</code></p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Үндсэн товчны текст"    hint='Жнь: "Санал татаж авах"' value={v['advertise_hero_cta'] ?? ''}  onChange={(val) => set('advertise_hero_cta', val)} />
        <Field label="Хоёр дахь товчны текст" hint='Жнь: "Асуулга илгээх"'  value={v['advertise_hero_cta2'] ?? ''} onChange={(val) => set('advertise_hero_cta2', val)} />
      </div>

      <div style={field}>
        <label style={lbl}>Media Kit PDF / Файл</label>
        <DocumentInput
          value={v['advertise_mediakit_url'] ?? ''}
          onChange={(url) => set('advertise_mediakit_url', url)}
        />
        <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
          PDF URL байвал Hero товч шууд татаж авна. Хоосон бол contact form руу scroll хийнэ.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. STATS / REACH BANNER
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="📊  Хүрэлцээний баннер" toggleValue={v['advertise_show_stats'] ?? '1'} onToggle={(val) => set('advertise_show_stats', val)} />
      <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
        Зураг оруулбал hero-ийн доор бүтэн өргөний баннер болж харагдана. Хоосон үлдээвэл 3 тоо харагдана.
      </p>
      <div style={field}>
        <label style={lbl}>Баннер зураг (бүтэн өргөн)</label>
        <ImageInput
          value={v['advertise_stats_image'] ?? ''}
          onChange={(url) => set('advertise_stats_image', url)}
          folder="advertise"
          hint="Зөвлөмж: 1600×400px орчим (Statistics / Audience reach infographic)"
        />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Зураг байхгүй үед доорх 3 тоо fallback болж харагдана:
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

      {/* ══════════════════════════════════════════════════════════
          3. WHY ADVERTISE
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="💡  Яагаад MommyOffice?" toggleValue={v['advertise_show_why'] ?? '1'} onToggle={(val) => set('advertise_show_why', val)} />
      <Field label="Гарчиг" value={v['advertise_why_title'] ?? ''} onChange={(val) => set('advertise_why_title', val)} />
      <Field label="Текст" type="textarea" hint="Товч тайлбар (2–3 өгүүлбэр)." value={v['advertise_why_text'] ?? ''} onChange={(val) => set('advertise_why_text', val)} />

      {/* ══════════════════════════════════════════════════════════
          4. 6 CONTENT PILLARS
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="🏆  Агуулгын 6 багана" toggleValue={v['advertise_show_pillars'] ?? '1'} onToggle={(val) => set('advertise_show_pillars', val)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field label="Хэсгийн гарчиг"    value={v['advertise_pillars_section_title'] ?? ''} onChange={(val) => set('advertise_pillars_section_title', val)} />
        <Field label="Хэсгийн дэд текст" value={v['advertise_pillars_section_desc'] ?? ''}  onChange={(val) => set('advertise_pillars_section_desc', val)} />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Зураг байхгүй бол emoji placeholder харагдана.
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
              <label style={lbl}>Тайлбар</label>
              <textarea value={v[`advertise_pillar_${n}_desc`] ?? ''} onChange={(e) => set(`advertise_pillar_${n}_desc`, e.target.value)} style={{ ...ta, minHeight: '52px' }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Зураг</label>
            <ImageInput
              value={v[`advertise_pillar_${n}_image`] ?? ''}
              onChange={(url) => set(`advertise_pillar_${n}_image`, url)}
              folder="advertise"
              hint="Зөвлөмж: 1200×675px (16:9)"
            />
          </div>
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════
          5. PACKAGES
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="💰  Багцууд (Gold / Premium / Platinum)" toggleValue={v['advertise_show_packages'] ?? '1'} onToggle={(val) => set('advertise_show_packages', val)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field label="Хэсгийн гарчиг"    value={v['advertise_packages_section_title'] ?? ''} onChange={(val) => set('advertise_packages_section_title', val)} />
        <Field label="Хэсгийн дэд текст" value={v['advertise_packages_section_desc'] ?? ''}  onChange={(val) => set('advertise_packages_section_desc', val)} />
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
              <input value={pkg.price} onChange={(e) => setPkgField(pkg.id, 'price', e.target.value)} placeholder="₮0,000" style={inp} />
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
      <SectionHead label="🗂  Байршуулалтын карт (7 слот)" toggleValue={v['advertise_show_slots'] ?? '1'} onToggle={(val) => set('advertise_show_slots', val)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <Field label="Хэсгийн гарчиг"    value={v['advertise_slots_section_title'] ?? ''} onChange={(val) => set('advertise_slots_section_title', val)} />
        <Field label="Хэсгийн дэд текст" value={v['advertise_slots_section_desc'] ?? ''}  onChange={(val) => set('advertise_slots_section_desc', val)} />
      </div>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '1.25rem' }}>
        Зураг оруулбал wireframe-ийн оронд тухайн зураг харагдана.
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
            <label style={lbl}>Тайлбар</label>
            <textarea value={slot.desc} onChange={(e) => setSlotField(slot.id, 'desc', e.target.value)} style={{ ...ta, minHeight: '52px' }} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={lbl}>Зураг (wireframe-ийн оронд харагдана)</label>
            <ImageInput
              value={slot.image}
              onChange={(url) => setSlotField(slot.id, 'image', url)}
              folder="advertise"
              hint="Хоосон үлдээвэл CSS wireframe харагдана."
            />
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
      <SectionHead label="📋  Баннерийн техникийн шаардлага (хүснэгт)" toggleValue={v['advertise_show_specs'] ?? '1'} onToggle={(val) => set('advertise_show_specs', val)} />
      <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
        Статик хүснэгт — агуулга засах боломжгүй, зөвхөн харуулах/нуулах.
      </p>

      <SectionHead label="📥  Media Kit баннер" toggleValue={v['advertise_show_mediakit'] ?? '1'} onToggle={(val) => set('advertise_show_mediakit', val)} />
      <Field label="Гарчиг"    value={v['advertise_mediakit_section_title'] ?? ''} onChange={(val) => set('advertise_mediakit_section_title', val)} />
      <Field label="Дэд текст" type="textarea" value={v['advertise_mediakit_section_desc'] ?? ''} onChange={(val) => set('advertise_mediakit_section_desc', val)} />
      <div style={field}>
        <label style={lbl}>Дэвсгэр зураг (баннерийн арын зураг)</label>
        <ImageInput
          value={v['advertise_mediakit_section_bg'] ?? ''}
          onChange={(url) => set('advertise_mediakit_section_bg', url)}
          folder="advertise"
          hint="Зөвлөмж: 1600×400px. Хоосон үлдээвэл teal gradient харагдана."
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          8. CONTACT
      ══════════════════════════════════════════════════════════ */}
      <SectionHead label="📬  Холбоо барих" toggleValue={v['advertise_show_contact'] ?? '1'} onToggle={(val) => set('advertise_show_contact', val)} />
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
