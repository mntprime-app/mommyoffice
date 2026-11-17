'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { listAds, createAd, updateAd, deleteAd } from './actions';
import { uploadImage } from '@/app/actions/admin';
import { compressImage, fmtSize } from '@/lib/imageCompress';

type Ad = {
  id: string;
  slot: string;
  title: string | null;
  target_url: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const SLOT_LABELS: Record<string, string> = {
  // ── Homepage ──────────────────────────────────────────
  home_popup:           '[POP-UP] Нүүр хуудас — 8с Поп-ап оверлей',
  home_below_hero:      '[H1]     Нүүр хуудас — Hero доор хөндлөн',
  // ── Articles list ─────────────────────────────────────
  articles_leaderboard: '[A1]     Нийтлэлүүд — Дунд (728×90)',
  articles_sidebar:     '[A2]     Нийтлэлүүд — Sidebar (300×250)',
  articles_footer:      '[A3]     Нийтлэлүүд — Footer (970×90)',
  // ── Article detail ────────────────────────────────────
  article_sidebar:      '[AR1]    Нийтлэл — Sidebar (300×250)',
  article_body_mobile:  '[ARM]    Нийтлэл — Мобайл',
  // ── Other pages ───────────────────────────────────────
  courses_sidebar:      '[C1]     Хичээлүүд — Хөндлөн (970×90)',
  videos_sidebar:       '[V1]     Видеонууд — Sidebar (300×250)',
};

const EMPTY_FORM = {
  slot: 'articles_leaderboard',
  title: '',
  target_url: '',
  media_url: '',
  media_type: 'image' as 'image' | 'video',
  mobile_image_url: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
};

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminAdsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingMobileImage, setUploadingMobileImage] = useState(false);
  const [mobileUploadDone, setMobileUploadDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);
  const videoPickerRef = useRef<HTMLInputElement>(null);
  const mobileImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAds().then((data) => { setAds(data as Ad[]); setLoading(false); });
  }, []);

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErr(null);
    setMobileUploadDone(false);
    setShowForm(true);
  }

  function openEdit(ad: Ad) {
    setEditing(ad);
    setMobileUploadDone(false);
    setForm({
      slot: ad.slot,
      title: ad.title ?? '',
      target_url: ad.target_url,
      media_url: ad.media_url,
      media_type: ad.media_type,
      mobile_image_url: (ad as Ad & { mobile_image_url?: string | null }).mobile_image_url ?? '',
      is_active: ad.is_active,
      starts_at: ad.starts_at ? ad.starts_at.slice(0, 16) : '',
      ends_at: ad.ends_at ? ad.ends_at.slice(0, 16) : '',
    });
    setErr(null);
    setShowForm(true);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected on the next click
    e.target.value = '';
    setUploadingMedia(true);
    setErr(null);
    try {
      let uploadFile = file;
      // Compress images to WebP before upload (videos go through as-is)
      if (file.type.startsWith('image/')) {
        try {
          const before = file.size;
          uploadFile = await compressImage(file, { preset: 'ads', fit: true, quality: 0.85 });
          console.log(`[Ads] Image compressed: ${fmtSize(before)} → ${fmtSize(uploadFile.size)} (WebP)`);
        } catch {
          // Compression failed — upload original
          uploadFile = file;
        }
      }
      const fd = new FormData();
      fd.append('file', uploadFile);
      const { error, url } = await uploadImage(fd, 'ads');
      if (error) { setErr(`Медиа байршуулахад алдаа: ${error}`); return; }
      set('media_url', url!);
      // Auto-detect type from original file
      if (file.type.startsWith('video/')) set('media_type', 'video');
      else set('media_type', 'image');
    } catch (e) {
      setErr(`Медиа байршуулахад алдаа: ${e instanceof Error ? e.message : 'Тодорхойгүй алдаа'}`);
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleSave() {
    setErr(null);
    if (!form.media_url.trim()) { setErr('Медиа файл шаардлагатай'); return; }

    setSaving(true);
    const payload = {
      slot: form.slot,
      title: form.title.trim() || null,
      target_url: form.target_url.trim() || '',
      media_url: form.media_url.trim(),
      media_type: form.media_type,
      mobile_image_url: form.mobile_image_url.trim() || null,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    const result = editing
      ? await updateAd(editing.id, payload)
      : await createAd(payload);

    setSaving(false);
    if (result.error) { setErr(result.error); return; }

    // Refresh list
    listAds().then((data) => setAds(data as Ad[]));
    setShowForm(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title || 'Энэ сурталчилгаа'}" устгах уу?`)) return;
    const { error } = await deleteAd(id);
    if (error) { alert(`Устгах боломжгүй:\n${error}`); return; }
    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await updateAd(id, { is_active: !current });
    if (error) { alert(error); return; }
    setAds((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a));
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link> / Сурталчилгаа
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>📢 Сурталчилгаа ({ads.length})</h1>
        </div>
        <button onClick={openNew} style={{ background: '#00B5AD', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          + Шинэ зар
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '640px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {editing ? 'Зар засах' : 'Шинэ зар нэмэх'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {err && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#f87171' }}>
                {err}
              </div>
            )}

            {/* Slot */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Байршлын зай</label>
              <select value={form.slot} onChange={(e) => set('slot', e.target.value as typeof form.slot)} style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '13px' }}>
                {Object.entries(SLOT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {/* Size guidance per slot */}
              {form.slot === 'home_popup' && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  🖥 Дesktoп: <strong style={{ color: '#9ca3af' }}>976 × 350px</strong> (21:8) &nbsp;·&nbsp; 📱 Мобайл: <strong style={{ color: '#9ca3af' }}>800 × 400px</strong> (2:1) — мобайл зураг тусад нь оруулна
                </p>
              )}
              {form.slot === 'home_below_hero' && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  🖥 Дesktoп: <strong style={{ color: '#9ca3af' }}>1336 × 120px</strong> (11:1) &nbsp;·&nbsp; 📱 Мобайл: <strong style={{ color: '#9ca3af' }}>390 × 100px</strong> (3.9:1) — мобайл зураг тусад нь оруулна
                </p>
              )}
              {['articles_leaderboard', 'articles_footer'].includes(form.slot) && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  🖥 Дesktoп: <strong style={{ color: '#9ca3af' }}>{form.slot === 'articles_leaderboard' ? '728 × 90px' : '970 × 90px'}</strong> &nbsp;·&nbsp; 📱 Мобайл: <strong style={{ color: '#9ca3af' }}>320 × 50px</strong>
                </p>
              )}
              {['articles_sidebar', 'article_sidebar', 'videos_sidebar'].includes(form.slot) && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  Хэмжээ: <strong style={{ color: '#9ca3af' }}>300 × 250px</strong>
                </p>
              )}
              {form.slot === 'courses_sidebar' && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  🖥 Дesktoп: <strong style={{ color: '#9ca3af' }}>970 × 90px</strong> &nbsp;·&nbsp; 📱 Мобайл: <strong style={{ color: '#9ca3af' }}>90px өндөртэй хэвтээ баннер</strong> (автомат кроп)
                </p>
              )}
              {form.slot === 'article_body_mobile' && (
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  📱 Зөвхөн мобайл: <strong style={{ color: '#9ca3af' }}>320 × 100px</strong>
                </p>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Гарчиг (заавал биш)</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Зарын нэр / тайлбар" style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            {/* Target URL */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Очих URL <span style={{ color: '#6b7280', fontWeight: 400 }}>(заавал биш)</span></label>
              <input value={form.target_url} onChange={(e) => set('target_url', e.target.value)} placeholder="https://example.com/product" style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            {/* Media upload */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Зураг / Видео <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingMedia}
                  style={{ padding: '8px 14px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  {uploadingMedia ? 'Байршуулж байна...' : '📁 Файл сонгох'}
                </button>
                {form.media_url && (
                  <span style={{ fontSize: '11px', color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ Байршуулагдлаа</span>
                )}
              </div>
              {/* Hidden file inputs — general, image-only, video-only */}
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
              <input ref={imagePickerRef} type="file" accept="image/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
              <input ref={videoPickerRef} type="file" accept="video/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
              {/* Or paste URL */}
              <input
                value={form.media_url}
                onChange={(e) => set('media_url', e.target.value)}
                placeholder="Эсвэл медиа URL шууд оруулна уу"
                style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#9ca3af', fontSize: '12px', boxSizing: 'border-box', marginTop: '8px' }}
              />
              {/* Preview */}
              {form.media_url && (
                <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.media_type === 'video' ? (
                    <video
                      key={form.media_url}
                      src={form.media_url}
                      autoPlay
                      muted
                      loop
                      controls
                      playsInline
                      style={{ width: '100%', height: '120px', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={form.media_url}
                      src={form.media_url}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Mobile image fallback — shown for ALL slots except article_body_mobile
                (that slot is mobile-only by definition — no desktop counterpart exists) */}
            {form.slot !== 'article_body_mobile' && (
              <div style={{ marginBottom: '14px', background: 'rgba(0,181,173,0.07)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#00B5AD', marginBottom: '6px', fontWeight: 700 }}>
                  {form.slot === 'home_popup'
                    ? '📱 Мобайл зураг (800 × 400px — поп-ап мобайл хувилбар)'
                    : form.slot === 'home_below_hero'
                    ? '📱 Мобайл зураг (390 × 100px — хөндлөн мобайл хувилбар)'
                    : form.media_type === 'video'
                    ? '📱 Мобайл зураг (видео зарын мобайл дээрх орлуулга)'
                    : '📱 Мобайл зураг (мобайл дээрх хувилбар — заавал биш)'}
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => mobileImageRef.current?.click()}
                    disabled={uploadingMobileImage}
                    style={{ padding: '7px 14px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '12px', fontWeight: 600, cursor: uploadingMobileImage ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: uploadingMobileImage ? 0.6 : 1 }}
                  >
                    {uploadingMobileImage ? '⏳ Байршуулж байна...' : '📁 Мобайл зураг сонгох'}
                  </button>
                  {mobileUploadDone && !uploadingMobileImage && (
                    <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Шинэ зураг байршуулагдлаа</span>
                  )}
                  {!mobileUploadDone && form.mobile_image_url && !uploadingMobileImage && (
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>✓ Зураг байна</span>
                  )}
                </div>
                <input ref={mobileImageRef} type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = '';
                  setUploadingMobileImage(true);
                  setMobileUploadDone(false);
                  setErr(null);
                  try {
                    let uploadFile = file;
                    try {
                      uploadFile = await compressImage(file, { preset: 'ads', fit: true, quality: 0.85 });
                    } catch { uploadFile = file; }
                    const fd = new FormData();
                    fd.append('file', uploadFile);
                    const { error, url } = await uploadImage(fd, 'ads');
                    if (error) { setErr(`Мобайл зураг байршуулахад алдаа: ${error}`); return; }
                    set('mobile_image_url', url!);
                    setMobileUploadDone(true);
                  } catch (e) {
                    setErr(`Мобайл зураг байршуулахад алдаа: ${e instanceof Error ? e.message : 'Тодорхойгүй алдаа'}`);
                  } finally {
                    setUploadingMobileImage(false);
                  }
                }} style={{ display: 'none' }} />
                {form.mobile_image_url && (
                  <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', height: '60px', background: '#0f0f0f' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.mobile_image_url} alt="Mobile preview" style={{ width: '100%', height: '60px', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                {!form.mobile_image_url && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6b7280' }}>
                    {form.media_type === 'video'
                      ? 'Мобайл зураг оруулаагүй бол видео зар мобайл дээр харагдахгүй.'
                      : form.slot === 'home_popup'
                      ? 'Мобайл зураг оруулаагүй бол desktop зураг 2:1 хайрцагт харагдана.'
                      : 'Мобайл зураг оруулаагүй бол desktop зурагтай адил зургийг ашиглана.'}
                  </p>
                )}
              </div>
            )}

            {/* Media type toggle — clicking opens the matching file picker.
                The type label is set automatically by handleMediaUpload (auto-detect).
                Do NOT pre-set media_type here — it would override the detected type
                if the user closes the picker without selecting a file. */}
            <div style={{ marginBottom: '14px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => imagePickerRef.current?.click()}
                style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: form.media_type === 'image' ? '#00B5AD' : 'transparent', borderColor: form.media_type === 'image' ? '#00B5AD' : '#333', color: form.media_type === 'image' ? '#fff' : '#6b7280' }}
              >
                🖼 Зураг
              </button>
              <button
                onClick={() => videoPickerRef.current?.click()}
                style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: form.media_type === 'video' ? '#00B5AD' : 'transparent', borderColor: form.media_type === 'video' ? '#00B5AD' : '#333', color: form.media_type === 'video' ? '#fff' : '#6b7280' }}
              >
                🎬 Видео
              </button>
            </div>

            {/* Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Эхлэх огноо (заавал биш)</label>
                <input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Дуусах огноо (заавал биш)</label>
                <input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <button
                onClick={() => set('is_active', !form.is_active)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: form.is_active ? '#00B5AD' : '#2a2a2a', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '3px', left: form.is_active ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
              </button>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Идэвхтэй ({form.is_active ? 'тийм' : 'үгүй'})</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#9ca3af', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Болих</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#00B5AD', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Хадгалж байна...' : (editing ? 'Хадгалах' : 'Нэмэх')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot reference */}
      <SideCard title="Байршлын зайнууд">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
          {Object.entries(SLOT_LABELS).map(([k, v]) => {
            const count = ads.filter((a) => a.slot === k).length;
            const active = ads.filter((a) => a.slot === k && a.is_active).length;
            return (
              <div key={k} style={{ background: '#0f0f0f', borderRadius: '8px', padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#e5e5e5', fontWeight: 600, flexShrink: 1, minWidth: 0 }}>{v}</p>
                  <span style={{ fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600, color: active > 0 ? '#10b981' : '#555' }}>
                    {active > 0 ? `✓ ${active} идэвхтэй` : count > 0 ? `⚠ ${count} идэвхгүй` : '— хоосон'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>{k}</p>
              </div>
            );
          })}
        </div>
      </SideCard>

      {/* Ads list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Ачааллаж байна...</div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed #2a2a2a', borderRadius: '14px', background: '#1a1a1a' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Одоогоор зар байхгүй байна</p>
          <button onClick={openNew} style={{ background: '#00B5AD', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Эхний зар нэмэх
          </button>
        </div>
      ) : (() => {
          // Group ads by slot so the rotation count is immediately visible
          const slotOrder = Object.keys(SLOT_LABELS);
          const grouped = slotOrder
            .map(slot => ({ slot, items: ads.filter(a => a.slot === slot) }))
            .filter(g => g.items.length > 0);
          // Append any ads whose slot isn't in SLOT_LABELS (future-proof)
          const knownSlots = new Set(slotOrder);
          const extra = ads.filter(a => !knownSlots.has(a.slot));
          if (extra.length) grouped.push({ slot: 'other', items: extra });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {grouped.map(({ slot, items }) => {
                const activeCount = items.filter(a => a.is_active).length;
                return (
                  <div key={slot}>
                    {/* Slot group header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #222' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        {SLOT_LABELS[slot] || slot}
                      </span>
                      {activeCount > 1 && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(0,181,173,0.15)', color: '#00B5AD', fontWeight: 700, border: '1px solid rgba(0,181,173,0.3)' }}>
                          🔄 {activeCount} зар ротейшнд
                        </span>
                      )}
                      {activeCount === 1 && (
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>✓ 1 идэвхтэй</span>
                      )}
                      {activeCount === 0 && (
                        <span style={{ fontSize: '10px', color: '#555', fontWeight: 600 }}>○ идэвхгүй</span>
                      )}
                    </div>

                    {/* Ads in this slot */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((ad) => (
                        <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', border: `1px solid ${ad.is_active ? 'rgba(16,185,129,0.2)' : '#222'}`, borderRadius: '10px', background: '#1a1a1a' }}>
                          {/* Thumbnail */}
                          <div style={{ width: '56px', height: '36px', borderRadius: '5px', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                            {ad.media_type === 'video'
                              ? <video src={ad.media_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              // eslint-disable-next-line @next/next/no-img-element
                              : <img src={ad.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            }
                          </div>

                          {/* Info row — all inline */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', marginRight: '2px' }}>
                              {ad.title || '(гарчиггүй)'}
                            </span>
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: ad.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)', color: ad.is_active ? '#10b981' : '#6b7280', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {ad.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                            </span>
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {ad.media_type === 'video' ? '🎬 Видео' : '🖼 Зураг'}
                            </span>
                            {ad.target_url && (
                              <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#00B5AD', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                                {ad.target_url.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => handleToggle(ad.id, ad.is_active)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: ad.is_active ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: ad.is_active ? '#f59e0b' : '#10b981', whiteSpace: 'nowrap' }}>
                              {ad.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                            </button>
                            <button onClick={() => openEdit(ad)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#2a2a2a', color: '#e5e5e5', border: '1px solid #333', cursor: 'pointer' }}>Засах</button>
                            <button onClick={() => handleDelete(ad.id, ad.title || '')} style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>Устгах</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
    </div>
  );
}
