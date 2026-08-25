'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { Video } from './page';

// ─── helpers ────────────────────────────────────────────────────────────────

function getThumb(v: Video): string {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  return '';
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}к`;
  return String(n);
}

// Clean YouTube embed — hides logo, end-screen recommendations, branding
function ytSrc(id: string): string {
  const p = new URLSearchParams({
    autoplay: '1',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    iv_load_policy: '3',
    color: 'white',
    origin: 'https://mommyoffice.com',
  });
  return `https://www.youtube.com/embed/${id}?${p}`;
}

// ─── data ────────────────────────────────────────────────────────────────────

const GENRE_LABELS = [
  'Бүгд',
  'Бизнес & Санхүү',
  'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл',
  'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

type Row = {
  key: string;
  emoji: string;
  label: string;
  gold?: boolean;
  filter: (v: Video) => boolean;
  sort: (a: Video, b: Video) => number;
};

const ROWS: Row[] = [
  {
    key: 'new', emoji: '🔥', label: 'Шинээр нэмэгдсэн',
    filter: () => true,
    sort: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  },
  {
    key: 'trending', emoji: '⭐', label: 'Санал болгох',
    filter: () => true,
    sort: (a, b) => b.view_count - a.view_count,
  },
  {
    key: 'money', emoji: '💰', label: 'MoneyCorner — Бизнес & Санхүү', gold: true,
    filter: (v) => v.category === 'Бизнес & Санхүү',
    sort: (a, b) => b.view_count - a.view_count,
  },
  {
    key: 'health', emoji: '💆‍♀️', label: 'Эрүүл мэнд & Гоо сайхан',
    filter: (v) => v.category === 'Эрүүл мэнд & Гоо сайхан',
    sort: (a, b) => b.view_count - a.view_count,
  },
  {
    key: 'family', emoji: '👨‍👩‍👧', label: 'Хүүхдийн хүмүүжил & Гэр бүл',
    filter: (v) => v.category === 'Хүүхдийн хүмүүжил & Гэр бүл',
    sort: (a, b) => b.view_count - a.view_count,
  },
  {
    key: 'growth', emoji: '🚀', label: 'Хувийн хөгжил & Карьер',
    filter: (v) => v.category === 'Хувийн хөгжил & Карьер',
    sort: (a, b) => b.view_count - a.view_count,
  },
  {
    key: 'home', emoji: '🏠', label: 'Гэрийн менежмент & Лайфстайл',
    filter: (v) => v.category === 'Гэрийн менежмент & Лайфстайл',
    sort: (a, b) => b.view_count - a.view_count,
  },
];

// ─── component ───────────────────────────────────────────────────────────────

export default function VideosClient({
  videos,
  locale,
}: {
  videos: Video[];
  locale: string;
}) {
  const [genre, setGenre] = useState('Бүгд');
  const [selected, setSelected] = useState<Video | null>(null);

  // Filter videos by selected genre
  const filtered = genre === 'Бүгд' ? videos : videos.filter((v) => v.category === genre);

  // Hero: first explicitly featured video, else first published
  const hero = videos.find((v) => v.is_featured) ?? videos[0] ?? null;

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const open = useCallback((v: Video) => setSelected(v), []);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', paddingBottom: '4rem' }}>

      {/* ── Hero ── */}
      {hero && (
        <div style={{ position: 'relative', background: '#0f1117', borderBottom: '1px solid #1a1a1a' }}>
          {/* Thumbnail background */}
          {getThumb(hero) && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${getThumb(hero)})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.18,
            }} />
          )}
          <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 2.5rem' }}>
            <span style={{
              display: 'inline-block', background: '#00B5AD', color: '#002b29',
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px',
              marginBottom: '0.75rem', letterSpacing: '0.5px',
            }}>
              {hero.category.toUpperCase()}
            </span>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '0.6rem', color: '#fff' }}>
              {hero.title_mn}
            </h1>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '0.75rem' }}>
              <span style={{ marginRight: '12px' }}>{hero.duration_text}</span>
              <span style={{ color: '#00B5AD' }}>● {hero.category}</span>
              {hero.view_count > 0 && <span style={{ marginLeft: '12px' }}>{fmtViews(hero.view_count)} үзсэн</span>}
            </div>
            {hero.description_mn && (
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.65, maxWidth: '520px', marginBottom: '1.25rem' }}>
                {hero.description_mn}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => open(hero)}
                style={{
                  background: '#00B5AD', color: '#fff', border: 'none',
                  padding: '10px 28px', borderRadius: '8px', fontWeight: 700,
                  fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                ▶ Үзэх
              </button>
              <button
                onClick={() => open(hero)}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#e5e5e5',
                  border: '1px solid rgba(255,255,255,0.2)', padding: '10px 22px',
                  borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                ℹ Дэлгэрэнгүй
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Genre pills ── */}
      <div style={{
        display: 'flex', gap: '8px', padding: '1rem 1.5rem',
        overflowX: 'auto', borderBottom: '1px solid #1a1a1a',
        scrollbarWidth: 'none', maxWidth: '1200px', margin: '0 auto',
      }}>
        {GENRE_LABELS.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', border: '1px solid',
              transition: 'all 0.15s',
              background: genre === g ? 'rgba(0,181,173,0.15)' : '#1a1a1a',
              color: genre === g ? '#00B5AD' : '#9ca3af',
              borderColor: genre === g ? 'rgba(0,181,173,0.4)' : '#2a2a2a',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ── No videos state ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Видео олдсонгүй</p>
          <p style={{ fontSize: '13px', marginTop: '0.5rem' }}>Удахгүй шинэ видео нэмэгдэх болно.</p>
        </div>
      )}

      {/* ── Category rows ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {ROWS.map((row) => {
          const rowVideos = filtered.filter(row.filter).sort(row.sort).slice(0, 12);
          if (rowVideos.length === 0) return null;
          return (
            <div key={row.key} style={{ padding: '1.5rem 1.5rem 0.5rem' }}>
              <div style={{
                fontSize: '16px', fontWeight: 700, marginBottom: '0.9rem',
                color: row.gold ? '#f59e0b' : '#e5e5e5',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>{row.emoji}</span>
                <span>{row.label}</span>
              </div>

              {/* Horizontal scroll row */}
              <div style={{
                display: 'flex', gap: '12px', overflowX: 'auto',
                paddingBottom: '12px', scrollbarWidth: 'none',
              }}>
                {rowVideos.map((v) => (
                  <VideoCard key={v.id} video={v} onOpen={open} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Coming Soon: Movies ── */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <div style={{
          background: '#111', border: '1px solid #2a2a2a',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #1a1a1a',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#e5e5e5', marginBottom: '4px' }}>
                🎬 Кино & Баримтат кино
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Монгол, солонгос, баримтат киноны онлайн цуглуулга
              </div>
            </div>
            <span style={{
              background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)', fontSize: '11px',
              fontWeight: 700, padding: '4px 12px', borderRadius: '4px',
              letterSpacing: '0.5px',
            }}>
              ТУН УДАХГҮЙ
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '1rem 1.5rem', flexWrap: 'wrap' }}>
            {['Баримтат', 'Монгол кино', 'Солонгос', 'Анимашн', 'Драм', 'Аялал'].map((g) => (
              <span key={g} style={{
                background: '#1a1a1a', color: '#4b5563', border: '1px solid #222',
                padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
              }}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Video Modal ── */}
      {selected && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#141414', borderRadius: '12px', width: '100%',
              maxWidth: '900px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            {/* Player area */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              {selected.video_type === 'free' && selected.youtube_id ? (
                <iframe
                  src={ytSrc(selected.youtube_id)}
                  title={selected.title_mn}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', fontSize: '14px', gap: '8px',
                }}>
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <span>Энэ контент CF Stream-ээр тоглогдоно</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {selected.title_mn}
                  </h2>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {selected.duration_text} &nbsp;·&nbsp; {selected.category}
                    {selected.view_count > 0 && <> &nbsp;·&nbsp; {fmtViews(selected.view_count)} үзсэн</>}
                  </div>
                </div>
                <button
                  onClick={close}
                  style={{
                    background: '#2a2a2a', border: '1px solid #444', color: '#e5e5e5',
                    borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px',
                    flexShrink: 0, marginLeft: '1rem',
                  }}
                >
                  ✕ Хаах
                </button>
              </div>
              {selected.description_mn && (
                <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.65, marginBottom: '1rem' }}>
                  {selected.description_mn}
                </p>
              )}

              {/* Related videos */}
              <RelatedVideos current={selected} all={videos} onOpen={open} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video, onOpen }: { video: Video; onOpen: (v: Video) => void }) {
  const [hovered, setHovered] = useState(false);
  const thumb = getThumb(video);

  return (
    <div
      onClick={() => onOpen(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0, width: '200px', cursor: 'pointer',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '200px', height: '113px', borderRadius: '8px',
        background: '#1a1a1a', overflow: 'hidden', position: 'relative',
        border: hovered ? '2px solid #00B5AD' : '2px solid transparent',
        transition: 'border-color 0.2s',
      }}>
        {thumb ? (
          <img
            src={thumb}
            alt={video.title_mn}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🎬
          </div>
        )}
        {/* Duration badge */}
        <span style={{
          position: 'absolute', bottom: '6px', right: '6px',
          background: 'rgba(0,0,0,0.75)', color: '#e5e5e5',
          fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontWeight: 600,
        }}>
          {video.duration_text}
        </span>
        {/* Play overlay on hover */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '40px', height: '40px', background: '#00B5AD', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: '#fff',
            }}>▶</div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 2px 0' }}>
        <p style={{
          fontSize: '13px', fontWeight: 600, color: '#e5e5e5',
          lineHeight: 1.35, marginBottom: '3px',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {video.title_mn}
        </p>
        <p style={{ fontSize: '11px', color: '#6b7280' }}>
          {video.category}{video.view_count > 0 ? ` · ${fmtViews(video.view_count)} үзсэн` : ''}
        </p>
      </div>
    </div>
  );
}

// ─── RelatedVideos ────────────────────────────────────────────────────────────

function RelatedVideos({ current, all, onOpen }: { current: Video; all: Video[]; onOpen: (v: Video) => void }) {
  const related = all
    .filter((v) => v.id !== current.id && v.category === current.category)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '0.6rem' }}>
        Холбоотой видеонууд
      </div>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {related.map((v) => (
          <div
            key={v.id}
            onClick={() => onOpen(v)}
            style={{ flexShrink: 0, width: '140px', cursor: 'pointer' }}
          >
            <div style={{
              width: '140px', height: '79px', borderRadius: '6px',
              background: '#1a1a1a', overflow: 'hidden', marginBottom: '6px', position: 'relative',
            }}>
              {getThumb(v) ? (
                <img src={getThumb(v)} alt={v.title_mn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
              )}
              <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.75)', color: '#e5e5e5', fontSize: '9px', padding: '1px 4px', borderRadius: '2px' }}>
                {v.duration_text}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#e5e5e5', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {v.title_mn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
