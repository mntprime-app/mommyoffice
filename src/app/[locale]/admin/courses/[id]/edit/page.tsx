'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseById, updateCourse, deleteCourseById, getInstructors, saveCourseOutlinePatch } from '@/app/actions/admin';
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
  youtube_id?: string;
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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [form, setForm] = useState({
    title_mn: '', title_en: '',
    description_mn: '', description_en: '',
    about_course_mn: '', about_course_en: '',
    what_you_learn_mn: '', what_you_learn_en: '',
    requirements_mn: '', requirements_en: '',
    price: '0', original_price: '0',
    category: 'Хоол', slug: '', level_mn: '',
    cover_image_url: '', trailer_url: '',
    cloudflare_stream_id: '',
    access_duration_days: '0',
    duration_minutes: '0',
    lecture_count: '0', download_count: '0', exercise_count: '0',
    has_certificate: false, is_bestseller: false,
    is_published: false, show_outline: true,
    placement: 'standard', mo_instructor_id: '',
  });

  const [outline, setOutline] = useState<OutlineModule[]>([
    { title: '', lessons: [{ title: '', stream_id: '' }] },
  ]);

  useEffect(() => {
    getInstructors().then((list) => setInstructors(list as Instructor[]));
    getCourseById(id).then((data) => {
      if (!data) { setError('Хичээл олдсонгүй'); setLoading(false); return; }
      setForm({
        title_mn: data.title_mn || '',
        title_en: data.title_en || '',
        description_mn: data.description_mn || '',
        description_en: data.description_en || '',
        about_course_mn: data.about_course_mn || '',
        about_course_en: data.about_course_en || '',
        what_you_learn_mn: data.what_you_learn_mn || '',
        what_you_learn_en: data.what_you_learn_en || '',
        requirements_mn: data.requirements_mn || '',
        requirements_en: data.requirements_en || '',
        price: String(data.price ?? 0),
        original_price: String(data.original_price ?? 0),
        category: data.category || 'Хоол',
        slug: data.slug || '',
        level_mn: data.level_mn || '',
        cover_image_url: data.cover_image_url || '',
        trailer_url: data.trailer_url || '',
        cloudflare_stream_id: data.cloudflare_stream_id || '',
        access_duration_days: String(data.access_duration_days ?? 0),
        duration_minutes: String(data.duration_minutes ?? 0),
        lecture_count: String(data.lecture_count ?? 0),
        download_count: String(data.download_count ?? 0),
        exercise_count: String(data.exercise_count ?? 0),
        has_certificate: Boolean(data.has_certificate),
        is_bestseller: Boolean(data.is_bestseller),
        is_published: Boolean(data.is_published),
        show_outline: data.show_outline !== false,
        placement: data.placement || 'standard',
        mo_instructor_id: data.mo_instructor_id || '',
      });
      const rawOutline = data.course_outline_mn || data.outline;
      if (Array.isArray(rawOutline) && rawOutline.length > 0) {
        const loadedOutline = rawOutline.map((m: OutlineModule) => ({
          title: m.title,
          lessons: (m.lessons || []).map((l: OutlineLesson | string) =>
            typeof l === 'string'
            ? { title: l, stream_id: '', video_status: 'none' as const }
            : {
                title: l.title || '',
                stream_id: l.stream_id || '',
                youtube_id: l.youtube_id || '',
                video_status: l.video_status || 'none' as const,
                file_name: l.file_name || '',
                file_size: l.file_size || 0,
              }
          ),
        }));
        setOutline(loadedOutline);
        setLoading(false);
        // BUG-062: backfill file_name/file_size from CF Stream for pre-BUG-061 videos
        backfillVideoMeta(loadedOutline).catch(() => {});
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Auto-save outline to DB immediately after a video upload so stream_id is persisted.
  // Preserves lessons with stream_id even if titles are blank.
  async function autoSaveOutlineWithStreamId(newOutline: OutlineModule[]) {
    try {
      const cleanOutline = newOutline
        .filter((m) => m.title.trim() || m.lessons.some((l) => l.stream_id?.trim() || l.youtube_id?.trim()))
        .map((m) => ({
          title: m.title.trim(),
          lessons: m.lessons
            .filter((l) => l.title.trim() || l.stream_id?.trim() || l.youtube_id?.trim())
            .map((l) => {
              const lesson: OutlineLesson = { title: l.title.trim() };
              if (l.stream_id?.trim()) lesson.stream_id = l.stream_id.trim();
              if (l.youtube_id?.trim()) lesson.youtube_id = l.youtube_id.trim();
              if (l.video_status && l.video_status !== 'none') lesson.video_status = l.video_status;
              if (l.file_name?.trim()) lesson.file_name = l.file_name.trim();
              if (l.file_size) lesson.file_size = l.file_size;
              return lesson;
            }),
        }));
      await saveCourseOutlinePatch(id, cleanOutline.length > 0 ? cleanOutline : null);
    } catch {
      // Non-critical — user can still save manually with 💾 Хадгалах
    }
  }

  // BUG-062: Fetch file_name/file_size from CF Stream API for any lesson that
  // has a stream_id but no metadata (uploaded before BUG-061). Runs once on
  // page load, patches state, and auto-saves results back to DB so subsequent
  // loads skip this fetch entirely.
  async function backfillVideoMeta(loadedOutline: OutlineModule[]) {
    const jobs: Array<{ mi: number; li: number; streamId: string }> = [];
    loadedOutline.forEach((mod, mi) => {
      (mod.lessons || []).forEach((lesson, li) => {
        if (lesson.stream_id?.trim() && (!lesson.file_name?.trim() || !lesson.file_size)) {
          jobs.push({ mi, li, streamId: lesson.stream_id });
        }
      });
    });
    if (jobs.length === 0) return;

    const settled = await Promise.allSettled(
      jobs.map(async ({ mi, li, streamId }) => {
        try {
          const res = await fetch(`/api/admin/cf-video-meta?streamId=${encodeURIComponent(streamId)}`);
          if (!res.ok) return null;
          const d = await res.json() as { name: string; size: number };
          return { mi, li, name: d.name || '', size: d.size || 0 };
        } catch { return null; }
      })
    );

    const patches = settled.flatMap((r) =>
      r.status === 'fulfilled' && r.value ? [r.value] : []
    );
    if (patches.length === 0) return;

    const patchedOutline = loadedOutline.map((m, mi) => ({
      ...m,
      lessons: m.lessons.map((l, li) => {
        const p = patches.find((x) => x.mi === mi && x.li === li);
        return p ? { ...l, file_name: p.name, file_size: p.size } : l;
      }),
    }));

    setOutline(patchedOutline);
    autoSaveOutlineWithStreamId(patchedOutline).catch(() => {});
  }

  // Per-lesson inline error messages (keyed by "mi-li")
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  function setLessonError(mi: number, li: number, msg: string) {
    setLessonErrors((prev) => ({ ...prev, [`${mi}-${li}`]: msg }));
    // Auto-clear after 8 seconds
    setTimeout(() => setLessonErrors((prev) => {
      const next = { ...prev };
      delete next[`${mi}-${li}`];
      return next;
    }), 8000);
  }

  // Track which lessons are currently being processed (reject/replace spinner)
  const [processingLessons, setProcessingLessons] = useState<Set<string>>(new Set());

  // Deletes CF Stream video from CF + DB, clears local state (reject / replace / delete)
  async function rejectVideo(mi: number, li: number, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    const key = `${mi}-${li}`;
    const streamId = outline[mi]?.lessons[li]?.stream_id;
    if (!streamId) return; // nothing to delete
    setProcessingLessons((prev) => new Set([...prev, key]));
    try {
      const res = await fetch('/api/admin/reject-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id, streamId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setLessonError(mi, li, json.error ?? 'Устгахад алдаа гарлаа');
        return;
      }
      setOutline((o) => o.map((m, i) => i !== mi ? m : ({
        ...m,
        lessons: m.lessons.map((l, j) => j !== li ? l : ({
          ...l, stream_id: '', video_status: 'none' as const,
        })),
      })));
    } catch (e: unknown) {
      setLessonError(mi, li, e instanceof Error ? e.message : 'Устгахад алдаа гарлаа');
    } finally {
      setProcessingLessons((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  }

  const emptyLesson = (): OutlineLesson => ({ title: '', stream_id: '', youtube_id: '', video_status: 'none', file_name: '', file_size: 0 });
  const addModule = () => setOutline((o) => [...o, { title: '', lessons: [emptyLesson()] }]);
  const removeModule = (mi: number) => setOutline((o) => o.filter((_, i) => i !== mi));
  const setModuleTitle = (mi: number, val: string) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, title: val } : m));
  const addLesson = (mi: number) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, emptyLesson()] } : m));
  const removeLesson = (mi: number, li: number) => setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m));
  const setLessonField = (mi: number, li: number, field: keyof OutlineLesson, val: string | number) =>
    setOutline((o) => o.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, [field]: val } : l) } : m));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    // Always include lessons that have a stream_id even if title is blank,
    // so that stream_id is never orphaned in client-state-only limbo.
    const cleanOutline = outline
      .filter((m) => m.title.trim() || m.lessons.some((l) => l.stream_id?.trim()))
      .map((m) => ({
        title: m.title.trim(),
        lessons: m.lessons
          .filter((l) => l.title.trim() || l.stream_id?.trim() || l.youtube_id?.trim())
          .map((l) => {
            const lesson: OutlineLesson = { title: l.title.trim() };
            if (l.stream_id?.trim()) lesson.stream_id = l.stream_id.trim();
            if (l.video_status && l.video_status !== 'none') lesson.video_status = l.video_status;
            if (l.file_name?.trim()) lesson.file_name = l.file_name.trim();
            if (l.file_size) lesson.file_size = l.file_size;
            return lesson;
          }),
      }));
    const { error: err } = await updateCourse(id, {
      title_mn: form.title_mn, title_en: form.title_en,
      description_mn: form.description_mn, description_en: form.description_en,
      about_course_mn: form.about_course_mn, about_course_en: form.about_course_en,
      what_you_learn_mn: form.what_you_learn_mn || null, what_you_learn_en: form.what_you_learn_en || null,
      requirements_mn: form.requirements_mn || null, requirements_en: form.requirements_en || null,
      price: Number(form.price), original_price: Number(form.original_price),
      access_duration_days: Number(form.access_duration_days),
      duration_minutes: Number(form.duration_minutes) || null,
      lecture_count: Number(form.lecture_count) || null,
      download_count: Number(form.download_count) || null,
      exercise_count: Number(form.exercise_count) || null,
      has_certificate: form.has_certificate, is_bestseller: form.is_bestseller,
      category: form.category, level_mn: form.level_mn || null,
      slug: form.slug, cover_image_url: form.cover_image_url,
      trailer_url: form.trailer_url, cloudflare_stream_id: form.cloudflare_stream_id,
      is_published: form.is_published, show_outline: form.show_outline,
      placement: form.placement,
      course_outline_mn: cleanOutline.length > 0 ? cleanOutline : null,
      mo_instructor_id: form.mo_instructor_id || null,
    });
    if (err) { setError(err); } else { setSuccess('Амжилттай хадгаллаа ✓'); setTimeout(() => setSuccess(''), 3000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${form.title_mn}" хичээлийг устгах уу?`)) return;
    await deleteCourseById(id);
    router.push(`/${locale}/admin/courses`);
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Ачааллаж байна...</div>;

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.4rem' }}>
            <a href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</a>
            {' / '}
            <a href={`/${locale}/admin/courses`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Хичээлүүд</a>
            {' / Засах'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>{form.title_mn || 'Хичээл засах'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={`/${locale}/courses/${form.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#00B5AD', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(0,181,173,0.25)', textDecoration: 'none', fontWeight: 600 }}>
            ↗ Хуудас харах
          </a>
          <button onClick={handleDelete} style={{
            background: 'rgba(239,68,68,0.1)', color: '#f87171',
            padding: '8px 16px', borderRadius: '8px', fontWeight: 600,
            border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', fontSize: '13px'
          }}>
            Устгах
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* ═══ LEFT — Core Content (70%) ═══ */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <Card title="Нэр ба URL">
              <div style={grid2}>
                <Field label="Нэр (МН) *" required>
                  <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} required style={inp} />
                </Field>
                <Field label="Нэр (EN)">
                  <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} />
                </Field>
              </div>
              <Field label="Slug (URL)">
                <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} />
              </Field>
            </Card>

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

            <Card title="Тайлбар">
              <div style={grid2}>
                <Field label="Богино тайлбар (МН)">
                  <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical' }} />
                </Field>
                <Field label="Богино тайлбар (EN)">
                  <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical' }} />
                </Field>
              </div>
            </Card>

            <Card title="Сургалтын тухай">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.about_course_mn} onChange={(e) => set('about_course_mn', e.target.value)}
                    style={{ ...inp, height: '150px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
                <Field label="EN">
                  <textarea value={form.about_course_en} onChange={(e) => set('about_course_en', e.target.value)}
                    style={{ ...inp, height: '150px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
              </div>
            </Card>

            <Card title="Юу сурах вэ?" hint="Мөр бүрд нэг зүйл">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.what_you_learn_mn} onChange={(e) => set('what_you_learn_mn', e.target.value)}
                    style={{ ...inp, height: '130px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
                <Field label="EN">
                  <textarea value={form.what_you_learn_en} onChange={(e) => set('what_you_learn_en', e.target.value)}
                    style={{ ...inp, height: '130px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
              </div>
            </Card>

            <Card title="Шаардлага" hint="Мөр бүрд нэг шаардлага">
              <div style={grid2}>
                <Field label="МН">
                  <textarea value={form.requirements_mn} onChange={(e) => set('requirements_mn', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
                <Field label="EN">
                  <textarea value={form.requirements_en} onChange={(e) => set('requirements_en', e.target.value)}
                    style={{ ...inp, height: '100px', resize: 'vertical', lineHeight: 1.7 }} />
                </Field>
              </div>
            </Card>

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
            </Card>

            {/* Curriculum */}
            <Card title="Хичээлийн агуулга (Curriculum)">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.show_outline} onChange={(e) => set('show_outline', e.target.checked)}
                  style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>Хичээлийн агуулгыг сурагчдад харуулах</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {outline.map((mod, mi) => (
                  <div key={mi} style={{ border: '1px solid #333', borderRadius: '10px', overflow: 'hidden' }}>
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

                            {/* STATE A: No video → TUS uploader + YouTube option for free lessons */}
                            {!lesson.stream_id && !lesson.youtube_id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '11px', color: '#6b7280' }}>🎬 Видео: — Байхгүй</span>
                                  <VideoTUSUploader
                                    onUploaded={(streamId, fileName, fileSize) => {
                                      setOutline((o) => {
                                        const newO = o.map((m, i) => i !== mi ? m : ({
                                          ...m,
                                          lessons: m.lessons.map((l, j) => j !== li ? l : ({
                                            ...l,
                                            stream_id: streamId,
                                            video_status: 'approved' as const,
                                            file_name: fileName,
                                            file_size: fileSize,
                                          })),
                                        }));
                                        autoSaveOutlineWithStreamId(newO);
                                        return newO;
                                      });
                                    }}
                                    onError={(msg) => setLessonError(mi, li, msg)}
                                  />
                                </div>
                                <YouTubeIdInput
                                  onSave={(youtubeId) => {
                                    setOutline((o) => {
                                      const newO = o.map((m, i) => i !== mi ? m : ({
                                        ...m,
                                        lessons: m.lessons.map((l, j) => j !== li ? l : ({
                                          ...l,
                                          youtube_id: youtubeId,
                                          video_status: 'approved' as const,
                                        })),
                                      }));
                                      autoSaveOutlineWithStreamId(newO);
                                      return newO;
                                    });
                                  }}
                                />
                              </div>
                            )}

                            {/* STATE B: YouTube video set */}
                            {!lesson.stream_id && lesson.youtube_id && (
                              <div style={{
                                border: '1px solid rgba(255,0,0,0.25)', borderRadius: '8px',
                                background: 'rgba(255,0,0,0.05)', padding: '10px 12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '18px' }}>▶️</span>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>YouTube — Үнэгүй хичээл</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{lesson.youtube_id}</div>
                                  </div>
                                </div>
                                <button type="button"
                                  onClick={() => setOutline((o) => o.map((m, i) => i !== mi ? m : ({
                                    ...m, lessons: m.lessons.map((l, j) => j !== li ? l : ({ ...l, youtube_id: '', video_status: 'none' as const })),
                                  })))}
                                  style={{ fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                                  Устгах
                                </button>
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
                                      ✓ Бэлэн — сурагчдад харагдана
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
                                    disabled={processingLessons.has(`${mi}-${li}`)}
                                    onClick={() => rejectVideo(mi, li, 'Видеог устгаж шинээр оруулах уу?')}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                      background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                                      border: '1px solid rgba(59,130,246,0.2)', cursor: processingLessons.has(`${mi}-${li}`) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {processingLessons.has(`${mi}-${li}`) ? '⏳...' : '🔄 Видео солих'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={processingLessons.has(`${mi}-${li}`)}
                                    onClick={() => rejectVideo(mi, li, 'Видеог CF Stream-аас устгах уу? Энэ үйлдлийг буцаах боломжгүй.')}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                      background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                      border: '1px solid rgba(239,68,68,0.2)', cursor: processingLessons.has(`${mi}-${li}`) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
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
                style={{ marginTop: '6px', background: 'rgba(0,181,173,0.1)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.25)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                + Модуль нэмэх
              </button>
            </Card>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{success}</div>}

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2a2a' }}>
              <button type="submit" disabled={saving} style={{
                background: saving ? '#374151' : '#00B5AD', color: '#fff',
                padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
              }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
              <a href={`/${locale}/admin/courses`} style={{
                background: '#2a2a2a', color: '#9ca3af', padding: '12px 24px', borderRadius: '10px',
                fontWeight: 600, textDecoration: 'none', fontSize: '15px', display: 'inline-flex', alignItems: 'center',
                border: '1px solid #333'
              }}>
                Буцах
              </a>
            </div>
          </div>

          {/* ═══ RIGHT — Sticky Sidebar (30%) ═══ */}
          <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '2rem', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Publish Status */}
            <SideCard title="Нийтлэх тохиргоо">
              <button type="button" onClick={() => set('is_published', !form.is_published)} style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#333'}`, cursor: 'pointer',
                background: form.is_published ? 'rgba(16,185,129,0.15)' : '#2a2a2a',
                color: form.is_published ? '#6ee7b7' : '#9ca3af',
              } as React.CSSProperties}>
                {form.is_published ? '✓ Нийтлэгдсэн' : '○ Ноорог'}
              </button>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0', textAlign: 'center' }}>
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


            {/* Trailer YouTube ID — hidden input to preserve DB value without exposing implementation detail */}
            <input type="hidden" value={form.trailer_url} readOnly />
          </div>
        </div>

        {/* Full-width cover image upload + live preview */}
        <CoverImageSection
          value={form.cover_image_url}
          onChange={(url) => set('cover_image_url', url)}
          title={form.title_mn || 'Гарчиг энд харагдана'}
          badge="Сургалт"
        />
      </form>
    </div>
  );
}

/* ── Sub-components ── */
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

/** Inline YouTube video ID input for free/preview lessons */
function YouTubeIdInput({ onSave }: { onSave: (youtubeId: string) => void }) {
  const [show, setShow] = React.useState(false);
  const [val, setVal] = React.useState('');
  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)}
        style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textDecoration: 'underline' }}>
        + Үнэгүй хичээлд YouTube видео нэмэх
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="YouTube видео ID (жишээ: dQw4w9WgXcQ)"
        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #444', background: '#2a2a2a', color: '#e5e5e5', fontSize: '11px', fontFamily: 'monospace', flex: 1 }}
      />
      <button type="button" onClick={() => { if (val.trim()) { onSave(val.trim()); setVal(''); setShow(false); } }}
        style={{ fontSize: '11px', background: 'rgba(0,181,173,0.15)', color: '#00B5AD', border: '1px solid rgba(0,181,173,0.3)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
        Хадгалах
      </button>
      <button type="button" onClick={() => setShow(false)}
        style={{ fontSize: '11px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>✕</button>
    </div>
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
