'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSetting } from '@/app/actions/admin';

const FONT_SIZES = ['14', '15', '16', '17', '18', '19', '20'];
const TEXT_ALIGNS = [
  { value: 'left',    label: 'Зүүн (Left)' },
  { value: 'justify', label: 'Тэгш (Justify)' },
];

export default function SettingsPage() {
  const [fontSize, setFontSize]   = useState('16');
  const [textAlign, setTextAlign] = useState('justify');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setFontSize(s.article_font_size || '16');
      setTextAlign(s.article_text_align || 'justify');
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await updateSiteSetting('article_font_size', fontSize);
    await updateSiteSetting('article_text_align', textAlign);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const previewStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    textAlign: textAlign as 'left' | 'justify',
    lineHeight: 1.85,
    color: '#c8c8c8',
    background: '#111',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    marginTop: '12px',
  };

  if (loading) {
    return <div style={{ padding: '3rem', color: '#555' }}>Уншиж байна...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e5e5e5', marginBottom: '0.25rem' }}>
        Тохиргоо
      </h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '2.5rem' }}>
        Нийтлэлийн хуудасны дизайн тохиргоо
      </p>

      {/* ── FONT SIZE ── */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#aaa', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Үсгийн хэмжээ — {fontSize}px
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FONT_SIZES.map((s) => (
            <button key={s} onClick={() => setFontSize(s)} style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '13px',
              background: fontSize === s ? '#00B5AD' : '#1a1a1a',
              color: fontSize === s ? '#fff' : '#888',
              outline: fontSize === s ? '2px solid #00B5AD' : '2px solid #2a2a2a',
            }}>{s}px</button>
          ))}
        </div>
      </div>

      {/* ── TEXT ALIGN ── */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#aaa', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Текст зэрэгцүүлэлт
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TEXT_ALIGNS.map((a) => (
            <button key={a.value} onClick={() => setTextAlign(a.value)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '13px',
              background: textAlign === a.value ? '#00B5AD' : '#1a1a1a',
              color: textAlign === a.value ? '#fff' : '#888',
              outline: textAlign === a.value ? '2px solid #00B5AD' : '2px solid #2a2a2a',
            }}>{a.label}</button>
          ))}
        </div>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#aaa', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Урьдчилан харах
        </label>
        <p style={previewStyle}>
          Технологийн ертөнцөд өөрийн үүсгэн байгуулсан компаниасаа хөөгдөж, олон нийтийн сүлжээгээр асар их дарамт үзэн ядалтад өртсөн боловч дэлхийн хамгийн залуу тэрбумтан болж чадсан гэвэл та итгэх үү? Энэ бол жинхэнэ амжилтын түүх.
        </p>
      </div>

      {/* ── SAVE ── */}
      <button onClick={handleSave} disabled={saving} style={{
        padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: saving ? 'default' : 'pointer',
        background: saved ? '#10b981' : '#00B5AD', color: '#fff',
        fontWeight: 800, fontSize: '14px',
        opacity: saving ? 0.7 : 1,
        transition: 'background 0.2s',
      }}>
        {saving ? 'Хадгалж байна...' : saved ? '✓ Хадгалагдлаа!' : 'Хадгалах'}
      </button>

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#444' }}>
        Хадгалсны дараа шинэ нийтлэлийн хуудасны дуудалт хийхэд өөрчлөлт харагдана.
      </p>
    </div>
  );
}
