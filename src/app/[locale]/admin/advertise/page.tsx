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
const sectionHead = (label: string): React.CSSProperties => ({
  fontSize: '14px', fontWeight: 800, color: '#e5e5e5',
  margin: '2rem 0 1.25rem', paddingBottom: '8px',
  borderBottom: '1px solid #1e1e1e',
});

// ─── All CMS keys ─────────────────────────────────────────────────────────────
const ALL_KEYS = [
  // Hero
  'advertise_hero_headline', 'advertise_hero_subtitle',
  'advertise_hero_bg', 'advertise_hero_cta', 'advertise_mediakit_url',
  'advertise_hero_video_url',
  // Stats
  'advertise_stats_image', 'advertise_stats_title',
  // Why
  'advertise_why_title', 'advertise_why_text',
  // Pillars
  ...([1,2,3,4,5,6].flatMap((n) => [
    `advertise_pillar_${n}_title`,
    `advertise_pillar_${n}_desc`,
    `advertise_pillar_${n}_image`,
  ])),
  // Packages
  'advertise_gold_price', 'advertise_premium_price', 'advertise_platinum_price',
  // Contact
  'advertise_contact_email', 'advertise_contact_phone',
];

type V = Record<string, string>;

export default function AdminAdvertisePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [v, setV]         = useState<V>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      const init: V = {};
      ALL_KEYS.forEach((k) => { init[k] = s[k] ?? ''; });
      setV(init);
      setLoading(false);
    });
  }, []);

  function set(key: string, val: string) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    for (const key of ALL_KEYS) {
      await updateSiteSetting(key, v[key] ?? '');
    }
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
    <div style={{ padding: '2rem', maxWidth: '780px' }}>
      <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Admin панел руу буцах
      </Link>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e5e5e5', marginBottom: '0.25rem' }}>
        Сурталчлагчид хуудас
      </h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '0.5rem' }}>
        <code style={{ color: '#00B5AD', fontSize: '12px' }}>/advertise</code> хуудасны бүх агуулгыг энд засна уу.
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

      {/* ── 1. HERO ──────────────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>🎯 Hero хэсэг</h2>
      <Field k="advertise_hero_headline" label="Гарчиг" type="textarea" hint="Хуудасны том гарчиг." />
      <Field k="advertise_hero_subtitle" label="Дэд гарчиг" type="textarea" hint="Гарчигийн доорх дэлгэрэнгүй." />
      <Field k="advertise_hero_bg"       label="Дэвсгэр зургийн URL" hint="Hero хэсгийн дэвсгэр зураг. Хоосон үлдээвэл teal gradient." />
      <Field k="advertise_hero_cta"      label="Татаж авах товчны текст" hint='Жнь: "Сурталчилгааны санал татаж авах"' />
      <Field k="advertise_mediakit_url"  label="Media Kit PDF URL" hint="PDF URL байвал шууд татаж авна. Хоосон бол contact form руу scroll хийнэ." />
      <Field k="advertise_hero_video_url" label="Hero баруун талын видео URL" hint="YouTube watch/share URL эсвэл шууд видео URL. Байвал баруун талд iframe харагдана. Хоосон бол статистик карт харагдана." />

      {/* ── 2. STATS ─────────────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>📊 Статистик хэсэг</h2>
      <Field k="advertise_stats_title" label="Гарчиг" />
      <Field k="advertise_stats_image" label="Баннер зургийн URL" hint="88.8% / 31K+ / 50K+ тооны доор харагдах зураг. Хоосон үлдээвэл нуугдана." />

      {/* ── 3. WHY ADVERTISE ─────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>💡 Яагаад MommyOffice?</h2>
      <Field k="advertise_why_title" label="Гарчиг" />
      <Field k="advertise_why_text"  label="Текст" type="textarea" hint="Товч тайлбар (2–3 өгүүлбэр)." />

      {/* ── 4. 6 PILLARS ─────────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>🏆 6 Агуулгын багана</h2>
      <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
        Зургийн URL байхгүй бол emoji placeholder харагдана. Admin-с зурган URL оруулна.
      </p>
      {[1,2,3,4,5,6].map((n) => (
        <div key={n} style={{
          background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
          padding: '1.25rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 1rem' }}>
            Багана {n}
          </p>
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

      {/* ── 5. PACKAGES ──────────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>💰 Багцын үнэ</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { k: 'advertise_gold_price',     label: 'GOLD' },
          { k: 'advertise_premium_price',  label: 'PREMIUM' },
          { k: 'advertise_platinum_price', label: 'PLATINUM' },
        ].map(({ k, label }) => (
          <div key={k}>
            <label style={lbl}>{label}</label>
            <input value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} placeholder="₮0,000" style={inp} />
          </div>
        ))}
      </div>

      {/* ── 6. CONTACT ───────────────────────────────────────── */}
      <h2 style={sectionHead('dummy')}>📬 Холбоо барих</h2>
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

      {/* ── SAVE ─────────────────────────────────────────────── */}
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
