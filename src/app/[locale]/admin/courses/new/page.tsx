'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { compressImage, fmtSize } from '@/lib/imageCompress';

const CATEGORIES = ['Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];

const MAX_IMG_MB = 2;

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgPreview, setImgPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    about_course_mn: '', about_course_en: '',
    price: '0', original_price: '0',
    category: 'Хоол',
    cover_image_url: '', trailer_url: '',
    cloudflare_stream_id: '',
    access_duration_days: '0',
    slug: '', is_published: false,
    show_outline: true,
  });

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 60);
  }

  function set(key: string, val: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'title_mn' && !f.slug) next.slug = slugify(String(val));
      return next;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setImgPreview(URL.createObjectURL(raw));
    setError('');
    try {
      const file = await compressImage(raw, { preset: 'course' });
      setError(`✓ WebP шахагдсан: ${fmtSize(raw.size)} → ${fmtSize(file.size)}`);
      setTimeout(() => setError(''), 4000);
      setImgPreview(URL.createObjectURL(file));
      const supabase = createClient();
      const path = `courses/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from('mommyoffice-public').upload(path, file, { upsert: true, contentType: 'image/webp' });
      if (upErr) { setError('Storage тохиргоо хийгдээгүй байна. URL-аар оруулна уу.'); return; }
      const { data: { publicUrl } } = supabase.storage.from('mommyoffice-public').getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: publicUrl }));
      setImgPreview(publicUrl);
    } catch { setError('Зураг upload хийхэд алдаа гарлаа.'); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.from('mo_courses').insert({
      title_mn: form.title_mn,
      title_en: form.title_en || null,
      description_mn: form.description_mn || null,
      description_en: form.description_en || null,
      about_course_mn: form.about_course_mn || null,
      about_course_en: form.about_course_en || null,
      price: Number(form.price),
      original_price: Number(form.original_price) || null,
      access_duration_days: Number(form.access_duration_days) || 0,
      category: form.category,
      cover_image_url: form.cover_image_url || null,
      trailer_url: form.trailer_url || null,
      cloudflare_stream_id: form.cloudflare_stream_id || null,
      slug: form.slug,
      is_published: form.is_published,
      show_outline: form.show_outline,
    });
    if (err) { setError(err.message); setSaving(false); }
    else router.push(`/${locale}/admin/courses`);
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.25rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
          {' / '}
          <Link href={`/${locale}/admin/courses`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Хичээлүүд</Link>
          {' / Шинэ'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Шинэ хичээл нэмэх</h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Titles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Нэр (МН) *" required>
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inp} placeholder="Хоол хийх урлаг" />
          </Field>
          <Field label="Нэр (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} placeholder="Cooking Masterclass" />
          </Field>
        </div>

        <Field label="Slug (URL) *" required>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required style={inp} placeholder="cooking-masterclass" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
            </select>
          </Field>
          <Field label="Үнэ (₮)">
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inp} min="0" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Эх үнэ (₮)" hint="Хөнгөлөлтийн өмнөх үнэ — strike-through болж харагдана (заавал биш)">
            <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} style={inp} min="0" />
          </Field>
          <Field label="Хандалтын хугацаа (өдөр)" hint="0 = насан туршийн хандалт">
            <input type="number" value={form.access_duration_days} onChange={(e) => set('access_duration_days', e.target.value)} style={inp} min="0" />
          </Field>
        </div>

        {/* Cover image */}
        <div>
          <label style={lbl}>Cover Image</label>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px' }}>
            💡 Зөвлөмж хэмжээ: 1280×720px (HD Video Poster, 16:9, макс {MAX_IMG_MB}MB)
          </p>
          {imgPreview && (
            <img src={imgPreview} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{
              background: '#2a2a2a', border: '1px solid #333', color: '#e5e5e5',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
            }}>
              📁 Зураг сонгох
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <input
              value={form.cover_image_url}
              onChange={(e) => { set('cover_image_url', e.target.value); setImgPreview(e.target.value); }}
              style={{ ...inp, flex: 1, minWidth: '180px' }}
              placeholder="https://... (URL-аар оруулах)"
            />
          </div>
        </div>

        {/* Descriptions */}
        <Field label="Тайлбар (МН)" hint="Хайлтад харагдах богино тайлбар">
          <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)}
            style={{ ...inp, height: '90px', resize: 'vertical' }} placeholder="Хичээлийн товч агуулга..." />
        </Field>
        <Field label="Тайлбар (EN)">
          <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)}
            style={{ ...inp, height: '70px', resize: 'vertical' }} />
        </Field>

        {/* About (What's inside) */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.25rem' }}>
            Сургалтын тухай (чөлөөт хэлбэр)
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.75rem' }}>
            Сурагчдад зориулж хичээлийнхээ онцлог, агуулгыг өөрийн үгээр бичнэ үү — эмоджитойгоор.
          </div>
          <Field label="МН">
            <textarea value={form.about_course_mn} onChange={(e) => set('about_course_mn', e.target.value)}
              style={{ ...inp, height: '160px', resize: 'vertical', lineHeight: 1.7 }}
              placeholder={`🍳 25+ практик жор\n⏱ Долоо хоног бүрийн хоолоо 2 цагт бэлдэх\n🎓 15 жилийн туршлагатай тогооч`} />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <Field label="EN (заавал биш)">
              <textarea value={form.about_course_en} onChange={(e) => set('about_course_en', e.target.value)}
                style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }} placeholder="Optional English version..." />
            </Field>
          </div>
        </div>

        {/* Media */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="YouTube Trailer ID" hint="Зөвхөн ID — жишээ нь: dQw4w9WgXcQ">
            <input value={form.trailer_url} onChange={(e) => set('trailer_url', e.target.value)} style={inp} placeholder="dQw4w9WgXcQ" />
          </Field>
          <Field label="Cloudflare Stream Video ID">
            <input value={form.cloudflare_stream_id} onChange={(e) => set('cloudflare_stream_id', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace', fontSize: '13px' }} placeholder="a8765f2b3c4d..." />
          </Field>
        </div>

        {/* Toggles */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer',
          padding: '0.75rem 1rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a'
        }}>
          <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)}
            style={{ marginTop: '2px', accentColor: '#00B5AD', width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>Хичээлийн агуулга харуулах</span>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Идэвхгүй болговол curriculum хэсэг сурагчдад харагдахгүй
            </div>
          </div>
        </label>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '12px 16px',
          background: form.is_published ? 'rgba(16,185,129,0.1)' : '#1a1a1a', borderRadius: '10px',
          border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`,
        }}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#00B5AD' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
            {form.is_published ? '✓ Шууд нийтлэх — сурагчдад харагдана' : '○ Ноорог болгох'}
          </label>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2a2a' }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#374151' : '#00B5AD', color: '#fff',
            padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
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
function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {hint && <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 0.4rem' }}>{hint}</p>}
      {children}
    </div>
  );
}
