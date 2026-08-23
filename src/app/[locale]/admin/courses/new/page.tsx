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
    about_course_mn: '', about_course_en: '',
    price: '0', category: 'Хоол',
    cover_image_url: '', trailer_url: '',
    slug: '', is_published: false,
    show_outline: true,
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
      show_outline: form.show_outline,
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

        <Field label="Тайлбар (МН)" hint="Хайлтад харагдах богино тайлбар">
          <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} placeholder="Хичээлийн дэлгэрэнгүй тайлбар..." />
        </Field>

        <Field label="Тайлбар (EN)">
          <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
        </Field>

        {/* About course — free-form creative section (like Skool "What's inside?") */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '0.25rem' }}>
            Сургалтын тухай (чөлөөт хэлбэр)
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '0.75rem' }}>
            Сурагчдад зориулж хичээлийнхээ онцлог, агуулгыг өөрийн үгээр бичнэ үү — зурмал эмоджи ч болно. Skool платформын "What&apos;s inside?" хэсгийн нэгэн адил.
          </div>
          <Field label="МН хэлбэрээр бичих">
            <textarea
              value={form.about_course_mn}
              onChange={(e) => set('about_course_mn', e.target.value)}
              style={{ ...inputStyle, height: '180px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
              placeholder={`Жишээ нь:\n\n🍳 25+ практик жор — гэртээ хоол хийх итгэлийг олно\n⏱ Цагийн менежмент — долоо хоног бүрийн хоолоо 2 цагт бэлдэх\n🎓 Б.Нарантуяа — 15 жилийн туршлагатай тогооч\n✅ Гэрчилгээ авна — ажлын байранд нэмж дурдах боломжтой`}
            />
          </Field>
          <Field label="EN хэлбэрээр бичих (заавал биш)">
            <textarea
              value={form.about_course_en}
              onChange={(e) => set('about_course_en', e.target.value)}
              style={{ ...inputStyle, height: '120px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
              placeholder="Optional English version of the about section..."
            />
          </Field>
        </div>

        {/* show_outline toggle */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)} style={{ marginTop: '2px', accentColor: '#00B5AD', width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Хичээлийн агуулга харуулах</span>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              Идэвхгүй болговол "Хичээлийн агуулга" хэсэг сурагчдад харагдахгүй болно
            </div>
          </div>
        </label>

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

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: hint ? '0.15rem' : '0.4rem' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {hint && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 0.4rem' }}>{hint}</p>}
      {children}
    </div>
  );
}
