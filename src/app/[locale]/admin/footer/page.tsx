'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSetting } from '@/app/actions/admin';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

type NavLink = { label: string; href: string };

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700,
  color: '#9ca3af', marginBottom: '6px',
  letterSpacing: '0.8px', textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2a2a2a', background: '#0d0d0d',
  color: '#e5e5e5', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
};
const fieldStyle: React.CSSProperties = { marginBottom: '1.5rem' };

// ─── Link column editor ───────────────────────────────────────────────────────

function LinkColumnEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: NavLink[];
  onChange: (updated: NavLink[]) => void;
}) {
  function update(i: number, field: 'label' | 'href', val: string) {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    onChange(next);
  }
  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...links, { label: '', href: '/' }]);
  }

  return (
    <div style={{
      background: '#111', border: '1px solid #2a2a2a',
      borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem',
    }}>
      <p style={{ ...labelStyle, marginBottom: '1.25rem', fontSize: '13px', color: '#e5e5e5' }}>
        {title}
      </p>

      {links.map((l, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr auto',
          gap: '8px', marginBottom: '8px', alignItems: 'center',
        }}>
          <input
            type="text"
            value={l.label}
            onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Нэр (жнь: Хичээлүүд)"
            style={{ ...inputStyle, width: '100%' }}
          />
          <input
            type="text"
            value={l.href}
            onChange={(e) => update(i, 'href', e.target.value)}
            placeholder="/courses"
            style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af' }}
          />
          <button
            onClick={() => remove(i)}
            style={{
              width: '36px', height: '36px', border: 'none',
              background: '#1e1e1e', color: '#6b7280',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Устгах"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={add}
        style={{
          marginTop: '8px', padding: '8px 20px',
          background: 'transparent', border: '1px dashed #2a2a2a',
          color: '#4b5563', borderRadius: '8px',
          cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          width: '100%',
        }}
      >
        + Холбоос нэмэх
      </button>

      <p style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '10px' }}>
        Дарааллыг өөрчлөхийн тулд мөрүүдийн дарааллыг зөөж хадгалаарай.
        Гадаад холбоос жишээ нь: https://facebook.com/…
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SOCIAL_FIELDS = [
  { key: 'footer_tagline',       label: 'Брэндийн тайлбар (Tagline)',  placeholder: 'Монголын эмэгтэйчүүдийн №1 платформ', hint: 'Логоны доор харагдана.' },
  { key: 'footer_contact_email', label: 'Холбоо барих имэйл',          placeholder: 'info.mommyoffice@gmail.com', hint: 'Footer болон Contact хуудасны имэйл.' },
  { key: 'footer_facebook_url',  label: 'Facebook URL',                placeholder: 'https://www.facebook.com/MommyofficeMN' },
  { key: 'footer_instagram_url', label: 'Instagram URL',               placeholder: 'https://www.instagram.com/mommyoffice_mo/' },
  { key: 'footer_youtube_url',   label: 'YouTube URL',                 placeholder: 'https://www.youtube.com/@mommyoffice', hint: 'Хоосон үлдээвэл харагдахгүй.' },
  { key: 'footer_tiktok_url',    label: 'TikTok URL',                  placeholder: 'https://www.tiktok.com/@mommyoffice',  hint: 'Хоосон үлдээвэл харагдахгүй.' },
];

const DEFAULT_PLATFORM = [
  { label: 'Хичээлүүд',    href: '/courses'  },
  { label: 'Нийтлэлүүд',   href: '/articles' },
  { label: 'Видео & Кино', href: '/videos'   },
  { label: 'Дэлгүүр',      href: '/shop'     },
];
const DEFAULT_COMPANY = [
  { label: 'Бидний тухай',              href: '/about'             },
  { label: 'Холбоо барих',             href: '/contact'           },
  { label: 'Багш болох',               href: '/become-instructor' },
  { label: 'Сурталчилгаа байршуулах', href: '/advertise'         },
  { label: 'Нууцлалын бодлого',        href: '/privacy'           },
  { label: 'Үйлчилгээний нөхцөл',     href: '/terms'             },
];

function parseLinks(raw: string | undefined, fallback: NavLink[]): NavLink[] {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as NavLink[]; } catch { return fallback; }
}

export default function FooterSettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'mn';

  const [social, setSocial]     = useState<Record<string, string>>({});
  const [platform, setPlatform] = useState<NavLink[]>(DEFAULT_PLATFORM);
  const [company, setCompany]   = useState<NavLink[]>(DEFAULT_COMPANY);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setSocial({
        footer_tagline:       s.footer_tagline       ?? '',
        footer_contact_email: s.footer_contact_email ?? '',
        footer_facebook_url:  s.footer_facebook_url  ?? '',
        footer_instagram_url: s.footer_instagram_url ?? '',
        footer_youtube_url:   s.footer_youtube_url   ?? '',
        footer_tiktok_url:    s.footer_tiktok_url    ?? '',
      });
      setPlatform(parseLinks(s.footer_links_platform, DEFAULT_PLATFORM));
      setCompany(parseLinks(s.footer_links_company,   DEFAULT_COMPANY));
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    // Save social fields
    for (const { key } of SOCIAL_FIELDS) {
      await updateSiteSetting(key, social[key] ?? '');
    }
    // Save nav columns as JSON
    await updateSiteSetting('footer_links_platform', JSON.stringify(platform));
    await updateSiteSetting('footer_links_company',  JSON.stringify(company));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div style={{ padding: '3rem', color: '#555' }}>Уншиж байна...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '780px' }}>

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
        Footer-ийн холбоосууд, нийгмийн сүлжээ болон холбоо барих мэдээллийг энд засна уу.
      </p>

      {/* ── NAV COLUMNS ─────────────────────────────────── */}
      <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#e5e5e5', marginBottom: '1rem' }}>
        🔗 Footer цэсний холбоосууд
      </h2>

      <LinkColumnEditor
        title="Платформ баганын холбоосууд"
        links={platform}
        onChange={setPlatform}
      />

      <LinkColumnEditor
        title="Компани баганын холбоосууд"
        links={company}
        onChange={setCompany}
      />

      {/* ── SOCIAL + CONTACT ────────────────────────────── */}
      <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#e5e5e5', marginBottom: '1rem', marginTop: '0.5rem' }}>
        🌐 Нийгмийн сүлжээ & Холбоо
      </h2>

      {SOCIAL_FIELDS.map(({ key, label, placeholder, hint }) => (
        <div key={key} style={fieldStyle}>
          <label style={labelStyle}>{label}</label>
          <input
            type={key.includes('email') ? 'email' : 'text'}
            value={social[key] ?? ''}
            onChange={(e) => setSocial((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ ...inputStyle, width: '100%' }}
          />
          {hint && <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{hint}</p>}
        </div>
      ))}

      {/* ── PREVIEW ─────────────────────────────────────── */}
      <div style={{
        background: '#0a0a0a', border: '1px solid #1e1e1e',
        borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Урьдчилан харах
        </p>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#3a3a3a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Платформ</p>
            {platform.map((l) => (
              <p key={l.href} style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{l.label} → <span style={{ color: '#3a3a3a' }}>{l.href}</span></p>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#3a3a3a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Компани</p>
            {company.map((l) => (
              <p key={l.href} style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{l.label} → <span style={{ color: '#3a3a3a' }}>{l.href}</span></p>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#3a3a3a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Нийгмийн сүлжээ</p>
            {social.footer_contact_email && (
              <p style={{ fontSize: '12px', color: '#00B5AD', margin: '2px 0' }}>{social.footer_contact_email}</p>
            )}
            {social.footer_facebook_url  && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Facebook ✓</p>}
            {social.footer_instagram_url && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Instagram ✓</p>}
            {social.footer_youtube_url   && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>YouTube ✓</p>}
            {social.footer_tiktok_url    && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>TikTok ✓</p>}
          </div>
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
        Хадгалсны дараа footer шинэчлэгдэнэ.
      </p>

    </div>
  );
}
