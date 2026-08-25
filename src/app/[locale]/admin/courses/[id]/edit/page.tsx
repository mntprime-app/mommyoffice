'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];

type OutlineModule = { title: string; lessons: string[] };

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    about_course_mn: '', about_course_en: '',
    price: '0', original_price: '0',
    category: 'Хоол', slug: '',
    cover_image_url: '', trailer_url: '',
    cloudflare_stream_id: '',
    access_duration_days: '0',
    is_published: false, show_outline: true,
  });

  // Outline stored as array of modules
  const [outline, setOutline] = useState<OutlineModule[]>([
    { title: '', lessons: [''] },
  ]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mo_courses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Хичээл олдсонгүй'); setLoading(false); return; }
        setForm({
          title_mn: data.title_mn || '',
          title_en: data.title_en || '',
          description_mn: data.description_mn || '',
          description_en: data.description_en || '',
          about_course_mn: data.about_course_mn || '',
          about_course_en: data.about_course_en || '',
          price: String(data.price ?? 0),
          original_price: String(data.original_price ?? 0),
          category: data.category || 'Хоол',
          slug: data.slug || '',
          cover_image_url: data.cover_image_url || '',
          trailer_url: data.trailer_url || '',
          cloudflare_stream_id: data.cloudflare_stream_id || '',
          access_duration_days: String(data.access_duration_days ?? 0),
          is_published: Boolean(data.is_published),
          show_outline: data.show_outline !== false,
        });
        if (Array.isArray(data.outline) && data.outline.length > 0) {
          setOutline(data.outline);
        }
        setLoading(false);
      });
  }, [id]);

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Outline helpers
  function addModule() {
    setOutline((o) => [...o, { title: '', lessons: [''] }]);
  }
  function removeModule(mi: number) {
    setOutline((o) => o.filter((_, i) => i !== mi));
  }
  function setModuleTitle(mi: number, val: string) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, title: val } : m));
  }
  function addLesson(mi: number) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, ''] } : m));
  }
  function removeLesson(mi: number, li: number) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m));
  }
  function setLesson(mi: number, li: number, val: string) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? val : l) } : m));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const cleanOutline = outline
      .filter((m) => m.title.trim())
      .map((m) => ({ title: m.title.trim(), lessons: m.lessons.filter((l) => l.trim()) }));
    const supabase = createClient();
    const { error: err } = await supabase
      .from('mo_courses')
      .update({
        ...form,
        price: Number(form.price),
        original_price: Number(form.original_price),
        access_duration_days: Number(form.access_duration_days),
        outline: cleanOutline.length > 0 ? cleanOutline : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Амжилттай хадгаллаа ✓');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${form.title_mn}" хичээлийг устгах уу? Энэ үйлдлийг буцааж болохгүй.`)) return;
    const supabase = createClient();
    await supabase.from('mo_courses').delete().eq('id', id);
    router.push(`/${locale}/admin/courses`);
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Ачааллаж байна...</div>;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <a href={`/${locale}/admin`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Admin</a>
            {' / '}
            <a href={`/${locale}/admin/courses`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>Хичээлүүд</a>
            {' / Засах'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{form.title_mn || 'Хичээл засах'}</h1>
        </div>
        <button onClick={handleDelete} style={{
          background: '#fee2e2', color: '#991b1b',
          padding: '8px 16px', borderRadius: '8px',
          fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px'
        }}>
          Устгах
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Basic info ── */}
        <Section title="Үндсэн мэдээлэл">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Нэр (МН) *" required>
              <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inp} />
            </Field>
            <Field label="Нэр (EN)">
              <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} />
            </Field>
          </div>
          <Field label="Slug (URL)">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inp} placeholder="cooking-masterclass" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Ангилал">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Үнэ (₮)" hint="Борлуулах үнэ">
              <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inp} min="0" />
            </Field>
            <Field label="Эх үнэ (₮)" hint="Хөнгөлөлтийн өмнөх үнэ (заавал биш)">
              <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} style={inp} min="0" />
            </Field>
          </div>
          <Field label="Хандалтын хугацаа (өдөр)" hint="0 = насан туршийн хандалт">
            <input type="number" value={form.access_duration_days} onChange={(e) => set('access_duration_days', e.target.value)} style={{ ...inp, maxWidth: '160px' }} min="0" />
          </Field>
        </Section>

        {/* ── Media ── */}
        <Section title="Медиа">
          <Field label="Cover Image URL">
            <input value={form.cover_image_url} onChange={(e) => set('cover_image_url', e.target.value)} style={inp} placeholder="https://..." />
          </Field>
          {form.cover_image_url && (
            <img src={form.cover_image_url} alt="cover" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginTop: '4px' }} />
          )}
          <Field label="YouTube Trailer ID" hint="Зөвхөн ID хэсгийг буулгана уу — жишээ нь: dQw4w9WgXcQ">
            <input value={form.trailer_url} onChange={(e) => set('trailer_url', e.target.value)} style={inp} placeholder="dQw4w9WgXcQ" />
          </Field>
          <Field label="Cloudflare Stream Video ID" hint="CF Stream dashboard → Video ID. Signed playback token автоматаар үүснэ.">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={form.cloudflare_stream_id}
                onChange={(e) => set('cloudflare_stream_id', e.target.value)}
                style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                placeholder="a8765f2b3c4d..."
              />
              {form.cloudflare_stream_id && (
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Тохируулагдсан</span>
              )}
            </div>
          </Field>
        </Section>

        {/* ── Descriptions ── */}
        <Section title="Тайлбар">
          <Field label="Богино тайлбар (МН)" hint="Хайлтад харагдах">
            <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)} style={{ ...inp, height: '90px', resize: 'vertical' }} />
          </Field>
          <Field label="Богино тайлбар (EN)">
            <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)} style={{ ...inp, height: '70px', resize: 'vertical' }} />
          </Field>
          <Field label="Сургалтын тухай (МН)" hint='Курсийн онцлогийг эмоджитойгоор бичнэ үү — "What&apos;s inside?" хэсэг'>
            <textarea value={form.about_course_mn} onChange={(e) => set('about_course_mn', e.target.value)} style={{ ...inp, height: '160px', resize: 'vertical', lineHeight: 1.7 }} />
          </Field>
          <Field label="Сургалтын тухай (EN)">
            <textarea value={form.about_course_en} onChange={(e) => set('about_course_en', e.target.value)} style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }} />
          </Field>
        </Section>

        {/* ── Outline / Curriculum ── */}
        <Section title="Хичээлийн агуулга (Curriculum)">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)} style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Хичээлийн агуулгыг сурагчдад харуулах</span>
          </label>

          {outline.map((mod, mi) => (
            <div key={mi} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', minWidth: '24px' }}>{mi + 1}.</span>
                <input
                  value={mod.title}
                  onChange={(e) => setModuleTitle(mi, e.target.value)}
                  placeholder={`Модуль ${mi + 1} — жишээ нь: Үндсэн ойлголт`}
                  style={{ ...inp, flex: 1, fontSize: '13px', fontWeight: 600 }}
                />
                {outline.length > 1 && (
                  <button type="button" onClick={() => removeModule(mi)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                )}
              </div>
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mod.lessons.map((lesson, li) => (
                  <div key={li} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '18px' }}>{li + 1}.</span>
                    <input
                      value={lesson}
                      onChange={(e) => setLesson(mi, li, e.target.value)}
                      placeholder={`Хичээл ${li + 1}`}
                      style={{ ...inp, flex: 1, fontSize: '13px', padding: '7px 12px' }}
                    />
                    {mod.lessons.length > 1 && (
                      <button type="button" onClick={() => removeLesson(mi, li)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addLesson(mi)} style={{
                  background: 'none', border: '1px dashed #d1d5db', color: '#6b7280',
                  borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                  fontSize: '12px', marginTop: '4px', textAlign: 'left'
                }}>
                  + Хичээл нэмэх
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addModule} style={{
            background: 'var(--teal-light)', color: 'var(--teal)',
            border: '1px solid rgba(0,181,173,0.3)', borderRadius: '8px',
            padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
          }}>
            + Модуль нэмэх
          </button>
        </Section>

        {/* ── Publish ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: form.is_published ? '#f0fdf4' : '#fefce8', borderRadius: '10px', border: `1px solid ${form.is_published ? '#86efac' : '#fde68a'}` }}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} style={{ accentColor: '#00B5AD', width: '16px', height: '16px' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {form.is_published ? '✓ Нийтлэгдсэн — сурагчдад харагдаж байна' : '○ Ноорог — сурагчдад харагдахгүй'}
          </label>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '13px', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px' }}>{error}</p>}
        {success && <p style={{ color: '#065f46', fontSize: '13px', background: '#d1fae5', padding: '10px 14px', borderRadius: '8px' }}>{success}</p>}

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#9ca3af' : 'var(--teal)', color: '#fff',
            padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <a href={`/${locale}/admin/courses`} style={{
            background: '#f3f4f6', color: 'var(--foreground)',
            padding: '12px 24px', borderRadius: '10px', fontWeight: 600,
            textDecoration: 'none', fontSize: '15px', display: 'inline-flex', alignItems: 'center'
          }}>
            Буцах
          </a>
          <a href={`/${locale}/courses/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{
            background: 'none', color: 'var(--teal)',
            padding: '12px 16px', borderRadius: '10px', fontWeight: 600,
            textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', marginLeft: 'auto'
          }}>
            Хуудас харах ↗
          </a>
        </div>
      </form>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: hint ? '0.15rem' : '0.35rem' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {hint && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 0.35rem' }}>{hint}</p>}
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: '8px',
  border: '1px solid var(--border)', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
  fontFamily: 'inherit',
};
