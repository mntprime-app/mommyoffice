'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createVideo } from '@/app/actions/admin';
import VideoUploader from '@/components/ui/VideoUploader';
import CoverImagePicker from '@/components/ui/CoverImagePicker';

const CATEGORIES = [
  'Амжилтын эзэд',
  'Бизнес & Санхүү',
  'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл',
  'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

// Extract YouTube ID from full URL or raw ID
function extractYouTubeId(input: string): string {
  const clean = input.trim();
  // Already a raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  // youtu.be/ID
  const short = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=ID or /embed/ID or /v/ID
  const long = clean.match(/(?:v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return clean; // fallback: return as-is
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80);
}

export default function NewVideoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ytPreview, setYtPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '',
    title_en: '',
    slug: '',
    description_mn: '',
    description_en: '',
    youtube_url: '',          // raw input — extracted on save
    youtube_id: '',           // resolved ID
    cloudflare_stream_id: '',
    thumbnail_url: '',
    duration_text: '',
    category: 'Амжилтын эзэд',
    video_type: 'free',       // 'free' | 'paid'
    is_published: false,
    is_featured: false,
    placement: 'normal',      // 'hero' | 'trending' | 'normal'
  });

  function set(key: string, val: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'title_mn') next.slug = slugify(String(val));
      // Auto-extract YouTube ID when URL field changes
      if (key === 'youtube_url') {
        const id = extractYouTubeId(String(val));
        next.youtube_id = id;
        if (id.length === 11) setYtPreview(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
        else setYtPreview('');
      }
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_mn) { setError('Монгол нэр заавал бөглөнө үү.'); return; }
    if (form.video_type === 'free' && !form.youtube_id) { setError('YouTube URL эсвэл Video ID оруулна уу.'); return; }
    if (form.video_type === 'paid' && !form.cloudflare_stream_id) { setError('CF Stream ID оруулна уу.'); return; }

    setSaving(true); setError('');

    const { error: err } = await createVideo({
      title_mn:             form.title_mn,
      title_en:             form.title_en || null,
      slug:                 form.slug || slugify(form.title_mn),
      description_mn:       form.description_mn || null,
      description_en:       form.description_en || null,
      youtube_id:           form.video_type === 'free' ? form.youtube_id : null,
      cloudflare_stream_id: form.video_type === 'paid' ? form.cloudflare_stream_id : null,
      thumbnail_url:        form.thumbnail_url || null,
      duration_text:        form.duration_text || '0 мин',
      category:             form.category,
      video_type:           form.video_type,
      is_published:         form.is_published,
      is_featured:          form.is_featured,
      placement:            form.placement,
    });

    if (err) { setError(err); setSaving(false); return; }
    router.push(`/${locale}/admin/videos`);
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
          {' / '}
          <Link href={`/${locale}/admin/videos`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Видеонууд</Link>
          {' / Шинэ'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>🎬 Шинэ видео нэмэх</h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Video type selector */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
          <label style={lbl}>📡 Видео эх үүсвэр</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {[
              { val: 'free', icon: '🔓', title: 'YouTube (Үнэгүй)', desc: 'Modestbranding + rel=0 тохиргоотойгоор site-д шигтгэнэ' },
              { val: 'paid', icon: '🔐', title: 'CF Stream (Paid)', desc: 'Signed JWT — домайн хязгаарлалттай, татаж авах боломжгүй' },
            ].map((t) => (
              <label key={t.val} style={{
                flex: 1, display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                background: form.video_type === t.val ? 'rgba(0,181,173,0.1)' : 'transparent',
                border: `1px solid ${form.video_type === t.val ? 'rgba(0,181,173,0.4)' : '#333'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="video_type" value={t.val} checked={form.video_type === t.val} onChange={(e) => set('video_type', e.target.value)} style={{ accentColor: '#00B5AD' }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e5e5' }}>{t.icon} {t.title}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '20px' }}>{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* YouTube source */}
        {form.video_type === 'free' && (
          <Field label="YouTube URL эсвэл Video ID *">
            <input
              value={form.youtube_url}
              onChange={(e) => set('youtube_url', e.target.value)}
              style={inp}
              placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ  эсвэл  dQw4w9WgXcQ"
            />
            {form.youtube_id && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>
                ✓ Video ID: <code style={{ color: '#00B5AD' }}>{form.youtube_id}</code>
              </div>
            )}
            {ytPreview && (
              <div style={{ marginTop: '10px' }}>
                <img src={ytPreview} alt="YouTube thumbnail preview" style={{ borderRadius: '6px', maxHeight: '120px', border: '1px solid #333' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>💡 Thumbnail автоматаар YouTube-аас авна. Өөрчлөх бол доор URL оруулна уу.</p>
              </div>
            )}
          </Field>
        )}

        {/* CF Stream source — VideoUploader (white-labeled) */}
        {form.video_type === 'paid' && (
          <div>
            <VideoUploader
              title={form.title_mn || 'MommyOffice Video'}
              onSuccess={(uid) => {
                set('cloudflare_stream_id', uid);
              }}
              onError={(msg) => setError(msg)}
            />
            {form.cloudflare_stream_id && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>
                ✓ Видео байршуулагдлаа · CF UID: <code style={{ color: '#00B5AD', fontSize: '11px' }}>{form.cloudflare_stream_id}</code>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Гарчиг (МН) *">
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inp} placeholder="Бизнес эхлүүлэх 5 алхам" />
          </Field>
          <Field label="Гарчиг (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} placeholder="5 Steps to Start a Business" />
          </Field>
        </div>

        {/* Slug + Category + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inp} placeholder="biznes-ehleh-5-alkham" />
          </Field>
          <Field label="Ангилал *">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Үргэлжлэх хугацаа">
            <input value={form.duration_text} onChange={(e) => set('duration_text', e.target.value)} style={inp} placeholder="45 мин" />
          </Field>
        </div>

        {/* Cover Image Picker */}
        <div style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'1.25rem' }}>
          <CoverImagePicker
            value={form.thumbnail_url}
            onChange={(url) => set('thumbnail_url', url)}
          />
        </div>

        {/* Descriptions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Тайлбар (МН)">
            <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)} style={{ ...inp, height: '90px', resize: 'vertical' }} placeholder="Видеоны товч агуулга..." />
          </Field>
          <Field label="Тайлбар (EN)">
            <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)} style={{ ...inp, height: '90px', resize: 'vertical' }} />
          </Field>
        </div>

        {/* Placement zone */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
          <label style={{ ...lbl, display: 'block', marginBottom: '0.75rem' }}>📍 Байршил (Placement)</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { val: 'hero',     label: '🌟 Hero Banner',   desc: 'Нүүр хэсэгт том байдлаар харагдана' },
              { val: 'trending', label: '🔥 Трэндинг',      desc: 'Санал болгох эгнээнд дээр харагдана' },
              { val: 'normal',   label: '📋 Энгийн',        desc: 'Категорийн эгнээнд харагдана' },
            ].map((p) => (
              <label key={p.val} style={{
                flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                background: form.placement === p.val ? 'rgba(0,181,173,0.1)' : 'transparent',
                border: `1px solid ${form.placement === p.val ? 'rgba(0,181,173,0.4)' : '#333'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="placement" value={p.val} checked={form.placement === p.val} onChange={(e) => set('placement', e.target.value)} style={{ accentColor: '#00B5AD' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#e5e5e5' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '20px' }}>{p.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'is_published', label: '🌐 Шууд нийтлэх', desc: 'Сурагчдад харагдана', checked: form.is_published },
            { key: 'is_featured',  label: '⭐ Hero Featured',  desc: 'Нүүр хэсгийн hero болгох', checked: form.is_featured },
          ].map((t) => (
            <label key={t.key} style={{
              flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
              background: (t.checked) ? 'rgba(16,185,129,0.08)' : '#1a1a1a',
              border: `1px solid ${(t.checked) ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`,
            }}>
              <input
                type="checkbox"
                checked={t.checked}
                onChange={(e) => set(t.key, e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#00B5AD' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#374151' : '#00B5AD', color: '#fff',
            padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px',
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            background: '#2a2a2a', color: '#e5e5e5', padding: '12px 24px', borderRadius: '10px',
            fontWeight: 600, border: '1px solid #333', cursor: 'pointer', fontSize: '15px',
          }}>
            Буцах
          </button>
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #333', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', background: '#2a2a2a', color: '#e5e5e5', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.4rem',
};
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {hint && <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{hint}</p>}
      {children}
    </div>
  );
}
