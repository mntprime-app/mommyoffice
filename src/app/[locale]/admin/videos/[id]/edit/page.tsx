'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getVideoById, updateVideo, deleteVideoById,
  getVideoEpisodes, saveEpisodesBatch,
  type VideoEpisode,
} from '@/app/actions/admin';
import CoverImagePicker from '@/components/ui/CoverImagePicker';

const CATEGORIES = [
  'Амжилтын эзэд',
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

type EpRow = Omit<VideoEpisode, 'id' | 'video_id'> & { _key: string };

function mkEpisode(n: number, season = 1): EpRow {
  return {
    _key: `${Date.now()}-${Math.random()}`,
    season_number: season,
    episode_number: n,
    title: `${n}-р анги`,
    duration: '',
    video_url: '',
    video_provider: 'youtube',
    youtube_id: '',
    cloudflare_stream_id: '',
    thumbnail_url: '',
    description: '',
    is_published: true,
  };
}

function extractYouTubeIdFromEp(input: string): string {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const short = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = clean.match(/(?:v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return clean.slice(0, 30); // fallback — keep raw but truncate
}

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEps, setSavingEps] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [epSuccess, setEpSuccess] = useState('');
  const [ytPreview, setYtPreview] = useState('');

  const [form, setForm] = useState({
    title_mn: '', title_en: '', slug: '',
    description_mn: '', description_en: '',
    youtube_url: '', youtube_id: '',
    cloudflare_stream_id: '', thumbnail_url: '',
    duration_text: '', category: CATEGORIES[0],
    video_type: 'free', is_published: false,
    is_featured: false, placement: 'normal',
    comments_enabled: true,
    content_type: 'movie',
    season_count: 1,
  });

  const [episodes, setEpisodes] = useState<EpRow[]>([]);

  useEffect(() => {
    Promise.all([getVideoById(id), getVideoEpisodes(id)]).then(([videoData, epData]) => {
      if (!videoData) { setError('Видео олдсонгүй'); setLoading(false); return; }
      const youtubeId = videoData.youtube_id || '';
      setForm({
        title_mn: videoData.title_mn || '',
        title_en: videoData.title_en || '',
        slug: videoData.slug || '',
        description_mn: videoData.description_mn || '',
        description_en: videoData.description_en || '',
        youtube_url: youtubeId,
        youtube_id: youtubeId,
        cloudflare_stream_id: videoData.cloudflare_stream_id || '',
        thumbnail_url: videoData.thumbnail_url || '',
        duration_text: videoData.duration_text || '',
        category: videoData.category || CATEGORIES[0],
        video_type: videoData.video_type || 'free',
        is_published: Boolean(videoData.is_published),
        is_featured: Boolean(videoData.is_featured),
        placement: videoData.placement || 'normal',
        comments_enabled: videoData.comments_enabled !== false,
        content_type: videoData.content_type || 'movie',
        season_count: videoData.season_count || 1,
      });
      if (youtubeId?.length === 11) setYtPreview(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
      setEpisodes(
        epData.map((ep) => ({
          _key: ep.id || `${Date.now()}-${Math.random()}`,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
          title: ep.title || '',
          duration: ep.duration || '',
          video_url: ep.video_url || '',
          video_provider: ep.video_provider || 'youtube',
          youtube_id: ep.youtube_id || '',
          cloudflare_stream_id: ep.cloudflare_stream_id || '',
          thumbnail_url: ep.thumbnail_url || '',
          description: ep.description || '',
          is_published: ep.is_published !== false,
        }))
      );
      setLoading(false);
    });
  }, [id]);

  function set(key: string, val: string | boolean | number) {
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

  // ── Episode helpers ─────────────────────────────────────────────────────────
  function addEpisode() {
    const lastEp = episodes.length > 0 ? episodes[episodes.length - 1].episode_number : 0;
    setEpisodes((prev) => [...prev, mkEpisode(lastEp + 1, form.season_count)]);
  }

  function removeEpisode(key: string) {
    setEpisodes((prev) => prev.filter((e) => e._key !== key));
  }

  function setEp(key: string, field: string, val: string | boolean | number) {
    setEpisodes((prev) =>
      prev.map((e) => e._key === key ? { ...e, [field]: val } : e)
    );
  }

  async function handleSaveEpisodes() {
    setSavingEps(true); setEpSuccess('');
    const rows = episodes.map(({ _key: _, ...ep }) => ({
      ...ep,
      video_id: id,
    }));
    const { error: err } = await saveEpisodesBatch(id, rows);
    if (err) setError('Ангиуд: ' + err);
    else { setEpSuccess('Ангиуд хадгалагдлаа ✓'); setTimeout(() => setEpSuccess(''), 3000); }
    setSavingEps(false);
  }

  // ── Main video save ─────────────────────────────────────────────────────────
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
      comments_enabled: form.comments_enabled,
      content_type: form.content_type,
      season_count: form.season_count,
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

  const isSeries = form.content_type === 'series';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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
          cursor: 'pointer', fontSize: '13px',
        }}>
          Устгах
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── CONTENT TYPE ── */}
        <div style={card}>
          <p style={sectionTitle}>🎭 Агуулгын төрөл</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { val: 'movie',  label: '🎬 Нэг удаагийн кино / Баримтат', desc: 'Нэг файл — Үзэх товч ажиллана' },
              { val: 'series', label: '📺 Цуврал / Драм / Сериал',        desc: 'Олон анги — Ангиудын жагсаалт харагдана' },
            ].map((opt) => (
              <label key={opt.val} style={{
                flex: 1, padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                border: `2px solid ${form.content_type === opt.val ? '#e50914' : '#2a2a2a'}`,
                background: form.content_type === opt.val ? 'rgba(229,9,20,0.08)' : '#222',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="ctype" value={opt.val}
                  checked={form.content_type === opt.val}
                  onChange={() => set('content_type', opt.val)}
                  style={{ display: 'none' }} />
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#e5e5e5' }}>{opt.label}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>{opt.desc}</div>
              </label>
            ))}
          </div>

          {/* Season count — only for series */}
          {isSeries && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ ...lbl, margin: 0, whiteSpace: 'nowrap' }}>Сезоны тоо:</label>
              <input
                type="number" min={1} max={20} value={form.season_count}
                onChange={(e) => set('season_count', Number(e.target.value))}
                style={{ ...inp, width: '80px' }}
              />
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Season 1, 2, 3… гэж ялгахын тулд 2+ оруулна
              </span>
            </div>
          )}
        </div>

        {/* ── VIDEO SOURCE ── */}
        <div style={card}>
          <label style={sectionTitle}>📡 Видео эх үүсвэр</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {[
              { val: 'free', label: '🔓 YouTube (Үнэгүй)',         desc: 'Бүх хэрэглэгчид үзнэ' },
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

        {/* YouTube or CF stream */}
        {form.video_type === 'free' ? (
          <div>
            <label style={lbl}>YouTube URL эсвэл Video ID{isSeries ? ' (Trailer / 1-р анги)' : ' *'}</label>
            {ytPreview && (
              <img src={ytPreview} alt="yt" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
            )}
            <input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)}
              style={inp} placeholder="https://youtube.com/watch?v=... эсвэл dQw4w9WgXcQ" />
            {form.youtube_id && form.youtube_id.length === 11 && (
              <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ ID: <code>{form.youtube_id}</code></p>
            )}
          </div>
        ) : (
          <div>
            <label style={lbl}>Cloudflare Stream Video ID{isSeries ? ' (Trailer / 1-р анги)' : ' *'}</label>
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

        {/* Cover Image */}
        <div style={card}>
          <CoverImagePicker
            value={form.thumbnail_url}
            onChange={(url) => set('thumbnail_url', url)}
            previewTitle={form.title_mn || 'Гарчиг энд харагдана'}
            previewBadge="Кино & Видео"
          />
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
            <label style={lbl}>{isSeries ? 'Нийт үргэлжлэх хугацаа' : 'Үргэлжлэх хугацаа'}</label>
            <input value={form.duration_text} onChange={(e) => set('duration_text', e.target.value)}
              style={inp} placeholder={isSeries ? '3 цуврал' : '45 мин'} />
          </div>
        </div>

        {/* Placement */}
        <div style={card}>
          <label style={{ ...lbl, display: 'block', marginBottom: '0.75rem' }}>📍 Байршил (Placement)</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { val: 'hero',     label: '🌟 Hero Banner', desc: 'Нүүр хэсэгт том байдлаар' },
              { val: 'trending', label: '🔥 Трэндинг',    desc: 'Санал болгох эгнээнд' },
              { val: 'normal',   label: '📋 Энгийн',      desc: 'Категорийн эгнээ' },
            ].map((p) => (
              <label key={p.val} style={{
                flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                background: form.placement === p.val ? 'rgba(0,181,173,0.1)' : 'transparent',
                border: `1px solid ${form.placement === p.val ? 'rgba(0,181,173,0.4)' : '#333'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="placement" value={p.val} checked={form.placement === p.val}
                    onChange={(e) => set('placement', e.target.value)} style={{ accentColor: '#00B5AD' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#e5e5e5' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '20px' }}>{p.desc}</span>
              </label>
            ))}
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
          {[
            { key: 'is_featured',      label: '⭐ Hero Featured',        desc: 'Нүүр хэсгийн hero болгох',           checked: form.is_featured },
            { key: 'comments_enabled', label: '💬 Сэтгэгдэл зөвшөөрөх', desc: 'Үзэгчид сэтгэгдэл бичих боломжтой', checked: form.comments_enabled },
          ].map((t) => (
            <label key={t.key} style={{
              display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer',
              padding: '10px 16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={t.checked} onChange={(e) => set(t.key, e.target.checked)}
                  style={{ accentColor: '#00B5AD', width: '15px', height: '15px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>{t.label}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '23px' }}>{t.desc}</span>
            </label>
          ))}
        </div>

        {/* Publish */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem',
          background: form.is_published ? 'rgba(16,185,129,0.1)' : '#1e1e1e', borderRadius: '10px',
          border: `1px solid ${form.is_published ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`,
        }}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)}
            style={{ accentColor: '#00B5AD', width: '16px', height: '16px' }} />
          <label htmlFor="pub" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
            {form.is_published ? '✓ Нийтлэгдсэн — хэрэглэгчдэд харагдаж байна' : '○ Ноорог — харагдахгүй'}
          </label>
        </div>

        {error && <p style={errStyle}>{error}</p>}
        {success && <p style={okStyle}>{success}</p>}

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #2a2a2a' }}>
          <button type="submit" disabled={saving} style={saveBtnStyle(saving)}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <Link href={`/${locale}/admin/videos`} style={backLinkStyle}>Буцах</Link>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════════════
          EPISODE MANAGER — only shown for Series content
      ══════════════════════════════════════════════════════════════════════ */}
      {isSeries && (
        <div style={{ marginTop: '2rem', ...card }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={sectionTitle}>📋 Ангиуд (Episodes)</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '-0.5rem 0 0' }}>
                Ангиудыг нэмж, мэдээллийг бөглөн, тусдаа хадгалах товч дарна уу.
              </p>
            </div>
            <button
              type="button"
              onClick={addEpisode}
              style={{
                background: 'rgba(229,9,20,0.15)', color: '#f87171',
                border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px',
                padding: '8px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Шинэ анги нэмэх
            </button>
          </div>

          {episodes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#4b5563', fontSize: '13px' }}>
              Одоогоор анги байхгүй байна.{' '}
              <button type="button" onClick={addEpisode}
                style={{ color: '#00B5AD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                1-р анги нэмэх →
              </button>
            </div>
          )}

          {episodes.map((ep, idx) => (
            <div key={ep._key} style={{
              background: '#111', borderRadius: '10px', padding: '14px',
              marginBottom: '10px', border: '1px solid #222',
            }}>
              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{
                  background: '#e50914', color: '#fff', borderRadius: '4px',
                  padding: '2px 8px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
                }}>
                  АНГИ {ep.episode_number}
                </span>
                {form.season_count > 1 && (
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Сезон {ep.season_number}</span>
                )}
                <div style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>
                  <input type="checkbox" checked={ep.is_published}
                    onChange={(e) => setEp(ep._key, 'is_published', e.target.checked)}
                    style={{ accentColor: '#00B5AD' }} />
                  Нийтлэгдсэн
                </label>
                <button type="button" onClick={() => removeEpisode(ep._key)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
                  title="Устгах">
                  ×
                </button>
              </div>

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={lbl}>Дугаар</label>
                  <input type="number" min={1} value={ep.episode_number}
                    onChange={(e) => setEp(ep._key, 'episode_number', Number(e.target.value))}
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Нэр</label>
                  <input value={ep.title}
                    onChange={(e) => setEp(ep._key, 'title', e.target.value)}
                    style={inp} placeholder={`${ep.episode_number}-р анги: Шинэ эхлэл`} />
                </div>
                <div>
                  <label style={lbl}>Хугацаа</label>
                  <input value={ep.duration}
                    onChange={(e) => setEp(ep._key, 'duration', e.target.value)}
                    style={inp} placeholder="42 мин" />
                </div>
              </div>

              {/* Season selector */}
              {form.season_count > 1 && (
                <div style={{ marginBottom: '8px', width: '80px' }}>
                  <label style={lbl}>Сезон</label>
                  <input type="number" min={1} max={form.season_count} value={ep.season_number}
                    onChange={(e) => setEp(ep._key, 'season_number', Number(e.target.value))}
                    style={inp} />
                </div>
              )}

              {/* Video Provider Toggle */}
              <div style={{ marginBottom: '8px' }}>
                <label style={lbl}>Видео эх үүсвэр (энэ ангид)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { val: 'youtube',    label: '🔓 YouTube',         desc: 'Үнэгүй' },
                    { val: 'cloudflare', label: '🔐 Cloudflare Stream', desc: 'Төлбөртэй / HLS' },
                  ].map((opt) => (
                    <label key={opt.val} style={{
                      flex: 1, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${ep.video_provider === opt.val ? (opt.val === 'cloudflare' ? '#f59e0b' : '#00B5AD') : '#2a2a2a'}`,
                      background: ep.video_provider === opt.val
                        ? (opt.val === 'cloudflare' ? 'rgba(245,158,11,0.08)' : 'rgba(0,181,173,0.08)')
                        : '#111',
                    }}>
                      <input type="radio" name={`ep_provider_${ep._key}`}
                        value={opt.val} checked={ep.video_provider === opt.val}
                        onChange={() => setEp(ep._key, 'video_provider', opt.val)}
                        style={{ display: 'none' }} />
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#e5e5e5' }}>{opt.label}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Provider-specific video source input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  {ep.video_provider === 'youtube' ? (
                    <>
                      <label style={lbl}>YouTube URL эсвэл Video ID</label>
                      <input
                        value={ep.youtube_id}
                        onChange={(e) => {
                          const yid = extractYouTubeIdFromEp(e.target.value);
                          setEp(ep._key, 'youtube_id', yid);
                          setEp(ep._key, 'video_url', e.target.value); // backward compat
                        }}
                        style={inp}
                        placeholder="dQw4w9WgXcQ эсвэл youtube.com/watch?v=..."
                      />
                      {ep.youtube_id?.length === 11 && (
                        <p style={{ fontSize: '10px', color: '#00B5AD', margin: '3px 0 0' }}>
                          ✓ YouTube ID: {ep.youtube_id}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <label style={lbl}>Cloudflare Stream ID</label>
                      <input
                        value={ep.cloudflare_stream_id}
                        onChange={(e) => {
                          setEp(ep._key, 'cloudflare_stream_id', e.target.value.trim());
                          setEp(ep._key, 'video_url', e.target.value.trim()); // backward compat
                        }}
                        style={inp}
                        placeholder="abc123def456... (CF Stream UID)"
                      />
                      <p style={{ fontSize: '10px', color: '#f59e0b', margin: '3px 0 0' }}>
                        🔐 HLS stream — гишүүнчлэлтэй хэрэглэгчид үзнэ
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <label style={lbl}>Thumbnail URL (заавал биш)</label>
                  <input value={ep.thumbnail_url}
                    onChange={(e) => setEp(ep._key, 'thumbnail_url', e.target.value)}
                    style={inp} placeholder="https://..." />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Тайлбар (заавал биш)</label>
                <textarea value={ep.description}
                  onChange={(e) => setEp(ep._key, 'description', e.target.value)}
                  style={{ ...inp, height: '56px', resize: 'vertical' }}
                  placeholder="Ангийн товч агуулга..." />
              </div>
            </div>
          ))}

          {/* Save episodes button */}
          {episodes.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleSaveEpisodes}
                disabled={savingEps}
                style={{
                  background: savingEps ? '#374151' : '#e50914', color: '#fff',
                  border: 'none', borderRadius: '8px', padding: '10px 24px',
                  fontWeight: 700, fontSize: '14px', cursor: savingEps ? 'not-allowed' : 'pointer',
                }}
              >
                {savingEps ? 'Хадгалж байна...' : `💾 Ангиуд хадгалах (${episodes.length})`}
              </button>
              {epSuccess && <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>{epSuccess}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ── */
const card: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 0.75rem',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: '8px',
  border: '1px solid #333', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', background: '#2a2a2a', color: '#e5e5e5', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.35rem',
};
const errStyle: React.CSSProperties = {
  color: '#fca5a5', fontSize: '13px',
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
  padding: '10px 14px', borderRadius: '8px',
};
const okStyle: React.CSSProperties = {
  color: '#6ee7b7', fontSize: '13px',
  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
  padding: '10px 14px', borderRadius: '8px',
};
function saveBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#374151' : '#00B5AD', color: '#fff',
    padding: '12px 32px', borderRadius: '10px', fontWeight: 700,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '15px',
  };
}
const backLinkStyle: React.CSSProperties = {
  background: '#2a2a2a', color: '#e5e5e5', padding: '12px 24px', borderRadius: '10px',
  fontWeight: 600, textDecoration: 'none', fontSize: '15px',
  display: 'inline-flex', alignItems: 'center', border: '1px solid #333',
};
