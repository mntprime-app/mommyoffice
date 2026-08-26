'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { compressImage, fmtSize } from '@/lib/imageCompress';
import { getArticleById, updateArticle, deleteArticleById } from '../../actions';

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

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    excerpt_mn: '', excerpt_en: '',
    body_mn: '', body_en: '',
    cover_image_url: '', category: 'Эрүүл мэнд',
    author_name: '', slug: '',
    is_published: false,
    placement: 'normal',
    is_pinned_trending: false,
    pin_rank: '1',
  });

  useEffect(() => {
    getArticleById(id).then((data) => {
      const err = !data;
      if (err) { setError('Нийтлэл олдсонгүй'); setLoading(false); return; }
        const f = {
          title_mn: data.title_mn || '',
          title_en: data.title_en || '',
          excerpt_mn: data.excerpt_mn || '',
          excerpt_en: data.excerpt_en || '',
          body_mn: data.body_mn || '',
          body_en: data.body_en || '',
          cover_image_url: data.cover_image_url || '',
          category: data.category || 'Эрүүл мэнд',
          author_name: data.author_name || '',
          slug: data.slug || '',
          is_published: Boolean(data.is_published),
          placement: data.placement || 'normal',
          is_pinned_trending: Boolean(data.is_pinned_trending),
          pin_rank: String(data.pin_rank || 1),
        };
        setForm(f);
        if (f.cover_image_url) setPreview(f.cover_image_url);
        setLoading(false);
      });
  }, [id]);

  function set(key: string, val: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: val };
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
      const file = await compressImage(raw, { preset: 'article' });
      setSuccess(`✓ WebP шахагдсан: ${fmtSize(raw.size)} → ${fmtSize(file.size)}`);
      setTimeout(() => setSuccess(''), 4000);
      setPreview(URL.createObjectURL(file));
      const supabase = createClient();
      const path = `articles/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from('mommyoffice-public').upload(path, file, { upsert: true, contentType: 'image/webp' });
      if (upErr) { setError('Storage тохиргоо хийгдээгүй байна. URL-аар оруулна уу.'); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('mommyoffice-public').getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: publicUrl }));
      setPreview(publicUrl);
    } catch { setError('Зураг upload хийхэд алдаа гарлаа.'); }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    const { error: err } = await updateArticle(id, {
      title_mn: form.title_mn,
      title_en: form.title_en || null,
      excerpt_mn: form.excerpt_mn || null,
      excerpt_en: form.excerpt_en || null,
      body_mn: form.body_mn || null,
      body_en: form.body_en || null,
      cover_image_url: form.cover_image_url || null,
      category: form.category,
      author_name: form.author_name || null,
      slug: form.slug,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      placement: form.placement,
      is_pinned_trending: form.is_pinned_trending,
      pin_rank: form.is_pinned_trending ? Number(form.pin_rank) : null,
    });
    if (err) setError(err);
    else { setSuccess('Амжилттай хадгаллаа ✓'); setTimeout(() => setSuccess(''), 3000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${form.title_mn}" нийтлэлийг устгах уу?`)) return;
    await deleteArticleById(id);
    router.push(`/${locale}/admin/articles`);
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Ачааллаж байна...</div>;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
            {' / '}
            <Link href={`/${locale}/admin/articles`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Нийтлэлүүд</Link>
            {' / Засах'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{form.title_mn || 'Нийтлэл засах'}</h1>
        </div>
        <button onClick={handleDelete} style={{
          background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '8px 16px',
          borderRadius: '8px', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)',
          cursor: 'pointer', fontSize: '13px'
        }}>
          Устгах
        </button>
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
              minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: preview ? 'transparent' : '#1e1e1e',
            }}
          >
            {preview
              ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>{uploading ? 'Хадгалж байна...' : 'Зураг оруулахын тулд дарна уу'}</p>
                </div>
            }
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          {preview && (
            <button type="button" onClick={() => { setPreview(''); set('cover_image_url', ''); }}
              style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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

        {/* Titles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Гарчиг (МН) *">
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inp} />
          </Field>
          <Field label="Гарчиг (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} />
          </Field>
        </div>

        {/* Slug / Category / Author */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inp} />
          </Field>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Зохиолч">
            <input value={form.author_name} onChange={(e) => set('author_name', e.target.value)} style={inp} />
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

          {form.is_pinned_trending && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' }}>
              <label style={lbl}>📌 Pin дараалал (1 = хамгийн дээр)</label>
              <input type="number" min="1" max="10"
                value={form.pin_rank}
                onChange={(e) => set('pin_rank', e.target.value)}
                style={{ ...inp, width: '80px' }} />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Pinned нийтлэлүүд эхэлж харагдана. Үлдсэн slots-ийг view_count-аар автомат дүүргэнэ.
              </p>
            </div>
          )}
        </div>

        {/* Excerpts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Товч тайлбар (МН)">
            <textarea value={form.excerpt_mn} onChange={(e) => set('excerpt_mn', e.target.value)} style={{ ...inp, height: '80px', resize: 'vertical' }} />
          </Field>
          <Field label="Товч тайлбар (EN)">
            <textarea value={form.excerpt_en} onChange={(e) => set('excerpt_en', e.target.value)} style={{ ...inp, height: '80px', resize: 'vertical' }} />
          </Field>
        </div>

        {/* Body */}
        <Field label="Нийтлэлийн агуулга (МН) — HTML дэмждэг">
          <textarea value={form.body_mn} onChange={(e) => set('body_mn', e.target.value)}
            style={{ ...inp, height: '260px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} />
        </Field>
        <Field label="Нийтлэлийн агуулга (EN)">
          <textarea value={form.body_en} onChange={(e) => set('body_en', e.target.value)}
            style={{ ...inp, height: '180px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} />
        </Field>

        {/* Publish */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '12px 16px',
          background: form.is_published ? 'rgba(16,185,129,0.1)' : '#1e1e1e', borderRadius: '10px',
          border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`,
        }}>
          <input type="checkbox" id="pub" checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#00B5AD', cursor: 'pointer' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
            {form.is_published ? '✓ Нийтлэгдсэн — хэрэглэгчдэд харагдаж байна' : '○ Ноорог — хэрэглэгчдэд харагдахгүй'}
          </label>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{success}</div>}

        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #2a2a2a', paddingTop: '1rem' }}>
          <button type="submit" disabled={saving || uploading} style={{
            background: (saving || uploading) ? '#374151' : '#00B5AD', color: '#fff',
            padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <Link href={`/${locale}/admin/articles`} style={{
            background: '#2a2a2a', color: '#e5e5e5', padding: '12px 24px',
            borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '15px',
            display: 'inline-flex', alignItems: 'center', border: '1px solid #333'
          }}>
            Буцах
          </Link>
          {form.slug && (
            <a href={`/${locale}/articles/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{
              background: 'none', color: '#00B5AD', padding: '12px 16px',
              borderRadius: '10px', fontWeight: 600, textDecoration: 'none',
              fontSize: '13px', display: 'inline-flex', alignItems: 'center', marginLeft: 'auto'
            }}>
              Хуудас харах ↗
            </a>
          )}
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: '8px',
  border: '1px solid #333', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none', background: '#2a2a2a',
  color: '#e5e5e5', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.4rem',
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
