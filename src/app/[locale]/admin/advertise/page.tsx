'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSetting } from '@/app/actions/admin';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700,
  color: '#9ca3af', marginBottom: '6px',
  letterSpacing: '0.8px', textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2a2a2a', background: '#0d0d0d',
  color: '#e5e5e5', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  lineHeight: 1.6,
};
const fieldStyle: React.CSSProperties = { marginBottom: '1.5rem' };

const FIELDS: { key: string; label: string; placeholder: string; hint?: string; type?: 'email' | 'textarea' }[] = [
  // ── Hero
  {
    key: 'advertise_hero_headline',
    label: 'Hero гарчиг',
    placeholder: 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул',
    type: 'textarea',
    hint: '/advertise хуудасны том гарчиг.',
  },
  {
    key: 'advertise_hero_subtitle',
    label: 'Hero тайлбар',
    placeholder: '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.',
    type: 'textarea',
    hint: 'Hero гарчигийн доорх дэлгэрэнгүй.',
  },
  // ── Package prices
  {
    key: 'advertise_gold_price',
    label: 'GOLD багцын үнэ',
    placeholder: '₮900,000',
    hint: 'Жишээ: ₮900,000',
  },
  {
    key: 'advertise_premium_price',
    label: 'PREMIUM багцын үнэ',
    placeholder: '₮1,800,000',
    hint: 'Жишээ: ₮1,800,000',
  },
  {
    key: 'advertise_platinum_price',
    label: 'PLATINUM багцын үнэ',
    placeholder: '₮2,800,000',
    hint: 'Жишээ: ₮2,800,000',
  },
  // ── Contact
  {
    key: 'advertise_contact_email',
    label: 'Сурталчилгааны имэйл',
    placeholder: 'info.mommyoffice@gmail.com',
    type: 'email',
    hint: '"Холбогдох" товч болон CTA хэсэгт харагдана.',
  },
  {
    key: 'advertise_contact_phone',
    label: 'Утасны дугаар',
    placeholder: '+976 9900 0000',
    hint: 'Хоосон үлдээвэл харагдахгүй.',
  },
];

export default function AdminAdvertisePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [values, setValues]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      const init: Record<string, string> = {};
      FIELDS.forEach(({ key }) => { init[key] = s[key] ?? ''; });
      setValues(init);
      setLoading(false);
    });
  }, []);

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    for (const { key } of FIELDS) {
      await updateSiteSetting(key, values[key] ?? '');
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div style={{ padding: '3rem', color: '#555' }}>Уншиж байна...</div>;
  }

  // Split fields into sections
  const heroFields    = FIELDS.filter((f) => f.key.startsWith('advertise_hero'));
  const priceFields   = FIELDS.filter((f) => f.key.includes('_price'));
  const contactFields = FIELDS.filter((f) => f.key.includes('_email') || f.key.includes('_phone'));

  function renderField({ key, label, placeholder, hint, type }: typeof FIELDS[0]) {
    return (
      <div key={key} style={fieldStyle}>
        <label style={labelStyle}>{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={values[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            style={textareaStyle}
          />
        ) : (
          <input
            type={type ?? 'text'}
            value={values[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
        )}
        {hint && <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{hint}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>

      <Link
        href={`/${locale}/admin`}
        style={{ display: 'inline-block', color: '#00B5AD', fontSize: '13px', textDecoration: 'none', marginBottom: '1.5rem' }}
      >
        ← Admin панел руу буцах
      </Link>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e5e5e5', marginBottom: '0.25rem' }}>
        Сурталчлагчид хуудас
      </h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '2.5rem' }}>
        <code style={{ color: '#00B5AD', fontSize: '12px' }}>/advertise</code> хуудасны агуулгыг энд засна уу.
      </p>

      {/* Hero section */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#e5e5e5', marginBottom: '1.25rem', paddingBottom: '8px', borderBottom: '1px solid #1e1e1e' }}>
        🎯 Hero хэсэг
      </h2>
      {heroFields.map(renderField)}

      {/* Package prices */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#e5e5e5', margin: '2rem 0 1.25rem', paddingBottom: '8px', borderBottom: '1px solid #1e1e1e' }}>
        💰 Багцуудын үнэ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {priceFields.map(({ key, label, placeholder, hint }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input
              type="text"
              value={values[key] ?? ''}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              style={inputStyle}
            />
            {hint && <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>{hint}</p>}
          </div>
        ))}
      </div>

      {/* Contact */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#e5e5e5', margin: '2rem 0 1.25rem', paddingBottom: '8px', borderBottom: '1px solid #1e1e1e' }}>
        📬 Холбоо барих
      </h2>
      {contactFields.map(renderField)}

      {/* Quick links */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '2rem', padding: '1rem 1.25rem',
        background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
      }}>
        <span style={{ fontSize: '12px', color: '#4b5563', alignSelf: 'center' }}>Харах:</span>
        <a href={`/${locale}/advertise`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '13px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
          /advertise ↗
        </a>
        <Link href={`/${locale}/admin/footer`}
          style={{ fontSize: '13px', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
          Footer цэс →
        </Link>
        <Link href={`/${locale}/admin/ads`}
          style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
          Баннер зарууд →
        </Link>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '12px 32px', borderRadius: '8px', border: 'none',
          cursor: saving ? 'default' : 'pointer',
          background: saved ? '#10b981' : '#00B5AD',
          color: '#fff', fontWeight: 800, fontSize: '14px',
          opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
        }}
      >
        {saving ? 'Хадгалж байна...' : saved ? '✓ Хадгалагдлаа!' : 'Хадгалах'}
      </button>
    </div>
  );
}
