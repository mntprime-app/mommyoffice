'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { compressImage, fmtSize } from '@/lib/imageCompress';
import { createCourse, uploadImage, getInstructors } from '@/app/actions/admin';
import { CoverImageSection } from '@/components/ui/CoverImagePicker';
import VideoTUSUploader from '@/components/ui/VideoTUSUploader';

const CATEGORIES = ['Хоол', 'Гоо сайхан', 'Эрүүл мэнд', 'Бизнес', 'Гэр бүл', 'Хувийн хөгжил', 'Дизайн'];
const LEVELS = ['', 'Анхан шат', 'Дунд шат', 'Ахисан шат'];
const PLACEMENTS = [
  { value: 'home_featured', label: '🏠 Нүүр — Онцлох', desc: 'Нүүр хуудасны featured мөр' },
  { value: 'standard', label: '📚 Стандарт каталог', desc: 'Зөвхөн /mn/courses' },
];

type OutlineLesson = {
  title: string;
  stream_id?: string;
  video_status?: 'none' | 'pending' | 'approved';
  file_name?: string;
  file_size?: number;
};

function fmtBytes(b: number): string {
  if (!b) return '';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
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

  // Per-lesson inline error messages (keyed by "mi-li")
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  function setLessonError(mi: number, li: number, msg: string) {
    setLessonErrors((prev) => ({ ...prev, [`${mi}-${li}`]: msg }));
    setTimeout(() => setLessonErrors((prev) => {
      const next = { ...prev };
      delete next[`${mi}-${li}`];
      return next;
    }), 8000);
  }

  // Delete CF Stream video (no DB update — course not saved yet)
  async function deleteStream(mi: number, li: number, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    const streamId = outline[mi]?.lessons[li]?.stream_id;
    if (!streamId) return;
    try {
      await fetch('/api/admin/delete-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId }),
      });
    } catch { /* best-effort — stream cleanup, not critical */ }
    setOutline((o) => o.map((m, i) => i !== mi ? m : ({
      ...m,
      lessons: m.lessons.map((l, j) => j !== li ? l : ({
        ...l, stream_id: '', video_status: 'none' as const,
      })),
    })));
  }

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    about_course_mn: '', about_course_en: '',
    what_you_learn_mn: '', what_you_learn_en: '',
    requirements_mn: '', requirements_en: '',
    price: '0', original_price: '0',
    category: 'Хоол', level_mn: '',
    cover_image_url: '', trailer_url: '',
    cloudflare_stream_id: '',
    access_duration_days: '0',
    duration_minutes: '0',
    lecture_count: '0', download_count: '0', exercise_count: '0',
    has_certificate: false, is_bestseller: false,
    slug: '', is_published: false, show_outline: true,
    placement: 'standard', mo_instructor_id: '',
  });

  const emptyLesson = (): OutlineLesson => ({ title: '', stream_id: '', video_status: 'none', file_name: '', file_size: 0 });
  const [outline, setOutline] = useState<OutlineModule[]>([
    { title: '', lessons: [emptyLesson()] },
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
  const addModule = () => setOutline((o) => [...o, { title: '', lessons: [emptyLesson()] }]);
  const removeModule = (mi: number) => setOutline((o) => o.filter((_, i) => i !== mi));
  const setModuleTitle = (mi: number, val: string) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, title: val } : m));
  const addLesson = (mi: number) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, emptyLesson()] } : m));
  const removeLesson = (mi: number, li: number) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m));
  const setLessonField = (mi: number, li: number, field: keyof OutlineLesson, val: string | number) =>
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, [field]: val } : l) } : m));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setImgPreview(URL.createObjectURL(raw));
    setError('');
    try {
      const file = await compressImage(raw, { preset: 'course' });
      setError(`✓ WebP: ${fmtSize(raw.size)} → ${fmtSize(file.size)}`);
      setTimeout(() => setError(''), 3000);
      const fd = new FormData();
      fd.append('file', file);
      const { error: upErr, url } = await uploadImage(fd, 'courses');
      if (upErr || !url) { setError(`Upload алдаа: ${upErr}`); return; }
      setForm((f) => ({ ...f, cover_image_url: url }));
      setImgPreview(url);
    } catch { setError('Upload алдаа.'); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    // Always include lessons with stream_id even if title is blank (avoid orphaned videos)
    const cleanOutline = outline
      .filter((m) => m.title.trim() || m.lessons.some((l) => l.stream_id?.trim()))
      .map((m) => ({
        title: m.title.trim(),
        lessons: m.lessons
          .filter((l) => l.title.trim() || l.stream_id?.trim())
          .map((l) => {
            const lesson: OutlineLesson = { title: l.title.trim() };
            if (l.stream_id?.trim()) lesson.stream_id = l.stream_id.trim();
            if (l.video_status && l.video_status !== 'none') lesson.video_status = l.video_status;
            if (l.file_name?.trim()) lesson.file_name = l.file_name.trim();
            if (l.file_size) lesson.file_size = l.file_size;
            return lesson;
          }),
      }));
    const { error: err } = await createCourse({
      title_mn: form.title_mn, title_en: form.title_en || null,
      description_mn: form.description_mn || null, description_en: form.description_en || null,
      about_course_mn: form.about_course_mn || null, about_course_en: form.about_course_en || null,
      what_you_learn_mn: form.what_you_learn_mn || null, what_you_learn_en: form.what_you_learn_en || null,
      requirements_mn: form.requirements_mn || null, requirements_en: form.requirements_en || null,
      price: Number(form.price), original_price: Number(form.original_price) || null,
      access_duration_days: Number(form.access_duration_days) || 0,
      duration_minutes: Number(form.duration_minutes) || null,
      lecture_count: Number(form.lecture_count) || null,
      download_count: Number(form.download_count) || null,
      exercise_count: Number(form.exercise_count) || null,
      has_certificate: form.has_certificate, is_bestseller: form.is_bestseller,
      category: form.category, level_mn: form.level_mn || null,
      cover_image_url: form.cover_image_url || null,
      trailer_url: form.trailer_url || null,
      cloudflare_stream_id: form.cloudflare_stream_id || null,
      slug: form.slug, is_published: form.is_published,
      show_outline: form.show_outline, placement: form.placement,
      course_outline_mn: cleanOutline.length > 0 ? cleanOutline : null,
      mo_instructor_id: form.mo_instructor_id || null,
    });
    if (err) { setError(err); setSaving(false); }
    else router.push(`/${locale}/admin/courses`);
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.4rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
          {' / '}
          <Link href={`/${locale}/admin/courses`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Хичээлүүд</Link>
          {' / Шинэ'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Шинэ хичээл нэмэх</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* 2-column layout */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* ═══ LEFT — Core Content (70%) ═══ */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Title + Slug */}
            <Card title="Нэр ба URL">
              <div style={grid2}>
                <Field label={`Нэр (МН) * — ${form.title_mn.length} тэмдэгт ${form.title_mn.length > 60 ? '⚠️ mobile-д хайчлагдана' : ''}`} required>
                  <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={{ ...inp, borderColor: form.title_mn.length > 60 ? 'rgba(251,146,60,0.6)' : undefined }} placeholder="Гэрийн хоол хийх урлаг" />
                </Field>
                <Field label="Нэр (EN)">
                  <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} placeholder="Home Cooking Masterclass" />
                </Field>
              </div>
              <Field label="Slug (URL) *" hint="Латин үсэг, зөвхөн тире ашиглана — жишээ нь: home-cooking-mn">
                <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required style={{ ...inp, fontFamily: 'monospace' }} placeholder="home-cooking-mn" />
              </Field>
            </Card>

            {/* Category + Level + Badges */}
            <Card title="Ангилал ба Түвшин">
              <div style={grid3}>
                <Field label="Ангилал">
                  <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Түвшин">
                  <select value={form.level_mn} onChange={(e) => set('level_mn', e.target.value)} style={inp}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l || '— Сонгох —'}</option>)}
                  </select>
                </Field>
                <Field label="Бэйжүүд">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                    <Toggle checked={form.is_bestseller} onChange={(v) => set('is_bestseller', v)} label="🏆 Bestseller" color="#f59e0b" />
                    <Toggle checked={form.has_certificate} onChange={(v) => set('has_certificate', v)} label="🎓 Гэрчилгээ" color="#10b981" />
                  </div>
                </Field>
              </div>
            </Card>

            {/* Descriptions */}
            <Card title="Тайлбар">
              <div style={grid2}>
                <Field label="Богино тайлбар (МН)">
                  <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical' }} placeholder="Хичээлийн товч агуулга... (хайлтад харагдана)" />
                </Field>
                <Field label="Богино тайлбар (EN)">
                  <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical' }} />
                </Field>
              </div>
            </Card>

            {/* About */}
            <Card title="Сургалтын тухай" hint="Онцлогийг эмоджитойгоор — «What&apos;s inside?» хэсэг">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.about_course_mn} onChange={(e) => set('about_course_mn', e.target.value)}
                    style={{ ...inp, height: '150px', resize: 'vertical', lineHeight: 1.7 }}
                    placeholder={'🍳 25+ практик жор\n⏱ 2 цагт долоо хоногийн хоол\n🎓 15 жилийн туршлага'} />
                </Field>
                <Field label="EN">
                  <textarea value={form.about_course_en} onChange={(e) => set('about_course_en', e.target.value)}
                    style={{ ...inp, height: '150px', resize: 'vertical', lineHeight: 1.7 }} placeholder="Optional English version..." />
                </Field>
              </div>
            </Card>

            {/* What You'll Learn */}
            <Card title="Юу сурах вэ?" hint="Мөр бүрд нэг зүйл — жагсаалт болж харагдана">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.what_you_learn_mn} onChange={(e) => set('what_you_learn_mn', e.target.value)}
                    style={{ ...inp, height: '130px', resize: 'vertical', lineHeight: 1.7 }}
                    placeholder={'Хоол хийх үндсэн техникүүд\nЦаг хэмнэх арга барил\nОлон улсын жорууд'} />
                </Field>
                <Field label="EN">
                  <textarea value={form.what_you_learn_en} onChange={(e) => set('what_you_learn_en', e.target.value)}
                    style={{ ...inp, height: '130px', resize: 'vertical', lineHeight: 1.7 }}
                    placeholder={'Core cooking techniques\nTime-saving meal prep\nInternational recipes'} />
                </Field>
              </div>
            </Card>

            {/* Requirements */}
            <Card title="Шаардлага" hint="Мөр бүрд нэг шаардлага">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.requirements_mn} onChange={(e) => set('requirements_mn', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }}
                    placeholder={'Хоол хийх ур чадварын шаардлагагүй\nЛаваш, тогоо байхад хангалттай'} />
                </Field>
                <Field label="EN">
                  <textarea value={form.requirements_en} onChange={(e) => set('requirements_en', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }}
                    placeholder={'No prior cooking experience\nBasic kitchen tools required'} />
                </Field>
              </div>
            </Card>

            {/* Course Stats */}
            <Card title="Хичээлийн тоо баримт">
              <div style={grid4}>
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
            </Card>

            {/* Instructor */}
            <Card title="Багш">
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
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  ⚠️ Багш олдсонгүй — эхлээд <Link href={`/${locale}/admin/instructors`} style={{ color: '#00B5AD' }}>Багш нэмэх</Link>
                </p>
              )}
            </Card>

            {/* Curriculum */}
            <Card title="Хичээлийн агуулга (Curriculum)">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)}
                  style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>Хичээлийн агуулгыг сурагчдад харуулах</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {outline.map((mod, mi) => (
                  <div key={mi} style={{ border: '1px solid #333', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* Module header */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', background: '#222' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', minWidth: '22px' }}>{mi + 1}.</span>
                      <input value={mod.title} onChange={(e) => setModuleTitle(mi, e.target.value)}
                        placeholder={`Модуль ${mi + 1} — гарчиг`}
                        style={{ ...inp, flex: 1, fontSize: '13px', fontWeight: 600, padding: '8px 12px' }} />
                      {outline.length > 1 && (
                        <button type="button" onClick={() => removeModule(mi)}
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      )}
                    </div>
                    {/* Lessons */}
                    <div style={{ padding: '10px 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#1a1a1a' }}>
                      {mod.lessons.map((lesson, li) => (
                        <div key={li} style={{ border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 10px', background: '#222' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '16px' }}>{li + 1}.</span>
                            <input value={lesson.title} onChange={(e) => setLessonField(mi, li, 'title', e.target.value)}
                              placeholder={`Хичээл ${li + 1} — гарчиг`}
                              style={{ ...inp, flex: 1, fontSize: '13px', padding: '6px 10px' }} />
                            {mod.lessons.length > 1 && (
                              <button type="button" onClick={() => removeLesson(mi, li)}
                                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: '0 4px' }}>✕</button>
                            )}
                          </div>
                          {/* ── Video management row ── */}
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2a2a2a' }}>

                            {/* Inline per-lesson error */}
                            {lessonErrors[`${mi}-${li}`] && (
                              <div style={{
                                marginBottom: '8px', padding: '8px 12px', borderRadius: '6px',
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                                fontSize: '11px', color: '#fbbf24', lineHeight: 1.5,
                              }}>
                                {lessonErrors[`${mi}-${li}`]}
                              </div>
                            )}

                            {/* STATE A: No video → TUS uploader */}
                            {!lesson.stream_id && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>🎬 Видео: — Байхгүй</span>
                                <VideoTUSUploader
                                  onUploaded={(streamId, fileName, fileSize) => {
                                    setOutline((o) => o.map((m, i) => i !== mi ? m : ({
                                      ...m,
                                      lessons: m.lessons.map((l, j) => j !== li ? l : ({
                                        ...l,
                                        stream_id: streamId,
                                        video_status: 'approved' as const,
                                        file_name: fileName,
                                        file_size: fileSize,
                                      })),
                                    })));
                                  }}
                                  onError={(msg) => setLessonError(mi, li, msg)}
                                />
                              </div>
                            )}

                            {/* STATE C: Video uploaded → green card (auto-approved, instant publish) */}
                            {lesson.stream_id && (
                              <div style={{
                                border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: '8px',
                                background: 'rgba(16,185,129,0.05)',
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                                      ✓ Бэлэн — хадгалсны дараа харагдана
                                    </span>
                                    <a
                                      href={`https://iframe.cloudflarestream.com/${lesson.stream_id}?controls=true&preload=metadata`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                                        background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                                        border: '1px solid rgba(59,130,246,0.25)', textDecoration: 'none', whiteSpace: 'nowrap',
                                      }}
                                    >
                                      👁️ Үзэх
                                    </a>
                                  </div>
                                  {lesson.file_name && (
                                    <span style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      🎬 {lesson.file_name}{lesson.file_size ? ` • ${fmtBytes(lesson.file_size)}` : ''}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => deleteStream(mi, li, 'Видеог устгаж шинээр оруулах уу?')}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                      background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                                      border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    🔄 Видео солих
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteStream(mi, li, 'Видеог CF Stream-аас устгах уу? Буцаах боломжгүй.')}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                      background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                      border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    🗑️ Устгах
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addLesson(mi)}
                        style={{ background: 'none', border: '1px dashed #333', color: '#6b7280', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', textAlign: 'left' }}>
                        + Хичээл нэмэх
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addModule}
                style={{ marginTop: '10px', background: 'rgba(0,181,173,0.1)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.25)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                + Модуль нэмэх
              </button>
            </Card>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2a2a' }}>
              <button type="submit" disabled={saving} style={{
                background: saving ? '#374151' : '#00B5AD', color: '#fff',
                padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
              }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
              <button type="button" onClick={() => router.back()} style={{
                background: '#2a2a2a', color: '#9ca3af', padding: '12px 24px', borderRadius: '10px',
                fontWeight: 600, border: '1px solid #333', cursor: 'pointer', fontSize: '15px'
              }}>
                Буцах
              </button>
            </div>
          </div>

          {/* ═══ RIGHT — Sticky Sidebar (30%) ═══ */}
          <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '2rem', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Publish Status */}
            <SideCard title="Нийтлэх тохиргоо">
              <button type="button" onClick={() => set('is_published', !form.is_published)} style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer',
                background: form.is_published ? 'rgba(16,185,129,0.15)' : '#2a2a2a',
                color: form.is_published ? '#6ee7b7' : '#9ca3af',
                border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#333'}`,
              } as React.CSSProperties}>
                {form.is_published ? '✓ Нийтлэгдсэн' : '○ Ноорог'}
              </button>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '6px 0 0', textAlign: 'center' }}>
                {form.is_published ? 'Сурагчдад харагдаж байна' : 'Сурагчдад харагдахгүй'}
              </p>
            </SideCard>

            {/* Placement */}
            <SideCard title="Байршил">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PLACEMENTS.map((p) => (
                  <label key={p.value} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer',
                    padding: '8px 10px', borderRadius: '7px',
                    background: form.placement === p.value ? 'rgba(0,181,173,0.1)' : 'transparent',
                    border: `1px solid ${form.placement === p.value ? 'rgba(0,181,173,0.35)' : '#2a2a2a'}`,
                  }}>
                    <input type="radio" name="placement" value={p.value} checked={form.placement === p.value}
                      onChange={(e) => set('placement', e.target.value)} style={{ accentColor: '#00B5AD', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </SideCard>

            {/* Pricing */}
            <SideCard title="Үнэ">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>Борлуулах үнэ (₮)</label>
                  <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} style={inp} min="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.25rem' }}>Эх үнэ <span style={{ fontWeight: 400, color: '#6b7280' }}>(үнийн зураас)</span></label>
                  <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} style={inp} min="0" />
                </div>
              </div>
              <Field label="Хандалтын хугацаа (өдөр)" hint="0 = насан туршийн">
                <input type="number" value={form.access_duration_days} onChange={(e) => set('access_duration_days', e.target.value)} style={inp} min="0" />
              </Field>
            </SideCard>


            {/* Video */}
            <SideCard title="Видео">
              <Field label="YouTube Trailer ID" hint="Зөвхөн ID: dQw4w9WgXcQ">
                <input value={form.trailer_url} onChange={(e) => set('trailer_url', e.target.value)}
                  style={{ ...inp, fontFamily: 'monospace', fontSize: '12px' }} placeholder="dQw4w9WgXcQ" />
              </Field>
              <Field label="Cloudflare Stream ID">
                <input value={form.cloudflare_stream_id} onChange={(e) => set('cloudflare_stream_id', e.target.value)}
                  style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', color: form.cloudflare_stream_id ? '#10b981' : '#e5e5e5' }}
                  placeholder="a8765f2b3c4d..." />
              </Field>
            </SideCard>
          </div>
        </div>

        {/* Cover image upload + live preview */}
        <CoverImageSection
          value={form.cover_image_url}
          onChange={(url) => { set('cover_image_url', url); setImgPreview(url); }}
          title={form.title_mn || 'Гарчиг энд харагдана'}
          badge="Сургалт"
        />
      </form>
    </div>
  );
}

/* ── Shared sub-components ── */
function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #2a2a2a', borderRadius: '12px', background: '#1a1a1a', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #2a2a2a', background: '#1e1e1e' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af' }}>{title}</span>
        {hint && <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>{hint}</span>}
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #2a2a2a', borderRadius: '12px', background: '#1a1a1a', overflow: 'hidden' }}>
      <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #2a2a2a', background: '#1e1e1e' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {hint && <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 0.3rem' }}>{hint}</p>}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, color }: { checked: boolean; onChange: (v: boolean) => void; label: string; color: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ width: '14px', height: '14px', accentColor: color }} />
      <span style={{ fontSize: '13px', color: checked ? '#e5e5e5' : '#6b7280' }}>{label}</span>
    </label>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '7px',
  border: '1px solid #333', fontSize: '13px', boxSizing: 'border-box',
  outline: 'none', background: '#2a2a2a', color: '#e5e5e5', fontFamily: 'inherit',
};
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' };
const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' };
