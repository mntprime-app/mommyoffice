'use client';
import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { compressImage, fmtSize } from '@/lib/imageCompress';
import { createArticle } from '../actions';
import { uploadImage } from '@/app/actions/admin';
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });

const CATEGORIES = [
  // Editorial series
  'Амжилтын эзэд', 'StartUp Women', 'Money Talk', 'Mom Hacks', 'Ээжүүдийн хобби', 'Шинэхэн ээжүүд', 'Дотно харилцаа',
  // Topic categories
  'Бизнес', 'Гэр бүл', 'Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Хувийн хөгжил',
];
const PLACEMENTS = [
  { value: 'hero', label: 'Онцлох Hero Banner', desc: 'Нүүр хуудасны дээд хэсэг' },
  { value: 'trending', label: 'Трэндинг Нийтлэл', desc: 'Баруун талын жагсаалт — Manual Pin' },
  { value: 'normal', label: 'Энгийн Нийтлэл', desc: 'Үндсэн сүлжээ' },
];

export default function NewArticlePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    excerpt_mn: '', excerpt_en: '',
    body_mn: '', body_en: '',
    cover_image_url: '',
    category: 'Эрүүл мэнд',
    author_name: '', slug: '',
    is_published: false,
    placement: 'normal',
    is_pinned_trending: false,
    pin_rank: '1',
  });

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80);
  }

  function set(key: string, val: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'title_mn') next.slug = slugify(String(val));
      if (key === 'placement') next.is_pinned_trending = val === 'trending';
      return next;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setPreview(URL.createObjectURL(raw));
    setUploading(true); setError('');
    try {
      // Compress → WebP 1280×720, target <200KB
      const file = await compressImage(raw, { preset: 'article' });
      setError(`✓ Шахагдсан: ${fmtSize(raw.size)} → ${fmtSize(file.size)} (WebP)`);
      setTimeout(() => setError(''), 4000);
      setPreview(URL.createObjectURL(file));
      const fd = new FormData();
      fd.append('file', file);
      const { error: upErr, url } = await uploadImage(fd, 'articles');
      if (upErr || !url) { setError(`Upload алдаа: ${upErr ?? 'URL хоосон'}`); setUploading(false); return; }
      setForm((f) => ({ ...f, cover_image_url: url }));
      setPreview(url);
    } catch { setError('Зураг upload хийхэд алдаа гарлаа.'); }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_mn) { setError('Монгол нэр заавал бөглөнө үү.'); return; }
    setSaving(true); setError('');
    const { error: err } = await createArticle({
      title_mn: form.title_mn,
      title_en: form.title_en || null,
      excerpt_mn: form.excerpt_mn || null,
      excerpt_en: form.excerpt_en || null,
      body_mn: form.body_mn || null,
      body_en: form.body_en || null,
      cover_image_url: form.cover_image_url || null,
      category: form.category,
      author_name: form.author_name || null,
      slug: form.slug || slugify(form.title_mn),
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      placement: form.placement,
      is_pinned_trending: form.is_pinned_trending,
      pin_rank: form.is_pinned_trending ? Number(form.pin_rank) : null,
    });
    if (err) { setError(err); setSaving(false); }
    else router.push(`/${locale}/admin/articles`);
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
          {' / '}
          <Link href={`/${locale}/admin/articles`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нийтлэлүүд</Link>
          {' / Шинэ'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Шинэ нийтлэл нэмэх</h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Cover image */}
        <div>
          <label style={lbl}>Нүүр зураг</label>
          <div
            onClick={() => imgInputRef.current?.click()}
            style={{
              border: `2px dashed ${preview ? '#00B5AD' : '#333'}`,
              borderRadius: '12px', cursor: 'pointer', overflow: 'hidden',
              minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: preview ? 'transparent' : '#1e1e1e',
            }}
          >
            {preview
              ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                    {uploading ? 'Зураг хадгалж байна...' : 'Зураг оруулахын тулд дарна уу'}
                  </p>
                </div>
            }
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          {preview && (
            <button type="button" onClick={() => { setPreview(''); setForm((f) => ({ ...f, cover_image_url: '' })); }}
              style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Зураг арилгах
            </button>
          )}
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', marginBottom: '4px' }}>
            💡 Зөвлөмж хэмжээ: 1200×630px (16:9 харьцаатай, макс 2MB)
          </p>
          <input value={form.cover_image_url}
            onChange={(e) => { set('cover_image_url', e.target.value); setPreview(e.target.value); }}
            style={inp} placeholder="https://... (URL-аар оруулах)" />
        </div>

        {/* Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label={`Гарчиг (МН) * — ${form.title_mn.length}/80`}>
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value.slice(0, 80))} required style={inp} placeholder="Өглөөний эрүүл дэглэм" maxLength={80} />
          </Field>
          <Field label="Гарчиг (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} placeholder="Morning Wellness Routine" />
          </Field>
        </div>

        {/* Slug + Category + Author */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inp} placeholder="morning-wellness" />
          </Field>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Зохиолч">
            <input value={form.author_name} onChange={(e) => set('author_name', e.target.value)} style={inp} placeholder="Нэр" />
          </Field>
        </div>

        {/* Placement zone */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
          <label style={{ ...lbl, marginBottom: '0.75rem', display: 'block' }}>
            📍 Хаана харагдах вэ? (Placement Zone)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PLACEMENTS.map((p) => (
              <label key={p.value} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer',
                padding: '10px 14px', borderRadius: '8px',
                background: form.placement === p.value ? 'rgba(0,181,173,0.1)' : 'transparent',
                border: `1px solid ${form.placement === p.value ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="placement" value={p.value}
                  checked={form.placement === p.value}
                  onChange={(e) => set('placement', e.target.value)}
                  style={{ marginTop: '2px', accentColor: '#00B5AD' }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#e5e5e5' }}>{p.label}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{p.desc}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Pin rank — shown only when trending selected */}
          {form.is_pinned_trending && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' }}>
              <label style={lbl}>📌 Pin дараалал (1 = хамгийн дээр)</label>
              <input
                type="number" min="1" max="10"
                value={form.pin_rank}
                onChange={(e) => set('pin_rank', e.target.value)}
                style={{ ...inp, width: '80px' }}
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Pinned нийтлэлүүд эхэлж харагдана. Үлдсэн slots-ийг view_count-аар автомат дүүргэнэ.
              </p>
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label={`Товч тайлбар (МН) — ${form.excerpt_mn.length}/150`}>
            <textarea value={form.excerpt_mn} onChange={(e) => set('excerpt_mn', e.target.value.slice(0, 150))} style={{ ...inp, height: '80px', resize: 'vertical' }} placeholder="Нийтлэлийн товч агуулга..." maxLength={150} />
          </Field>
          <Field label="Товч тайлбар (EN)">
            <textarea value={form.excerpt_en} onChange={(e) => set('excerpt_en', e.target.value)} style={{ ...inp, height: '80px', resize: 'vertical' }} />
          </Field>
        </div>

        {/* Body MN */}
        <div>
          <label style={lbl}>Нийтлэлийн агуулга (МН)</label>
          <RichTextEditor
            value={form.body_mn}
            onChange={(html) => set('body_mn', html)}
            placeholder="Монгол агуулга энд бичнэ..."
            folder="articles"
          />
        </div>

        {/* Body EN */}
        <div>
          <label style={lbl}>Нийтлэлийн агуулга (EN)</label>
          <RichTextEditor
            value={form.body_en}
            onChange={(html) => set('body_en', html)}
            placeholder="Write English content here..."
            folder="articles"
          />
        </div>

        {/* Publish */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
          padding: '12px 16px', background: form.is_published ? 'rgba(16,185,129,0.1)' : '#1e1e1e',
          borderRadius: '10px', border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`,
        }}>
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#00B5AD', cursor: 'pointer' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>Шууд нийтлэх</span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>(тэмдэглэхгүй бол ноорог болно)</span>
        </label>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving || uploading} style={{
            background: (saving || uploading) ? '#374151' : '#00B5AD', color: '#fff',
            padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            background: '#2a2a2a', color: '#e5e5e5', padding: '12px 24px', borderRadius: '10px',
            fontWeight: 600, border: '1px solid #333', cursor: 'pointer', fontSize: '15px'
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
