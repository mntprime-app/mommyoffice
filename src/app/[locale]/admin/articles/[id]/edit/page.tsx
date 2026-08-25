'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил', 'Lifestyle'];

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
    cover_image_url: '',
    category: 'Эрүүл мэнд',
    author_name: '', slug: '',
    is_published: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mo_articles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Нийтлэл олдсонгүй'); setLoading(false); return; }
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
        };
        setForm(f);
        if (f.cover_image_url) setPreview(f.cover_image_url);
        setLoading(false);
      });
  }, [id]);

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `articles/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('mommyoffice-public').upload(path, file, { upsert: true });
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
    const supabase = createClient();
    const { error: err } = await supabase
      .from('mo_articles')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) { setError(err.message); }
    else { setSuccess('Амжилттай хадгаллаа ✓'); setTimeout(() => setSuccess(''), 3000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${form.title_mn}" нийтлэлийг устгах уу?`)) return;
    const supabase = createClient();
    await supabase.from('mo_articles').delete().eq('id', id);
    router.push(`/${locale}/admin/articles`);
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Ачааллаж байна...</div>;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Admin</Link>
            {' / '}
            <Link href={`/${locale}/admin/articles`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Нийтлэлүүд</Link>
            {' / Засах'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{form.title_mn || 'Нийтлэл засах'}</h1>
        </div>
        <button onClick={handleDelete} style={{
          background: '#fee2e2', color: '#991b1b', padding: '8px 16px',
          borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px'
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
              border: `2px dashed ${preview ? 'var(--teal)' : 'var(--border)'}`,
              borderRadius: '12px', cursor: 'pointer', overflow: 'hidden',
              minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: preview ? 'transparent' : 'var(--surface)',
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
          <input value={form.cover_image_url}
            onChange={(e) => { set('cover_image_url', e.target.value); setPreview(e.target.value); }}
            style={{ ...inp, marginTop: '6px' }} placeholder="https://... (URL-аар оруулах)" />
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
          background: form.is_published ? '#f0fdf4' : '#fefce8', borderRadius: '10px',
          border: `1px solid ${form.is_published ? '#86efac' : '#fde68a'}`,
        }}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--teal)', cursor: 'pointer' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {form.is_published ? '✓ Нийтлэгдсэн — хэрэглэгчдэд харагдаж байна' : '○ Ноорог — хэрэглэгчдэд харагдахгүй'}
          </label>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
        {success && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{success}</div>}

        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button type="submit" disabled={saving || uploading} style={{
            background: (saving || uploading) ? '#9ca3af' : 'var(--teal)', color: '#fff',
            padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <Link href={`/${locale}/admin/articles`} style={{
            background: '#f3f4f6', color: 'var(--foreground)', padding: '12px 24px',
            borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '15px',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Буцах
          </Link>
          {form.slug && (
            <a href={`/${locale}/articles/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{
              background: 'none', color: 'var(--teal)', padding: '12px 16px',
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
  border: '1px solid var(--border)', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none', background: '#fff', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
