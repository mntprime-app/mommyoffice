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

const fieldStyle: React.CSSProperties = { marginBottom: '1.5rem' };

const FIELDS: { key: string; label: string; placeholder: string; hint?: string; type?: string }[] = [
  {
    key: 'advertise_contact_email',
    label: 'Сурталчилгааны имэйл',
    placeholder: 'info.mommyoffice@gmail.com',
    type: 'email',
    hint: '/advertise хуудасны "Холбогдох" товч болон CTA хэсэгт харагдана.',
  },
  {
    key: 'advertise_contact_phone',
    label: 'Утасны дугаар',
    placeholder: '+976 9900 0000',
    hint: 'Хоосон үлдээвэл /advertise хуудаст харагдахгүй.',
  },
];

export default function AdminAdvertisePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setValues({
        advertise_contact_email: s.advertise_contact_email ?? '',
        advertise_contact_phone: s.advertise_contact_phone ?? '',
      });
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

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>

      {/* Back link */}
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
        <code style={{ color: '#00B5AD', fontSize: '12px' }}>/advertise</code> хуудасны холбоо барих мэдээллийг энд засна уу.
      </p>

      {FIELDS.map(({ key, label, placeholder, hint, type }) => (
        <div key={key} style={fieldStyle}>
          <label style={labelStyle}>{label}</label>
          <input
            type={type ?? 'text'}
            value={values[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
          {hint && (
            <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{hint}</p>
          )}
        </div>
      ))}

      {/* Live preview */}
      <div style={{
        background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '10px',
        padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Урьдчилан харах
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.4rem' }}>
          <strong style={{ color: '#9ca3af' }}>Имэйл:</strong>{' '}
          {values.advertise_contact_email ? (
            <a href={`mailto:${values.advertise_contact_email}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>
              {values.advertise_contact_email}
            </a>
          ) : '—'}
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          <strong style={{ color: '#9ca3af' }}>Утас:</strong>{' '}
          {values.advertise_contact_phone || <span style={{ color: '#3a3a3a' }}>Хоосон (харагдахгүй)</span>}
        </p>
      </div>

      {/* Quick links */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '2rem', padding: '1rem 1.25rem',
        background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
      }}>
        <span style={{ fontSize: '12px', color: '#4b5563', alignSelf: 'center', marginRight: '0.25rem' }}>Харах:</span>
        <a
          href={`/${locale}/advertise`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '13px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}
        >
          /advertise ↗
        </a>
        <Link href={`/${locale}/admin/footer`} style={{ fontSize: '13px', color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
          Footer тохиргоо →
        </Link>
        <Link href={`/${locale}/admin/ads`} style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
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

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#444' }}>
        Хадгалсны дараа /advertise хуудас шинэчлэгдэнэ.
      </p>

    </div>
  );
}
