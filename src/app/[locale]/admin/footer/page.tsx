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

const FIELDS: { key: string; label: string; placeholder: string; hint?: string }[] = [
  {
    key: 'footer_tagline',
    label: 'Брэндийн тайлбар (Tagline)',
    placeholder: 'Монголын эмэгтэйчүүдийн №1 платформ',
    hint: 'Footer-ийн зүүн доод хэсэгт логоны доор харагдана.',
  },
  {
    key: 'footer_contact_email',
    label: 'Холбоо барих имэйл',
    placeholder: 'info.mommyoffice@gmail.com',
    hint: 'Footer болон Contact хуудасны имэйл хаяг.',
  },
  {
    key: 'footer_facebook_url',
    label: 'Facebook URL',
    placeholder: 'https://www.facebook.com/MommyofficeMN',
  },
  {
    key: 'footer_instagram_url',
    label: 'Instagram URL',
    placeholder: 'https://www.instagram.com/mommyoffice_mo/',
  },
  {
    key: 'footer_youtube_url',
    label: 'YouTube URL',
    placeholder: 'https://www.youtube.com/@mommyoffice',
    hint: 'Хоосон үлдээвэл footer-д харагдахгүй.',
  },
  {
    key: 'footer_tiktok_url',
    label: 'TikTok URL',
    placeholder: 'https://www.tiktok.com/@mommyoffice',
    hint: 'Хоосон үлдээвэл footer-д харагдахгүй.',
  },
];

export default function FooterSettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setValues({
        footer_tagline:       s.footer_tagline       ?? '',
        footer_contact_email: s.footer_contact_email ?? '',
        footer_facebook_url:  s.footer_facebook_url  ?? '',
        footer_instagram_url: s.footer_instagram_url ?? '',
        footer_youtube_url:   s.footer_youtube_url   ?? '',
        footer_tiktok_url:    s.footer_tiktok_url    ?? '',
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
        Footer тохиргоо
      </h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '2.5rem' }}>
        Сайтын footer хэсгийн нийгмийн сүлжээ, имэйл болон тайлбарыг энд засна уу.
      </p>

      {FIELDS.map(({ key, label, placeholder, hint }) => (
        <div key={key} style={fieldStyle}>
          <label style={labelStyle}>{label}</label>
          <input
            type={key.includes('email') ? 'email' : 'text'}
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

      {/* Live preview strip */}
      <div style={{
        background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '10px',
        padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Урьдчилан харах
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.4rem' }}>
          <strong style={{ color: '#9ca3af' }}>Tagline:</strong> {values.footer_tagline || '—'}
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.4rem' }}>
          <strong style={{ color: '#9ca3af' }}>Email:</strong>{' '}
          {values.footer_contact_email ? (
            <a href={`mailto:${values.footer_contact_email}`} style={{ color: '#00B5AD', textDecoration: 'none' }}>
              {values.footer_contact_email}
            </a>
          ) : '—'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {values.footer_facebook_url  && <a href={values.footer_facebook_url}  target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Facebook ↗</a>}
          {values.footer_instagram_url && <a href={values.footer_instagram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Instagram ↗</a>}
          {values.footer_youtube_url   && <a href={values.footer_youtube_url}   target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>YouTube ↗</a>}
          {values.footer_tiktok_url    && <a href={values.footer_tiktok_url}    target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>TikTok ↗</a>}
        </div>
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
        Хадгалсны дараа footer шинэчлэгдэнэ (Next.js cache хэдэн секундэд шинэчлэгдэнэ).
      </p>

    </div>
  );
}
