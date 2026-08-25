'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Video } from './page';

// ─── helpers ────────────────────────────────────────────────────────────────

function getThumb(v: Video | PlaceholderVideo): string {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  return '';
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}к`;
  return String(n);
}

// Clean YouTube embed — no logo, no end-screen recommendations
function ytSrc(id: string): string {
  const p = new URLSearchParams({
    autoplay: '1', modestbranding: '1', rel: '0',
    showinfo: '0', iv_load_policy: '3', color: 'white',
    origin: 'https://mommyoffice.com',
  });
  return `https://www.youtube.com/embed/${id}?${p}`;
}

// ─── placeholder data (shown until real videos are added) ───────────────────

type PlaceholderVideo = Video & { _placeholder: true };

const CARD_GRADIENTS = [
  '#0d2137,#1a4a6b', '#1a0d37,#4a1a6b', '#0d3720,#1a6b3a',
  '#371a0d,#6b3a1a', '#0d2537,#1a5a6b', '#1c1a00,#3d3600',
  '#1a0d20,#3d1a4b', '#001a1a,#003d3a',
];

const PH: Omit<PlaceholderVideo, '_placeholder'>[] = [
  { id:'ph1', title_mn:'Бизнес эхлүүлэх 5 алхам', title_en:null, slug:null, description_mn:'Монголын бизнес орчинд амжилттай ажил хэрэг эхлүүлэх бодит алхмуудыг хуваалцана.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'45 мин', category:'Бизнес & Санхүү', view_count:12400, is_featured:true, placement:'hero', video_type:'free', created_at:'2026-08-20T00:00:00Z' },
  { id:'ph2', title_mn:'Санхүүгийн чөлөөт байдал', title_en:null, slug:null, description_mn:'Орлогын олон эх үүсвэр байгуулах, идэвхгүй орлого бий болгох аргачлал.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'52 мин', category:'Бизнес & Санхүү', view_count:21000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-18T00:00:00Z' },
  { id:'ph3', title_mn:'Эмэгтэй CEO-уудтай яриа', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'47 мин', category:'Бизнес & Санхүү', view_count:18000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-15T00:00:00Z', description_en:null },
  { id:'ph4', title_mn:'Онлайн бизнес 2024', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'55 мин', category:'Бизнес & Санхүү', view_count:24000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-10T00:00:00Z', description_en:null },
  { id:'ph5', title_mn:'Хоолны дэглэм — бодит хандлага', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'32 мин', category:'Эрүүл мэнд & Гоо сайхан', view_count:8100, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-19T00:00:00Z', description_en:null },
  { id:'ph6', title_mn:'Арьс, үсний арчилгаа', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'19 мин', category:'Эрүүл мэнд & Гоо сайхан', view_count:15000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-17T00:00:00Z', description_en:null },
  { id:'ph7', title_mn:'Стресс менежмент', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'33 мин', category:'Эрүүл мэнд & Гоо сайхан', view_count:13000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-12T00:00:00Z', description_en:null },
  { id:'ph8', title_mn:'Хүүхдийн хүмүүжлийн арга', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'28 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:6700, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-16T00:00:00Z', description_en:null },
  { id:'ph9', title_mn:'Хүүхэдтэй харилцах ур чадвар', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'41 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:11000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-14T00:00:00Z', description_en:null },
  { id:'ph10', title_mn:'Өдрийн хуваарь зохион байгуулах', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'26 мин', category:'Хувийн хөгжил & Карьер', view_count:8900, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-13T00:00:00Z', description_en:null },
  { id:'ph11', title_mn:'Ажил карьер ба гэр бүл', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'38 мин', category:'Хувийн хөгжил & Карьер', view_count:9300, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-11T00:00:00Z', description_en:null },
  { id:'ph12', title_mn:'Гэрийн цэвэрлэгээний систем', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'21 мин', category:'Гэрийн менежмент & Лайфстайл', view_count:4200, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-09T00:00:00Z', description_en:null },
  { id:'ph13', title_mn:'Гэрийн цэсний 7 хоног', title_en:null, slug:null, description_mn:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'16 мин', category:'Гэрийн менежмент & Лайфстайл', view_count:3800, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-08T00:00:00Z', description_en:null },
];

const PLACEHOLDER_VIDEOS: PlaceholderVideo[] = PH.map((p) => ({ ...p, _placeholder: true }));

// ─── row definitions ─────────────────────────────────────────────────────────

const GENRE_LABELS = [
  'Бүгд', 'Бизнес & Санхүү', 'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл', 'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

type AnyVideo = Video | PlaceholderVideo;

type Row = {
  key: string; emoji: string; label: string; gold?: boolean;
  filter: (v: AnyVideo) => boolean;
  sort: (a: AnyVideo, b: AnyVideo) => number;
};

const ROWS: Row[] = [
  { key: 'new',    emoji: '🔥', label: 'Шинээр нэмэгдсэн',
    filter: () => true, sort: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
  { key: 'top',    emoji: '⭐', label: 'Санал болгох',
    filter: () => true, sort: (a, b) => b.view_count - a.view_count },
  { key: 'money',  emoji: '💰', label: 'MoneyCorner — Бизнес & Санхүү', gold: true,
    filter: (v) => v.category === 'Бизнес & Санхүү', sort: (a, b) => b.view_count - a.view_count },
  { key: 'health', emoji: '💆‍♀️', label: 'Эрүүл мэнд & Гоо сайхан',
    filter: (v) => v.category === 'Эрүүл мэнд & Гоо сайхан', sort: (a, b) => b.view_count - a.view_count },
  { key: 'family', emoji: '👨‍👩‍👧', label: 'Хүүхдийн хүмүүжил & Гэр бүл',
    filter: (v) => v.category === 'Хүүхдийн хүмүүжил & Гэр бүл', sort: (a, b) => b.view_count - a.view_count },
  { key: 'growth', emoji: '🚀', label: 'Хувийн хөгжил & Карьер',
    filter: (v) => v.category === 'Хувийн хөгжил & Карьер', sort: (a, b) => b.view_count - a.view_count },
  { key: 'home',   emoji: '🏠', label: 'Гэрийн менежмент & Лайфстайл',
    filter: (v) => v.category === 'Гэрийн менежмент & Лайфстайл', sort: (a, b) => b.view_count - a.view_count },
];

// ─── main component ──────────────────────────────────────────────────────────

export default function VideosClient({ videos, locale }: { videos: Video[]; locale: string }) {
  const [genre, setGenre] = useState('Бүгд');
  const [selected, setSelected] = useState<AnyVideo | null>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  const displayVideos: AnyVideo[] = videos.length > 0 ? videos : PLACEHOLDER_VIDEOS;
  const filtered = genre === 'Бүгд' ? displayVideos : displayVideos.filter((v) => v.category === genre);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const open = useCallback((v: AnyVideo) => setSelected(v), []);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div style={{ background: '#141414', minHeight: '100vh', color: '#e5e5e5', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════
          HERO — cinematic (consistent with homepage)
      ══════════════════════════════════════ */}
      <section style={{
        position: 'relative', width: '100%',
        height: '82vh', minHeight: '520px',
        overflow: 'hidden', background: '#000',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #06101f 0%, #0a1a35 40%, #0d2040 70%, #060e1c 100%)',
        }} />
        {/* Accent glows */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse at 70% 30%, rgba(0,181,173,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.07) 0%, transparent 45%)
          `,
        }} />
        {/* Side fade */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
        }} />
        {/* Bottom fade into page */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(to bottom, transparent, #141414)',
        }} />

        {/* Decorative film-strip lines */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', right: `${8 + i * 5}%`, top: 0, bottom: 0,
            width: '1px', background: `rgba(0,181,173,${0.03 - i * 0.004})`,
          }} />
        ))}

        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: '18%', left: '4%',
          maxWidth: '580px', zIndex: 2,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.4)',
            color: '#00B5AD', padding: '4px 12px', borderRadius: '4px',
            fontSize: '10px', fontWeight: 700, marginBottom: '1.25rem',
            letterSpacing: '2px',
          }}>
            🎬 MOMMYOFFICE STREAMING
          </div>

          <h1 style={{
            fontSize: 'clamp(1.7rem, 3.5vw, 2.8rem)',
            fontWeight: 800, lineHeight: 1.15, color: '#fff',
            marginBottom: '1rem', letterSpacing: '-0.5px',
            textShadow: '0 2px 24px rgba(0,0,0,0.7)',
          }}>
            Кино & Видео
          </h1>

          <p style={{
            fontSize: '15px', color: '#9ba8b5',
            lineHeight: 1.7, marginBottom: '0.75rem',
          }}>
            Бизнес, эрүүл мэнд, гэр бүлийн сэдвээр монгол эмэгтэйчүүдэд зориулсан
            онлайн видео контентийн нэгдсэн платформ.
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem' }}>
            YouTube-ийн лого, санал болгох видео харагдахгүй — зөвхөн MommyOffice дэлгэц.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => rowsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#00B5AD', color: '#fff',
                padding: '12px 30px', borderRadius: '6px',
                fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(0,181,173,0.35)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Видео үзэх
            </button>
            <Link href={`/${locale}/courses`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(109,109,110,0.65)', color: '#fff',
              padding: '12px 28px', borderRadius: '6px',
              fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            }}>
              📚 Сургалтууд
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            {[
              { label: 'Үнэгүй видео', value: '100+' },
              { label: 'Ангилал', value: '5' },
              { label: 'Шинэ долоо хоног бүр', value: '🔥' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#00B5AD' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — floating video cards preview */}
        <div style={{
          position: 'absolute', right: '4%', top: '50%',
          transform: 'translateY(-50%)', zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: '10px',
        }} className="mo-hero-preview">
          {[
            { cat: 'Бизнес & Санхүү', dur: '45 мин', g: '#0d2137,#1a4a6b' },
            { cat: 'Эрүүл мэнд', dur: '32 мин', g: '#0d3720,#1a6b3a' },
            { cat: 'Хувийн хөгжил', dur: '38 мин', g: '#1a0d37,#4a1a6b' },
          ].map((c, i) => (
            <div key={i} style={{
              width: '180px', background: '#1a1a1a',
              borderRadius: '8px', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              opacity: i === 1 ? 1 : 0.65,
              transform: i === 1 ? 'scale(1.05)' : 'scale(1)',
            }}>
              <div style={{
                height: '100px', background: `linear-gradient(135deg, ${c.g})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
              }}>🎬</div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: '11px', color: '#e5e5e5', fontWeight: 600, marginBottom: '2px' }}>{c.cat}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{c.dur}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          GENRE PILLS
      ══════════════════════════════════════ */}
      <div ref={rowsRef} style={{
        display: 'flex', gap: '8px', padding: '1.25rem 4%',
        overflowX: 'auto', borderBottom: '1px solid #1f1f1f',
        scrollbarWidth: 'none', marginTop: '-3rem', position: 'relative', zIndex: 3,
      }}>
        {GENRE_LABELS.map((g) => (
          <button key={g} onClick={() => setGenre(g)} style={{
            flexShrink: 0, padding: '7px 18px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '1px solid',
            transition: 'all 0.15s',
            background: genre === g ? 'rgba(0,181,173,0.15)' : '#1a1a1a',
            color: genre === g ? '#00B5AD' : '#9ca3af',
            borderColor: genre === g ? 'rgba(0,181,173,0.4)' : '#2a2a2a',
          }}>
            {g}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          VIDEO ROWS
      ══════════════════════════════════════ */}
      <div style={{ padding: '0.5rem 0 2rem' }}>
        {ROWS.map((row) => {
          const rowVideos = filtered.filter(row.filter).sort(row.sort).slice(0, 12);
          if (rowVideos.length === 0) return null;
          return (
            <div key={row.key} style={{ padding: '1.5rem 4% 0.5rem' }}>
              <div style={{
                fontSize: '16px', fontWeight: 700, marginBottom: '1rem',
                color: row.gold ? '#f59e0b' : '#e5e5e5',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {row.emoji} {row.label}
              </div>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                {rowVideos.map((v, i) => (
                  <VideoCard key={v.id} video={v} onOpen={open} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════
          COMING SOON: MOVIES
      ══════════════════════════════════════ */}
      <div style={{ padding: '0 4% 4rem' }}>
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            padding: '1.5rem 1.75rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5', marginBottom: '6px' }}>
                🎬 Кино & Баримтат кино
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '420px' }}>
                Монгол, солонгос, баримтат киноны онлайн цуглуулга — удахгүй нэмэгдэх болно.
              </div>
            </div>
            <span style={{
              background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)', fontSize: '12px',
              fontWeight: 700, padding: '6px 16px', borderRadius: '6px', letterSpacing: '0.5px',
            }}>
              ТУН УДАХГҮЙ
            </span>
          </div>
          {/* Genre tags preview */}
          <div style={{ display: 'flex', gap: '8px', padding: '1.25rem 1.75rem', flexWrap: 'wrap' }}>
            {['Баримтат', 'Монгол кино', 'Солонгос', 'Анимашн', 'Драм', 'Аялал'].map((g) => (
              <span key={g} style={{
                background: '#1a1a1a', color: '#4b5563',
                border: '1px solid #222', padding: '6px 16px',
                borderRadius: '20px', fontSize: '13px',
              }}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          VIDEO MODAL
      ══════════════════════════════════════ */}
      {selected && (
        <div onClick={close} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', overflowY: 'auto',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#141414', borderRadius: '12px', width: '100%',
            maxWidth: '920px', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          }}>
            {/* Player */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              {selected.video_type === 'free' && selected.youtube_id ? (
                <iframe
                  src={ytSrc(selected.youtube_id)}
                  title={selected.title_mn}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* Placeholder player — shows when no youtube_id yet */
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, #0d2137, #1a4a6b)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1rem',
                }}>
                  <div style={{
                    width: '72px', height: '72px', background: 'rgba(0,181,173,0.2)',
                    border: '2px solid rgba(0,181,173,0.4)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px',
                  }}>▶</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#e5e5e5', fontWeight: 600, marginBottom: '4px' }}>
                      {selected.title_mn}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Удахгүй нэмэгдэх болно
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '1.25rem 1.75rem' }}>
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
                <button onClick={close} style={{
                  background: '#2a2a2a', border: '1px solid #444', color: '#e5e5e5',
                  borderRadius: '8px', padding: '7px 16px', cursor: 'pointer',
                  fontSize: '13px', flexShrink: 0, marginLeft: '1rem',
                }}>✕ Хаах</button>
              </div>

              {selected.description_mn && (
                <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.65, marginBottom: '1rem' }}>
                  {selected.description_mn}
                </p>
              )}

              <RelatedRow current={selected} all={displayVideos} onOpen={open} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mo-hero-preview { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video, onOpen, index }: { video: AnyVideo; onOpen: (v: AnyVideo) => void; index: number }) {
  const [hovered, setHovered] = useState(false);
  const thumb = getThumb(video);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

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
      <div style={{
        width: '200px', height: '113px', borderRadius: '8px',
        overflow: 'hidden', position: 'relative',
        border: `2px solid ${hovered ? '#00B5AD' : 'transparent'}`,
        transition: 'border-color 0.2s',
        background: `linear-gradient(135deg, ${gradient})`,
      }}>
        {thumb ? (
          <img src={thumb} alt={video.title_mn} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            🎬
          </div>
        )}
        <span style={{
          position: 'absolute', bottom: '6px', right: '6px',
          background: 'rgba(0,0,0,0.8)', color: '#e5e5e5',
          fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontWeight: 600,
        }}>
          {video.duration_text}
        </span>
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '42px', height: '42px', background: '#00B5AD',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: '#fff',
            }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding: '8px 2px 0' }}>
        <p style={{
          fontSize: '13px', fontWeight: 600, color: '#e5e5e5', lineHeight: 1.35, marginBottom: '3px',
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

// ─── RelatedRow ────────────────────────────────────────────────────────────────

function RelatedRow({ current, all, onOpen }: { current: AnyVideo; all: AnyVideo[]; onOpen: (v: AnyVideo) => void }) {
  const related = all.filter((v) => v.id !== current.id && v.category === current.category).slice(0, 6);
  if (related.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '0.6rem' }}>
        Холбоотой видеонууд
      </div>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {related.map((v, i) => {
          const thumb = getThumb(v);
          const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
          return (
            <div key={v.id} onClick={() => onOpen(v)} style={{ flexShrink: 0, width: '140px', cursor: 'pointer' }}>
              <div style={{
                width: '140px', height: '79px', borderRadius: '6px',
                overflow: 'hidden', marginBottom: '6px', position: 'relative',
                background: `linear-gradient(135deg, ${gradient})`,
              }}>
                {thumb
                  ? <img src={thumb} alt={v.title_mn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
                }
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#e5e5e5', fontSize: '9px', padding: '1px 4px', borderRadius: '2px' }}>
                  {v.duration_text}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#e5e5e5', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {v.title_mn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
