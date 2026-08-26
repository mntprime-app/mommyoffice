'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getVideoById, updateVideo, deleteVideoById } from '@/app/actions/admin';

const CATEGORIES = [
  'Бизнес & Санхүү',
  'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл',
  'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

function extractYouTubeId(input: string): string {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const short = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = clean.match(/(?:v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return clean;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80);
}

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ytPreview, setYtPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '', slug: '',
    description_mn: '', description_en: '',
    youtube_url: '', youtube_id: '',
    cloudflare_stream_id: '', thumbnail_url: '',
    duration_text: '', category: 'Бизнес & Санхүү',
    video_type: 'free', is_published: false,
    is_featured: false, placement: 'normal',
  });

  useEffect(() => {
    getVideoById(id).then((data) => {
      if (!data) { setError('Видео олдсонгүй'); setLoading(false); return; }
      const youtubeId = data.youtube_id || '';
      setForm({
        title_mn: data.title_mn || '',
        title_en: data.title_en || '',
        slug: data.slug || '',
        description_mn: data.description_mn || '',
        description_en: data.description_en || '',
        youtube_url: youtubeId,
        youtube_id: youtubeId,
        cloudflare_stream_id: data.cloudflare_stream_id || '',
        thumbnail_url: data.thumbnail_url || '',
        duration_text: data.duration_text || '',
        category: data.category || 'Бизнес & Санхүү',
        video_type: data.video_type || 'free',
        is_published: Boolean(data.is_published),
        is_featured: Boolean(data.is_featured),
        placement: data.placement || 'normal',
      });
      if (youtubeId?.length === 11) {
        setYtPreview(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
      }
      setLoading(false);
    });
  }, [id]);

  function set(key: string, val: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'youtube_url') {
        const yid = extractYouTubeId(String(val));
        next.youtube_id = yid;
        if (yid.length === 11) setYtPreview(`https://img.youtube.com/vi/${yid}/hqdefault.jpg`);
        else setYtPreview('');
      }
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_mn) { setError('Монгол нэр заавал бөглөнө үү.'); return; }
    setSaving(true); setError(''); setSuccess('');
    const { error: err } = await updateVideo(id, {
      title_mn: form.title_mn,
      title_en: form.title_en || null,
      slug: form.slug || slugify(form.title_mn),
      description_mn: form.description_mn || null,
      description_en: form.description_en || null,
      youtube_id: form.video_type === 'free' ? form.youtube_id : null,
      cloudflare_stream_id: form.video_type === 'paid' ? form.cloudflare_stream_id : null,
      thumbnail_url: form.thumbnail_url || null,
      duration_text: form.duration_text || '0 мин',
      category: form.category,
      video_type: form.video_type,
      is_published: form.is_published,
      is_featured: form.is_featured,
      placement: form.placement,
    });
    if (err) setError(err);
    else { setSuccess('Амжилттай хадгаллаа ✓'); setTimeout(() => setSuccess(''), 3000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${form.title_mn}" видеог устгах уу?`)) return;
    await deleteVideoById(id);
    router.push(`/${locale}/admin/videos`);
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Ачааллаж байна...</div>;
  if (error && !form.title_mn) return <div style={{ padding: '3rem', textAlign: 'center', color: '#fca5a5' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
            {' / '}
            <Link href={`/${locale}/admin/videos`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Видеонууд</Link>
            {' / Засах'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>🎬 {form.title_mn || 'Видео засах'}</h1>
        </div>
        <button onClick={handleDelete} style={{
          background: 'rgba(239,68,68,0.15)', color: '#ef4444',
          padding: '8px 16px', borderRadius: '8px',
          fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)',
          cursor: 'pointer', fontSize: '13px'
        }}>
          Устгах
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Video type */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem' }}>
          <label style={lbl}>📡 Видео эх үүсвэр</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {[
              { val: 'free', label: '🔓 YouTube (Үнэгүй)', desc: 'Бүх хэрэглэгчид үзнэ' },
              { val: 'paid', label: '🔐 CF Stream (Төлбөртэй)', desc: 'Гишүүн/худалдан авагч' },
            ].map((opt) => (
              <label key={opt.val} style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                border: `2px solid ${form.video_type === opt.val ? '#00B5AD' : '#2a2a2a'}`,
                background: form.video_type === opt.val ? 'rgba(0,181,173,0.08)' : '#222',
              }}>
                <input type="radio" name="vtype" value={opt.val} checked={form.video_type === opt.val}
                  onChange={() => set('video_type', opt.val)} style={{ display: 'none' }} />
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#e5e5e5' }}>{opt.label}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{opt.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* YouTube or CF */}
        {form.video_type === 'free' ? (
          <div>
            <label style={lbl}>YouTube URL эсвэл Video ID *</label>
            {ytPreview && (
              <img src={ytPreview} alt="yt" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
            )}
            <input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)}
              style={inp} placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ  эсвэл  dQw4w9WgXcQ" />
            {form.youtube_id && form.youtube_id.length === 11 && (
              <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ ID: <code>{form.youtube_id}</code></p>
            )}
          </div>
        ) : (
          <div>
            <label style={lbl}>Cloudflare Stream Video ID *</label>
            <input value={form.cloudflare_stream_id} onChange={(e) => set('cloudflare_stream_id', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace', fontSize: '13px' }} placeholder="a8765f2b3c4d5e6f..." />
          </div>
        )}

        {/* Titles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={lbl}>Нэр (МН) * — {form.title_mn.length}/80</label>
            <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value.slice(0, 80))}
              required maxLength={80} style={inp} placeholder="Бизнес эхлүүлэх 5 алхам" />
          </div>
          <div>
            <label style={lbl}>Нэр (EN)</label>
            <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} />
          </div>
        </div>

        <div>
          <label style={lbl}>Slug (URL)</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} style={inp} placeholder="biznes-ehleh-5-alkham" />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label style={lbl}>Thumbnail URL</label>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px' }}>💡 1280×720px — YouTube тhumbnail авто ашиглагдана (YouTube видео бол оруулах шаардлагагүй)</p>
          {form.thumbnail_url && (
            <img src={form.thumbnail_url} alt="thumb" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
          )}
          <input value={form.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} style={inp} placeholder="https://..." />
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={lbl}>Ангилал</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map((c) => <option key={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Үргэлжлэх хугацаа</label>
            <input value={form.duration_text} onChange={(e) => set('duration_text', e.target.value)} style={inp} placeholder="45 мин" />
          </div>
          <div>
            <label style={lbl}>Байршил</label>
            <select value={form.placement} onChange={(e) => set('placement', e.target.value)} style={inp}>
              <option value="normal">Энгийн</option>
              <option value="hero">Hero Banner</option>
              <option value="trending">Trending</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={lbl}>Тайлбар (МН)</label>
          <textarea value={form.description_mn} onChange={(e) => set('description_mn', e.target.value)}
            style={{ ...inp, height: '90px', resize: 'vertical' }} placeholder="Видеоны товч агуулга..." />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>⭐ Featured</span>
          </label>
        </div>

        {/* Publish */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem',
          background: form.is_published ? 'rgba(16,185,129,0.1)' : '#1e1e1e', borderRadius: '10px',
          border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`
        }}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)}
            style={{ accentColor: '#00B5AD', width: '16px', height: '16px' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
            {form.is_published ? '✓ Нийтлэгдсэн — хэрэглэгчдэд харагдаж байна' : '○ Ноорог — харагдахгүй'}
          </label>
        </div>

        {error && <p style={{ color: '#fca5a5', fontSize: '13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '8px' }}>{error}</p>}
        {success && <p style={{ color: '#6ee7b7', fontSize: '13px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 14px', borderRadius: '8px' }}>{success}</p>}

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2a2a' }}>
          <button type="submit" disabled={saving} style={{
            background: saving ? '#374151' : '#00B5AD', color: '#fff',
            padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px'
          }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <Link href={`/${locale}/admin/videos`} style={{
            background: '#2a2a2a', color: '#e5e5e5', padding: '12px 24px', borderRadius: '10px',
            fontWeight: 600, textDecoration: 'none', fontSize: '15px', display: 'inline-flex', alignItems: 'center',
            border: '1px solid #333'
          }}>
            Буцах
          </Link>
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: '8px',
  border: '1px solid #333', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', background: '#2a2a2a', color: '#e5e5e5', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.35rem',
};
