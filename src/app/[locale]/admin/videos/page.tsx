'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { listVideos, toggleVideoPublished, deleteVideoById } from '@/app/actions/admin';

type Video = {
  id: string;
  title_mn: string;
  youtube_id: string | null;
  cloudflare_stream_id: string | null;
  category: string;
  duration_text: string;
  view_count: number;
  is_published: boolean;
  is_featured: boolean;
  video_type: string;
  created_at: string;
};

const CATEGORY_COLOR: Record<string, string> = {
  'Бизнес & Санхүү':             'rgba(245,158,11,0.15)',
  'Эрүүл мэнд & Гоо сайхан':    'rgba(16,185,129,0.15)',
  'Хүүхдийн хүмүүжил & Гэр бүл':'rgba(139,92,246,0.15)',
  'Хувийн хөгжил & Карьер':      'rgba(59,130,246,0.15)',
  'Гэрийн менежмент & Лайфстайл':'rgba(236,72,153,0.15)',
};
const CATEGORY_TEXT: Record<string, string> = {
  'Бизнес & Санхүү':             '#f59e0b',
  'Эрүүл мэнд & Гоо сайхан':    '#10b981',
  'Хүүхдийн хүмүүжил & Гэр бүл':'#8b5cf6',
  'Хувийн хөгжил & Карьер':      '#3b82f6',
  'Гэрийн менежмент & Лайфстайл':'#ec4899',
};

export default function AdminVideosPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listVideos().then(({ data, error: err }) => {
      if (err) setError(err);
      else setVideos(data);
      setLoading(false);
    });
  }, []);

  async function togglePublished(id: string, current: boolean) {
    await toggleVideoPublished(id, current);
    setVideos((v) => v.map((x) => x.id === id ? { ...x, is_published: !current } : x));
  }

  async function deleteVideo(id: string, title: string) {
    if (!confirm(`"${title}" видеог устгах уу?`)) return;
    await deleteVideoById(id);
    setVideos((v) => v.filter((x) => x.id !== id));
  }

  const published = videos.filter((v) => v.is_published).length;
  const featured  = videos.filter((v) => v.is_featured).length;
  const free      = videos.filter((v) => v.video_type === 'free').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
            {' / Видеонууд'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>🎬 Видео удирдлага</h1>
        </div>
        <Link href={`/${locale}/admin/videos/new`} style={{
          background: '#00B5AD', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '14px',
        }}>
          + Видео нэмэх
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Нийт видео',       value: videos.length, color: '#e5e5e5' },
          { label: 'Нийтлэгдсэн',      value: published,     color: '#10b981' },
          { label: 'Үнэгүй (YouTube)', value: free,           color: '#00B5AD' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Ачааллаж байна...</div>
      ) : videos.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Видео байхгүй байна</p>
          <p style={{ fontSize: '13px' }}>Эхний видеог нэмэхийн тулд "Видео нэмэх" товчийг дарна уу.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {videos.map((v) => {
            const thumb = v.youtube_id
              ? `https://img.youtube.com/vi/${v.youtube_id}/default.jpg`
              : null;
            return (
              <div key={v.id} style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px',
                padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center',
              }}>
                {/* Thumbnail */}
                <div style={{ flexShrink: 0, width: '80px', height: '45px', borderRadius: '6px', background: '#2a2a2a', overflow: 'hidden' }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      {v.is_featured ? '⭐ ' : ''}{v.title_mn}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                      background: CATEGORY_COLOR[v.category] ?? 'rgba(0,181,173,0.15)',
                      color: CATEGORY_TEXT[v.category] ?? '#00B5AD',
                    }}>
                      {v.category}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', background: '#222', padding: '2px 7px', borderRadius: '4px' }}>
                      {v.video_type === 'free' ? '🔓 YouTube' : '🔐 CF Stream'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {v.duration_text} &nbsp;·&nbsp; {v.view_count} үзсэн
                    {v.youtube_id && <> &nbsp;·&nbsp; ID: <code style={{ color: '#9ca3af' }}>{v.youtube_id}</code></>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => togglePublished(v.id, v.is_published)}
                    style={{
                      fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '6px',
                      border: '1px solid',
                      background: v.is_published ? 'rgba(16,185,129,0.1)' : '#222',
                      color: v.is_published ? '#10b981' : '#6b7280',
                      borderColor: v.is_published ? 'rgba(16,185,129,0.3)' : '#333',
                      cursor: 'pointer',
                    }}
                  >
                    {v.is_published ? '✓ Нийтлэгдсэн' : '○ Ноорог'}
                  </button>
                  <Link href={`/${locale}/admin/videos/${v.id}/edit`} style={{
                    fontSize: '12px', color: '#00B5AD', background: 'rgba(0,181,173,0.1)',
                    border: '1px solid rgba(0,181,173,0.3)', padding: '5px 12px',
                    borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
                  }}>
                    Засах
                  </Link>
                  <button
                    onClick={() => deleteVideo(v.id, v.title_mn)}
                    style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
