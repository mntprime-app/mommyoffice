'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { listAds, createAd, updateAd, deleteAd } from './actions';
import { uploadImage } from '@/app/actions/admin';

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
  articles_leaderboard: 'Нийтлэлүүд — Дунд (728×90)',
  articles_sidebar:     'Нийтлэлүүд — Sidebar (300×250)',
  articles_footer:      'Нийтлэлүүд — Footer (970×90)',
  article_body_mobile:  'Нийтлэл дэлгэрэнгүй — Мобайл',
  article_sidebar:      'Нийтлэл дэлгэрэнгүй — Sidebar (300×250)',
  courses_sidebar:      'Хичээлүүд — Sidebar (300×250)',
  videos_sidebar:       'Видеонууд — Sidebar (300×250)',
  home_below_hero:      'Нүүр хуудас — Hero доор',
};

const EMPTY_FORM = {
  slot: 'articles_leaderboard',
  title: '',
  target_url: '',
  media_url: '',
  media_type: 'image' as 'image' | 'video',
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
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);
  const videoPickerRef = useRef<HTMLInputElement>(null);

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
    setShowForm(true);
  }

  function openEdit(ad: Ad) {
    setEditing(ad);
    setForm({
      slot: ad.slot,
      title: ad.title ?? '',
      target_url: ad.target_url,
      media_url: ad.media_url,
      media_type: ad.media_type,
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
    const fd = new FormData();
    fd.append('file', file);
    const { error, url } = await uploadImage(fd, 'ads');
    setUploadingMedia(false);
    if (error) { setErr(`Медиа байршуулахад алдаа: ${error}`); return; }
    set('media_url', url!);
    // Auto-detect video
    if (file.type.startsWith('video/')) set('media_type', 'video');
    else set('media_type', 'image');
  }

  async function handleSave() {
    setErr(null);
    if (!form.target_url.trim()) { setErr('Target URL шаардлагатай'); return; }
    if (!form.media_url.trim()) { setErr('Медиа файл шаардлагатай'); return; }

    setSaving(true);
    const payload = {
      slot: form.slot,
      title: form.title.trim() || null,
      target_url: form.target_url.trim(),
      media_url: form.media_url.trim(),
      media_type: form.media_type,
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
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Гарчиг (заавал биш)</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Зарын нэр / тайлбар" style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e5e5', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            {/* Target URL */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Очих URL <span style={{ color: '#ef4444' }}>*</span></label>
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
                      muted
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

            {/* Media type toggle — clicking also opens the matching file picker */}
            <div style={{ marginBottom: '14px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { set('media_type', 'image'); imagePickerRef.current?.click(); }}
                style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: form.media_type === 'image' ? '#00B5AD' : 'transparent', borderColor: form.media_type === 'image' ? '#00B5AD' : '#333', color: form.media_type === 'image' ? '#fff' : '#6b7280' }}
              >
                🖼 Зураг
              </button>
              <button
                onClick={() => { set('media_type', 'video'); videoPickerRef.current?.click(); }}
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
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#e5e5e5', fontWeight: 600 }}>{v}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>{k}</p>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: active > 0 ? '#10b981' : '#555' }}>
                  {active > 0 ? `✓ ${active} идэвхтэй` : count > 0 ? `⚠ ${count} идэвхгүй` : '— хоосон'}
                </p>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ads.map((ad) => (
            <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid #2a2a2a', borderRadius: '10px', background: '#1a1a1a' }}>
              {/* Media preview */}
              <div style={{ width: '60px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                {ad.media_type === 'video'
                  ? <video src={ad.media_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={ad.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>{ad.title || '(гарчиггүй)'}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: ad.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: ad.is_active ? '#10b981' : '#6b7280', fontWeight: 700 }}>
                    {ad.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }}>
                    {ad.media_type === 'video' ? '🎬 Видео' : '🖼 Зураг'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {SLOT_LABELS[ad.slot] || ad.slot} · <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00B5AD', textDecoration: 'none' }}>{ad.target_url}</a>
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleToggle(ad.id, ad.is_active)}
                  style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: ad.is_active ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: ad.is_active ? '#f59e0b' : '#10b981' }}
                >
                  {ad.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                </button>
                <button onClick={() => openEdit(ad)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#2a2a2a', color: '#e5e5e5', border: '1px solid #333', cursor: 'pointer' }}>Засах</button>
                <button onClick={() => handleDelete(ad.id, ad.title || '')} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>Устгах</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
