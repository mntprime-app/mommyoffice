'use client';
import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['Эрүүл мэнд', 'Гоо сайхан', 'Хоол тэжээл', 'Гэр бүл', 'Бизнес', 'Хувийн хөгжил'];

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
    author_name: '',
    slug: '',
    is_published: false,
  });

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80);
  }

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'title_mn') {
      setForm((f) => ({ ...f, [key]: String(val), slug: slugify(String(val)) }));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `articles/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('mommyoffice-public')
        .upload(path, file, { upsert: true });

      if (upErr) {
        // Storage not configured yet — keep the local preview, ask to use a URL
        setError('Зураг хадгалах storage тохиргоо хийгдээгүй байна. Cover Image URL талбарт зургийн линкийг оруулна уу.');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('mommyoffice-public')
        .getPublicUrl(path);

      setForm((f) => ({ ...f, cover_image_url: publicUrl }));
      setPreview(publicUrl);
    } catch {
      setError('Зураг upload хийхэд алдаа гарлаа.');
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_mn) { setError('Монгол нэр заавал бөглөнө үү.'); return; }
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.from('mo_articles').insert({
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
    });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push(`/${locale}/admin/articles`);
    }
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Admin</Link>
          {' / '}
          <Link href={`/${locale}/admin/articles`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Нийтлэлүүд</Link>
          {' / Шинэ'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Шинэ нийтлэл нэмэх</h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Cover image upload */}
        <div>
          <label style={labelStyle}>Нүүр зураг</label>
          <div
            onClick={() => imgInputRef.current?.click()}
            style={{
              border: `2px dashed ${preview ? 'var(--teal)' : 'var(--border)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              minHeight: '180px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: preview ? 'transparent' : 'var(--surface)',
              position: 'relative',
            }}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
                <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                  {uploading ? 'Зураг хадгалж байна...' : 'Зураг оруулахын тулд дарна уу'}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>JPG, PNG, WEBP — дурын хэмжээ</p>
              </div>
            )}
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {preview && (
            <button
              type="button"
              onClick={() => { setPreview(''); setForm((f) => ({ ...f, cover_image_url: '' })); }}
              style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Зураг арилгах
            </button>
          )}
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
            Эсвэл URL-аар оруулах:
          </p>
          <input
            value={form.cover_image_url}
            onChange={(e) => { set('cover_image_url', e.target.value); setPreview(e.target.value); }}
            style={{ ...inputStyle, marginTop: '4px' }}
            placeholder="https://..."
          />
        </div>

        {/* Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Гарчиг (МН) *">
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inputStyle} placeholder="Өглөөний эрүүл дэглэм" />
          </Field>
          <Field label="Гарчиг (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inputStyle} placeholder="Morning Wellness Routine" />
          </Field>
        </div>

        {/* Slug + Category + Author */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inputStyle} placeholder="morning-wellness" />
          </Field>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Зохиолч">
            <input value={form.author_name} onChange={(e) => set('author_name', e.target.value)} style={inputStyle} placeholder="Нэр" />
          </Field>
        </div>

        {/* Excerpt */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Товч тайлбар (МН)">
            <textarea value={form.excerpt_mn} onChange={(e) => set('excerpt_mn', e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Нийтлэлийн товч агуулга..." />
          </Field>
          <Field label="Товч тайлбар (EN)">
            <textarea value={form.excerpt_en} onChange={(e) => set('excerpt_en', e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
          </Field>
        </div>

        {/* Body */}
        <Field label="Нийтлэлийн агуулга (МН) — HTML дэмждэг">
          <textarea
            value={form.body_mn}
            onChange={(e) => set('body_mn', e.target.value)}
            style={{ ...inputStyle, height: '220px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
            placeholder={'<p>Эхний хэсэг...</p>\n<h2>Дэд гарчиг</h2>\n<p>Дараагийн хэсэг...</p>'}
          />
        </Field>

        <Field label="Нийтлэлийн агуулга (EN) — HTML">
          <textarea
            value={form.body_en}
            onChange={(e) => set('body_en', e.target.value)}
            style={{ ...inputStyle, height: '180px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
            placeholder="<p>First paragraph...</p>"
          />
        </Field>

        {/* Publish toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '12px 16px', background: 'var(--surface)', borderRadius: '10px' }}>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--teal)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Шууд нийтлэх</span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>(тэмдэглэхгүй бол ноорог болно)</span>
        </label>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              background: (saving || uploading) ? '#9ca3af' : 'var(--teal)',
              color: '#fff', padding: '12px 28px', borderRadius: '10px',
              fontWeight: 700, border: 'none', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: '15px'
            }}
          >
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: '#f3f4f6', color: 'var(--foreground)',
              padding: '12px 24px', borderRadius: '10px',
              fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '15px'
            }}
          >
            Буцах
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid var(--border)', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
  fontFamily: 'Arial, sans-serif',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '0.4rem',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
