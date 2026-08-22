'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    price: '0', category: 'Хоол',
    cover_image_url: '', trailer_url: '',
    slug: '', is_published: false,
  });

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 60);
  }

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'title_mn' && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(String(val)) }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.from('mo_courses').insert({
      ...form,
      price: Number(form.price),
    });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push(`/${locale}/admin/courses`);
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.25rem' }}>
          Admin / Хичээлүүд / Шинэ
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Шинэ хичээл нэмэх</h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Нэр (МН) *" required>
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inputStyle} placeholder="Хоол хийх урлаг" />
          </Field>
          <Field label="Нэр (EN)">
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inputStyle} placeholder="Cooking Masterclass" />
          </Field>
        </div>

        <Field label="Slug (URL) *" required>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required style={inputStyle} placeholder="cooking-masterclass" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Үнэ (₮)">
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inputStyle} min="0" />
          </Field>
        </div>

        <Field label="Тайлбар (МН)">
          <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} placeholder="Хичээлийн дэлгэрэнгүй тайлбар..." />
        </Field>

        <Field label="Тайлбар (EN)">
          <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
        </Field>

        <Field label="YouTube Trailer ID">
          <input value={form.trailer_url} onChange={(e) => set('trailer_url', e.target.value)} style={inputStyle} placeholder="dQw4w9WgXcQ" />
        </Field>

        <Field label="Cover Image URL">
          <input value={form.cover_image_url} onChange={(e) => set('cover_image_url', e.target.value)} style={inputStyle} placeholder="https://..." />
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Нийтлэх (шууд харагдана)</span>
        </label>

        {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#9ca3af' : 'var(--teal)', color: '#fff',
            padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            background: '#f3f4f6', color: 'var(--foreground)',
            padding: '12px 24px', borderRadius: '10px', fontWeight: 600,
            border: 'none', cursor: 'pointer', fontSize: '15px'
          }}>
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
  boxSizing: 'border-box', outline: 'none', background: '#fff'
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}
