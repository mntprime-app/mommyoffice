'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { compressImage, fmtSize } from '@/lib/imageCompress';
import { createCourse, uploadImage, getInstructors } from '@/app/actions/admin';

const CATEGORIES = ['Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];
const LEVELS = ['', 'Анхан шат', 'Дунд шат', 'Ахисан шат'];
const COURSE_PLACEMENTS = [
  { value: 'home_featured', label: '🏠 Нүүр хуудас — Онцлох', desc: '/mn нүүрийн "Онцлох сургалт" мөрт харагдана' },
  { value: 'standard', label: '📚 Стандарт каталог', desc: 'Зөвхөн /mn/courses-д харагдана' },
];

const MAX_IMG_MB = 2;

type OutlineLesson = { title: string; stream_id?: string };
type OutlineModule = { title: string; lessons: OutlineLesson[] };
type Instructor = { id: string; name_mn: string; name_en: string | null; title_mn: string | null };

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgPreview, setImgPreview] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    about_course_mn: '', about_course_en: '',
    what_you_learn_mn: '', what_you_learn_en: '',
    requirements_mn: '', requirements_en: '',
    price: '0', original_price: '0',
    category: 'Хоол',
    level_mn: '',
    cover_image_url: '', trailer_url: '',
    cloudflare_stream_id: '',
    access_duration_days: '0',
    duration_minutes: '0',
    lecture_count: '0',
    download_count: '0',
    exercise_count: '0',
    has_certificate: false,
    is_bestseller: false,
    slug: '', is_published: false,
    show_outline: true,
    placement: 'standard',
    mo_instructor_id: '',
  });

  const [outline, setOutline] = useState<OutlineModule[]>([
    { title: '', lessons: [{ title: '', stream_id: '' }] },
  ]);

  useEffect(() => {
    getInstructors().then((list) => setInstructors(list as Instructor[]));
  }, []);

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

  // Outline helpers
  function addModule() {
    setOutline((o) => [...o, { title: '', lessons: [{ title: '', stream_id: '' }] }]);
  }
  function removeModule(mi: number) {
    setOutline((o) => o.filter((_, i) => i !== mi));
  }
  function setModuleTitle(mi: number, val: string) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, title: val } : m));
  }
  function addLesson(mi: number) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, { title: '', stream_id: '' }] } : m));
  }
  function removeLesson(mi: number, li: number) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m));
  }
  function setLessonTitle(mi: number, li: number, val: string) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, title: val } : l) } : m));
  }
  function setLessonStreamId(mi: number, li: number, val: string) {
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, stream_id: val } : l) } : m));
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
      const fd = new FormData();
      fd.append('file', file);
      const { error: upErr, url } = await uploadImage(fd, 'courses');
      if (upErr || !url) { setError(`Upload алдаа: ${upErr ?? 'URL хоосон'}`); return; }
      setForm((f) => ({ ...f, cover_image_url: url }));
      setImgPreview(url);
    } catch { setError('Зураг upload хийхэд алдаа гарлаа.'); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const cleanOutline = outline
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title.trim(),
        lessons: m.lessons
          .filter((l) => l.title.trim())
          .map((l) => ({ title: l.title.trim(), stream_id: l.stream_id?.trim() || undefined })),
      }));
    const { error: err } = await createCourse({
      title_mn: form.title_mn,
      title_en: form.title_en || null,
      description_mn: form.description_mn || null,
      description_en: form.description_en || null,
      about_course_mn: form.about_course_mn || null,
      about_course_en: form.about_course_en || null,
      what_you_learn_mn: form.what_you_learn_mn || null,
      what_you_learn_en: form.what_you_learn_en || null,
      requirements_mn: form.requirements_mn || null,
      requirements_en: form.requirements_en || null,
      price: Number(form.price),
      original_price: Number(form.original_price) || null,
      access_duration_days: Number(form.access_duration_days) || 0,
      duration_minutes: Number(form.duration_minutes) || null,
      lecture_count: Number(form.lecture_count) || null,
      download_count: Number(form.download_count) || null,
      exercise_count: Number(form.exercise_count) || null,
      has_certificate: form.has_certificate,
      is_bestseller: form.is_bestseller,
      category: form.category,
      level_mn: form.level_mn || null,
      cover_image_url: form.cover_image_url || null,
      trailer_url: form.trailer_url || null,
      cloudflare_stream_id: form.cloudflare_stream_id || null,
      slug: form.slug,
      is_published: form.is_published,
      show_outline: form.show_outline,
      placement: form.placement,
      course_outline_mn: cleanOutline.length > 0 ? cleanOutline : null,
      mo_instructor_id: form.mo_instructor_id || null,
    });
    if (err) { setError(err); setSaving(false); }
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

        {/* ── Titles ── */}
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

        {/* ── Category / Level / Bestseller ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Ангилал">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
            </select>
          </Field>
          <Field label="Түвшин" hint="Бэйж болж харагдана">
            <select value={form.level_mn} onChange={(e) => set('level_mn', e.target.value)} style={inp}>
              {LEVELS.map((l) => <option key={l} value={l}>{l || '— Сонгох —'}</option>)}
            </select>
          </Field>
          <Field label="Bestseller">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_bestseller} onChange={(e) => set('is_bestseller', e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#f59e0b' }} />
              <span style={{ fontSize: '13px', color: '#e5e5e5' }}>🏆 Bestseller</span>
            </label>
          </Field>
        </div>

        {/* ── Pricing ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Field label="Үнэ (₮)">
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inp} min="0" />
          </Field>
          <Field label="Эх үнэ (₮)" hint="Strike-through үнэ (заавал биш)">
            <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} style={inp} min="0" />
          </Field>
          <Field label="Хандалтын хугацаа (өдөр)" hint="0 = насан туршийн">
            <input type="number" value={form.access_duration_days} onChange={(e) => set('access_duration_days', e.target.value)} style={inp} min="0" />
          </Field>
        </div>

        {/* ── Course Stats ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.75rem' }}>Хичээлийн тоо баримт</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <Field label="Нийт минут">
              <input type="number" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} style={inp} min="0" />
            </Field>
            <Field label="Хичээлийн тоо">
              <input type="number" value={form.lecture_count} onChange={(e) => set('lecture_count', e.target.value)} style={inp} min="0" />
            </Field>
            <Field label="Татаж авах">
              <input type="number" value={form.download_count} onChange={(e) => set('download_count', e.target.value)} style={inp} min="0" />
            </Field>
            <Field label="Дасгалын тоо">
              <input type="number" value={form.exercise_count} onChange={(e) => set('exercise_count', e.target.value)} style={inp} min="0" />
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '10px 14px', background: form.has_certificate ? 'rgba(16,185,129,0.1)' : '#222', borderRadius: '8px', border: `1px solid ${form.has_certificate ? 'rgba(16,185,129,0.3)' : '#333'}` }}>
            <input type="checkbox" checked={form.has_certificate} onChange={(e) => set('has_certificate', e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: '#10b981' }} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>🎓 Гэрчилгээ олгоно</span>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Хичээл дуусгасан сурагчдад гэрчилгээ өгнө</div>
            </div>
          </label>
        </div>

        {/* ── Instructor ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.75rem' }}>Багш</div>
          <Field label="Багш сонгох">
            <select value={form.mo_instructor_id} onChange={(e) => set('mo_instructor_id', e.target.value)} style={inp}>
              <option value="">— Багш сонгоогүй —</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name_mn}{inst.title_mn ? ` — ${inst.title_mn}` : ''}
                </option>
              ))}
            </select>
          </Field>
          {!instructors.length && (
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0.5rem 0 0' }}>
              ⚠️ Багш олдсонгүй — эхлээд <Link href={`/${locale}/admin/instructors`} style={{ color: '#00B5AD' }}>Багш нэмэх</Link> хэсэгт багш үүсгэнэ үү.
            </p>
          )}
        </div>

        {/* ── Cover image ── */}
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

        {/* ── Descriptions ── */}
        <Field label="Тайлбар (МН)" hint="Хайлтад харагдах богино тайлбар">
          <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)}
            style={{ ...inp, height: '90px', resize: 'vertical' }} placeholder="Хичээлийн товч агуулга..." />
        </Field>
        <Field label="Тайлбар (EN)">
          <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)}
            style={{ ...inp, height: '70px', resize: 'vertical' }} />
        </Field>

        {/* ── About ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.25rem' }}>Сургалтын тухай</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.75rem' }}>Онцлогийг эмоджитойгоор бичнэ үү</div>
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

        {/* ── What you'll learn ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.25rem' }}>Юу сурах вэ?</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.75rem' }}>Мөр бүрд нэг зүйл — жагсаалт болж харагдана</div>
          <Field label="МН">
            <textarea value={form.what_you_learn_mn} onChange={(e) => set('what_you_learn_mn', e.target.value)}
              style={{ ...inp, height: '140px', resize: 'vertical', lineHeight: 1.7 }}
              placeholder={`Хоол хийх үндсэн техникүүд\nЦаг хэмнэх арга барил\nОлон улсын жорууд`} />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <Field label="EN (заавал биш)">
              <textarea value={form.what_you_learn_en} onChange={(e) => set('what_you_learn_en', e.target.value)}
                style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }}
                placeholder={`Core cooking techniques\nTime-saving meal prep\nInternational recipes`} />
            </Field>
          </div>
        </div>

        {/* ── Requirements ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.25rem' }}>Шаардлага</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.75rem' }}>Мөр бүрд нэг шаардлага</div>
          <Field label="МН">
            <textarea value={form.requirements_mn} onChange={(e) => set('requirements_mn', e.target.value)}
              style={{ ...inp, height: '110px', resize: 'vertical', lineHeight: 1.7 }}
              placeholder={`Хоол хийх ур чадварын шаардлагагүй\nЛаваш, тогоо байхад хангалттай`} />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <Field label="EN (заавал биш)">
              <textarea value={form.requirements_en} onChange={(e) => set('requirements_en', e.target.value)}
                style={{ ...inp, height: '80px', resize: 'vertical', lineHeight: 1.7 }}
                placeholder={`No prior cooking experience needed\nBasic kitchen tools required`} />
            </Field>
          </div>
        </div>

        {/* ── Media ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="YouTube Trailer ID" hint="Зөвхөн ID — жишээ нь: dQw4w9WgXcQ">
            <input value={form.trailer_url} onChange={(e) => set('trailer_url', e.target.value)} style={inp} placeholder="dQw4w9WgXcQ" />
          </Field>
          <Field label="Cloudflare Stream Video ID">
            <input value={form.cloudflare_stream_id} onChange={(e) => set('cloudflare_stream_id', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace', fontSize: '13px' }} placeholder="a8765f2b3c4d..." />
          </Field>
        </div>

        {/* ── Curriculum ── */}
        <div style={{ border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', background: '#1a1a1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '0.25rem' }}>Хичээлийн агуулга (Curriculum)</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)} style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Хичээлийн агуулгыг сурагчдад харуулах</span>
          </label>

          {outline.map((mod, mi) => (
            <div key={mi} style={{ border: '1px solid #333', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', background: '#222' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', minWidth: '24px' }}>{mi + 1}.</span>
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
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mod.lessons.map((lesson, li) => (
                  <div key={li} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '18px' }}>{li + 1}.</span>
                      <input
                        value={lesson.title}
                        onChange={(e) => setLessonTitle(mi, li, e.target.value)}
                        placeholder={`Хичээл ${li + 1} — гарчиг`}
                        style={{ ...inp, flex: 1, fontSize: '13px', padding: '7px 12px' }}
                      />
                      {mod.lessons.length > 1 && (
                        <button type="button" onClick={() => removeLesson(mi, li)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>✕</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '24px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>🎬 CF ID:</span>
                      <input
                        value={lesson.stream_id || ''}
                        onChange={(e) => setLessonStreamId(mi, li, e.target.value)}
                        placeholder="a8765f2b... (Cloudflare Stream ID)"
                        style={{ ...inp, flex: 1, fontSize: '12px', padding: '5px 10px', fontFamily: 'monospace', color: lesson.stream_id ? '#10b981' : '#6b7280' }}
                      />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addLesson(mi)} style={{
                  background: 'none', border: '1px dashed #444', color: '#9ca3af',
                  borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                  fontSize: '12px', marginTop: '4px', textAlign: 'left'
                }}>
                  + Хичээл нэмэх
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addModule} style={{
            background: 'rgba(0,181,173,0.15)', color: '#00B5AD',
            border: '1px solid rgba(0,181,173,0.3)', borderRadius: '8px',
            padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
          }}>
            + Модуль нэмэх
          </button>
        </div>

        {/* ── Placement zone ── */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.75rem' }}>
            📍 Хаана харагдах вэ? (Placement Zone)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {COURSE_PLACEMENTS.map((p) => (
              <label key={p.value} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer',
                padding: '10px 14px', borderRadius: '8px',
                background: form.placement === p.value ? 'rgba(0,181,173,0.1)' : 'transparent',
                border: `1px solid ${form.placement === p.value ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
              }}>
                <input type="radio" name="course_placement" value={p.value}
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
        </div>

        {/* ── Toggles ── */}
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
