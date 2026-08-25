'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { Video } from './page';

// ─── helpers ────────────────────────────────────────────────────────────────

function getThumb(v: AnyVideo): string {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  return '';
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}к`;
  return String(n);
}

function ytSrc(id: string): string {
  const p = new URLSearchParams({
    autoplay: '1', modestbranding: '1', rel: '0',
    showinfo: '0', iv_load_policy: '3', color: 'white',
    origin: 'https://mommyoffice.com',
  });
  return `https://www.youtube.com/embed/${id}?${p}`;
}

// ─── card gradients (same palette as homepage) ───────────────────────────────

const GRADIENTS = [
  'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'linear-gradient(135deg,#1c1a00,#3d3600)',
  'linear-gradient(135deg,#1a0d20,#3d1a4b)',
  'linear-gradient(135deg,#001a1a,#003d3a)',
];

// ─── placeholder data ────────────────────────────────────────────────────────

type PlaceholderVideo = Video & { _placeholder: true };
type AnyVideo = Video | PlaceholderVideo;

const PH: Video[] = [
  { id:'ph1',  title_mn:'Бизнес эхлүүлэх 5 алхам',            title_en:null, slug:null, description_mn:'Монголын бизнес орчинд амжилттай ажил хэрэг эхлүүлэх бодит алхмуудыг хуваалцана.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'45 мин', category:'Бизнес & Санхүү',                   view_count:12400, is_featured:true,  placement:'hero',   video_type:'free', created_at:'2026-08-20T00:00:00Z' },
  { id:'ph2',  title_mn:'Санхүүгийн чөлөөт байдал',           title_en:null, slug:null, description_mn:'Орлогын олон эх үүсвэр байгуулах, идэвхгүй орлого бий болгох аргачлал.',               description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'52 мин', category:'Бизнес & Санхүү',                   view_count:21000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-18T00:00:00Z' },
  { id:'ph3',  title_mn:'Эмэгтэй CEO-уудтай яриа',            title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'47 мин', category:'Бизнес & Санхүү',                   view_count:18000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-15T00:00:00Z' },
  { id:'ph4',  title_mn:'Онлайн бизнес 2026',                 title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'55 мин', category:'Бизнес & Санхүү',                   view_count:24000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-10T00:00:00Z' },
  { id:'ph5',  title_mn:'Хоолны дэглэм — бодит хандлага',    title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'32 мин', category:'Эрүүл мэнд & Гоо сайхан',           view_count:8100,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-19T00:00:00Z' },
  { id:'ph6',  title_mn:'Арьс, үсний арчилгаа',               title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'19 мин', category:'Эрүүл мэнд & Гоо сайхан',           view_count:15000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-17T00:00:00Z' },
  { id:'ph7',  title_mn:'Стресс менежмент',                   title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'33 мин', category:'Эрүүл мэнд & Гоо сайхан',           view_count:13000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-12T00:00:00Z' },
  { id:'ph8',  title_mn:'Хүүхдийн хүмүүжлийн арга',          title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'28 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл',      view_count:6700,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-16T00:00:00Z' },
  { id:'ph9',  title_mn:'Хүүхэдтэй харилцах ур чадвар',      title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'41 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл',      view_count:11000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-14T00:00:00Z' },
  { id:'ph10', title_mn:'Өдрийн хуваарь зохион байгуулах',   title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'26 мин', category:'Хувийн хөгжил & Карьер',            view_count:8900,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-13T00:00:00Z' },
  { id:'ph11', title_mn:'Ажил карьер ба гэр бүл',             title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'38 мин', category:'Хувийн хөгжил & Карьер',            view_count:9300,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-11T00:00:00Z' },
  { id:'ph12', title_mn:'Гэрийн цэвэрлэгээний систем',        title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'21 мин', category:'Гэрийн менежмент & Лайфстайл',      view_count:4200,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-09T00:00:00Z' },
  { id:'ph13', title_mn:'Гэрийн цэсний 7 хоног',              title_en:null, slug:null, description_mn:null, description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'16 мин', category:'Гэрийн менежмент & Лайфстайл',      view_count:3800,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-08T00:00:00Z' },
];

const PLACEHOLDER_VIDEOS = PH;

// ─── row definitions ─────────────────────────────────────────────────────────

const GENRE_LABELS = [
  'Бүгд', 'Бизнес & Санхүү', 'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл', 'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

type Row = {
  key: string; emoji: string; label: string; gold?: boolean;
  filter: (v: AnyVideo) => boolean;
  sort: (a: AnyVideo, b: AnyVideo) => number;
};

const ROWS: Row[] = [
  { key:'new',    emoji:'🔥', label:'Шинээр нэмэгдсэн',
    filter:()=>true,
    sort:(a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime() },
  { key:'top',    emoji:'⭐', label:'Санал болгох',
    filter:()=>true,
    sort:(a,b)=>b.view_count-a.view_count },
  { key:'money',  emoji:'💰', label:'MoneyCorner — Бизнес & Санхүү', gold:true,
    filter:(v)=>v.category==='Бизнес & Санхүү',
    sort:(a,b)=>b.view_count-a.view_count },
  { key:'health', emoji:'💆‍♀️', label:'Эрүүл мэнд & Гоо сайхан',
    filter:(v)=>v.category==='Эрүүл мэнд & Гоо сайхан',
    sort:(a,b)=>b.view_count-a.view_count },
  { key:'family', emoji:'👨‍👩‍👧', label:'Хүүхдийн хүмүүжил & Гэр бүл',
    filter:(v)=>v.category==='Хүүхдийн хүмүүжил & Гэр бүл',
    sort:(a,b)=>b.view_count-a.view_count },
  { key:'growth', emoji:'🚀', label:'Хувийн хөгжил & Карьер',
    filter:(v)=>v.category==='Хувийн хөгжил & Карьер',
    sort:(a,b)=>b.view_count-a.view_count },
  { key:'home',   emoji:'🏠', label:'Гэрийн менежмент & Лайфстайл',
    filter:(v)=>v.category==='Гэрийн менежмент & Лайфстайл',
    sort:(a,b)=>b.view_count-a.view_count },
];

// ─── main component ──────────────────────────────────────────────────────────

export default function VideosClient({ videos, locale }: { videos: Video[]; locale: string }) {
  const [genre, setGenre]     = useState('Бүгд');
  const [selected, setSelected] = useState<AnyVideo | null>(null);

  const displayVideos: AnyVideo[] = videos.length > 0 ? videos : PLACEHOLDER_VIDEOS;
  const filtered = genre === 'Бүгд' ? displayVideos : displayVideos.filter(v => v.category === genre);

  // Featured hero video — first is_featured=true, otherwise first in list
  const hero = displayVideos.find(v => v.is_featured) ?? displayVideos[0] ?? null;

  // Conditional hero fields — gracefully hidden when blank (no empty gap)
  const heroTitle = hero?.title_mn?.trim() || null;
  const heroDesc  = hero?.description_mn?.trim() || null;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const open  = useCallback((v: AnyVideo) => setSelected(v), []);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div style={{ background:'#141414', minHeight:'100vh', color:'#e5e5e5', overflowX:'hidden' }}>

      {/* ══════════════════════════════════════
          HERO — identical structure to homepage
      ══════════════════════════════════════ */}
      <section style={{
        position:'relative', width:'100%',
        height:'88vh', minHeight:'560px',
        overflow:'hidden', background:'#000',
      }}>
        {/* Same gradient as homepage */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, bottom:0,
          background:'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #0a2744 70%, #061428 100%)',
        }}>
          <div style={{
            position:'absolute', top:0, left:0, right:0, bottom:0,
            backgroundImage:`
              radial-gradient(ellipse at 75% 35%, rgba(0,181,173,0.1) 0%, transparent 55%),
              radial-gradient(ellipse at 15% 75%, rgba(255,217,61,0.06) 0%, transparent 45%)
            `,
          }} />
        </div>
        {/* Left fade */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, bottom:0,
          background:'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
        }} />
        {/* Bottom fade into page */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:'40%',
          background:'linear-gradient(to bottom, transparent, #141414)',
        }} />

        {/* Hero content — identical positioning to homepage */}
        <div style={{
          position:'absolute', bottom:'20%', left:'4%',
          maxWidth:'560px', zIndex:2,
        }}>
          {/* Badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'6px',
            background:'rgba(0,181,173,0.15)', border:'1px solid rgba(0,181,173,0.4)',
            color:'#00B5AD', padding:'4px 12px', borderRadius:'4px',
            fontSize:'10px', fontWeight:700, marginBottom:'1.25rem',
            letterSpacing:'2px', textTransform:'uppercase',
          }}>
            🎬 КИНО & ВИДЕО ПЛАТФОРМ
          </div>

          {/* Section title — always "Кино & Видео" */}
          <h1 style={{
            fontSize:'clamp(1.6rem, 3vw, 2.6rem)',
            fontWeight:800, lineHeight:1.15, color:'#fff',
            marginBottom: heroTitle ? '0.5rem' : '1rem',
            textShadow:'0 2px 24px rgba(0,0,0,0.7)', letterSpacing:'-0.5px',
          }}>
            Кино & Видео
          </h1>

          {/* Featured video title — only if non-empty */}
          {heroTitle && (
            <p style={{
              fontSize:'16px', fontWeight:600, color:'#cbd5e1',
              lineHeight:1.4, marginBottom:'0.75rem',
            }}>
              {heroTitle}
            </p>
          )}

          {/* Featured video description — only if non-empty */}
          {heroDesc && (
            <p style={{
              fontSize:'15px', color:'#9ba8b5',
              lineHeight:1.7, marginBottom:'2rem',
            }}>
              {heroDesc}
            </p>
          )}

          {/* Default subtitle when no featured video description */}
          {!heroDesc && (
            <p style={{
              fontSize:'15px', color:'#9ba8b5',
              lineHeight:1.7, marginBottom:'2rem',
            }}>
              Бизнес, эрүүл мэнд, гэр бүлийн сэдвээр монгол эмэгтэйчүүдэд
              зориулсан онлайн видео контентийн нэгдсэн платформ.
            </p>
          )}

          {/* CTA buttons — same style + labels as homepage */}
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button
              onClick={() => hero && open(hero)}
              style={{
                display:'inline-flex', alignItems:'center', gap:'8px',
                background:'#00B5AD', color:'#fff',
                padding:'12px 30px', borderRadius:'6px',
                fontWeight:700, fontSize:'15px', border:'none', cursor:'pointer',
                boxShadow:'0 4px 24px rgba(0,181,173,0.35)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              ҮЗЭХ
            </button>
            <Link href={`/${locale}/courses`} style={{
              display:'inline-flex', alignItems:'center', gap:'8px',
              background:'rgba(109,109,110,0.65)', color:'#fff',
              padding:'12px 30px', borderRadius:'6px',
              fontWeight:700, fontSize:'15px', textDecoration:'none',
              backdropFilter:'blur(6px)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              ДЭЛГЭРЭНГҮЙ
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          GENRE PILLS
      ══════════════════════════════════════ */}
      <div style={{
        display:'flex', gap:'8px', padding:'1.25rem 4%',
        overflowX:'auto', borderBottom:'1px solid #1f1f1f',
        scrollbarWidth:'none', marginTop:'-3rem',
        position:'relative', zIndex:3,
      }}>
        {GENRE_LABELS.map(g => (
          <button key={g} onClick={() => setGenre(g)} style={{
            flexShrink:0, padding:'7px 18px', borderRadius:'20px',
            fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1px solid',
            transition:'all 0.15s',
            background: genre===g ? 'rgba(0,181,173,0.15)' : '#1a1a1a',
            color: genre===g ? '#00B5AD' : '#9ca3af',
            borderColor: genre===g ? 'rgba(0,181,173,0.4)' : '#2a2a2a',
          }}>
            {g}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          VIDEO ROWS — netflix-card style (same as homepage)
      ══════════════════════════════════════ */}
      <div style={{ padding:'0.5rem 0 2rem' }}>
        {ROWS.map(row => {
          const rowVideos = filtered.filter(row.filter).sort(row.sort).slice(0,12);
          if (rowVideos.length === 0) return null;
          return (
            <div key={row.key} style={{ padding:'1.5rem 4% 0.5rem' }}>
              <RowHeader emoji={row.emoji} label={row.label} gold={row.gold} />
              <div style={{
                display:'flex', gap:'10px', overflowX:'auto',
                paddingBottom:'8px', scrollbarWidth:'none',
              }}>
                {rowVideos.map((v, i) => (
                  <VideoCard key={v.id} video={v} onOpen={open} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════
          COMING SOON: MOVIES — same card treatment
      ══════════════════════════════════════ */}
      <div style={{ padding:'0 4% 4rem' }}>
        <RowHeader emoji="🎬" label="Кино & Баримтат кино" />
        <div style={{
          display:'flex', gap:'10px', overflowX:'auto',
          paddingBottom:'8px', scrollbarWidth:'none',
        }}>
          {MOVIE_PLACEHOLDERS.map((m, i) => (
            <div key={m.id} className="netflix-card" style={{
              flexShrink:0, width:'280px', borderRadius:'10px',
              overflow:'hidden', background:'#1a1a1a', position:'relative',
            }}>
              <div style={{
                width:'280px', height:'157px',
                background: GRADIENTS[i % GRADIENTS.length],
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative',
              }}>
                <span style={{ fontSize:'3rem' }}>{m.emoji}</span>
                {/* УДАХГҮЙ badge */}
                <span style={{
                  position:'absolute', top:'10px', left:'10px',
                  background:'rgba(239,68,68,0.85)',
                  color:'#fff', fontSize:'10px', fontWeight:700,
                  padding:'3px 9px', borderRadius:'4px',
                  textTransform:'uppercase', letterSpacing:'0.8px',
                }}>
                  УДАХГҮЙ
                </span>
              </div>
              <div style={{ padding:'10px 14px 14px', height:'54px', overflow:'hidden' }}>
                <p style={{
                  fontWeight:600, fontSize:'13px', color:'#9ca3af',
                  lineHeight:1.45, margin:0,
                  display:'-webkit-box', WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical', overflow:'hidden',
                }}>
                  {m.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          VIDEO MODAL
      ══════════════════════════════════════ */}
      {selected && (
        <div onClick={close} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.9)',
          zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
          padding:'1rem', overflowY:'auto',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'#141414', borderRadius:'12px', width:'100%',
            maxWidth:'920px', overflow:'hidden',
            boxShadow:'0 30px 80px rgba(0,0,0,0.8)',
          }}>
            {/* Player */}
            <div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
              {selected.video_type === 'free' && selected.youtube_id ? (
                <iframe
                  src={ytSrc(selected.youtube_id)}
                  title={selected.title_mn}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{
                  position:'absolute', inset:0,
                  background: GRADIENTS[0],
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:'1rem',
                }}>
                  <div style={{
                    width:'72px', height:'72px', background:'rgba(0,181,173,0.2)',
                    border:'2px solid rgba(0,181,173,0.4)', borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px',
                  }}>▶</div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'14px', color:'#e5e5e5', fontWeight:600, marginBottom:'4px' }}>
                      {selected.title_mn}
                    </div>
                    <div style={{ fontSize:'12px', color:'#6b7280' }}>Удахгүй нэмэгдэх болно</div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding:'1.25rem 1.75rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                <div>
                  <h2 style={{ fontSize:'18px', fontWeight:700, color:'#fff', marginBottom:'4px' }}>
                    {selected.title_mn}
                  </h2>
                  <div style={{ fontSize:'13px', color:'#9ca3af' }}>
                    {selected.duration_text} &nbsp;·&nbsp; {selected.category}
                    {selected.view_count > 0 && <> &nbsp;·&nbsp; {fmtViews(selected.view_count)} үзсэн</>}
                  </div>
                </div>
                <button onClick={close} style={{
                  background:'#2a2a2a', border:'1px solid #444', color:'#e5e5e5',
                  borderRadius:'8px', padding:'7px 16px', cursor:'pointer',
                  fontSize:'13px', flexShrink:0, marginLeft:'1rem',
                }}>
                  ✕ Хаах
                </button>
              </div>

              {selected.description_mn && (
                <p style={{ fontSize:'14px', color:'#9ca3af', lineHeight:1.65, marginBottom:'1rem' }}>
                  {selected.description_mn}
                </p>
              )}

              <RelatedRow current={selected} all={displayVideos} onOpen={open} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RowHeader (same as homepage pattern) ────────────────────────────────────

function RowHeader({ emoji, label, gold }: { emoji: string; label: string; gold?: boolean }) {
  return (
    <div style={{
      fontSize:'16px', fontWeight:700, marginBottom:'1rem',
      color: gold ? '#f59e0b' : '#e5e5e5',
      display:'flex', alignItems:'center', gap:'8px',
    }}>
      {emoji} {label}
    </div>
  );
}

// ─── VideoCard — matches homepage netflix-card exactly ─────────────────────

function VideoCard({ video, onOpen, index }: { video: AnyVideo; onOpen: (v: AnyVideo) => void; index: number }) {
  const thumb = getThumb(video);

  return (
    <div
      onClick={() => onOpen(video)}
      className="netflix-card"
      style={{
        flexShrink:0, width:'280px', borderRadius:'10px',
        overflow:'hidden', background:'#1a1a1a', position:'relative',
      }}
    >
      {/* 16:9 thumbnail — same 280×157 as homepage course cards */}
      <div style={{
        width:'280px', height:'157px',
        background: GRADIENTS[index % GRADIENTS.length],
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
      }}>
        {thumb
          ? <img src={thumb} alt={video.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
          : <span style={{ fontSize:'3rem' }}>🎬</span>
        }
        {/* Category badge — top-left (same pattern as homepage) */}
        <span style={{
          position:'absolute', top:'10px', left:'10px',
          background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
          color:'#fff', fontSize:'10px', fontWeight:700,
          padding:'3px 9px', borderRadius:'4px',
          textTransform:'uppercase', letterSpacing:'0.8px',
        }}>
          {video.category.split(' & ')[0]}
        </span>
        {/* Duration badge — bottom-right (replaces price badge) */}
        <span style={{
          position:'absolute', bottom:'10px', right:'10px',
          background:'#00B5AD', color:'#fff',
          fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px',
        }}>
          {video.duration_text}
        </span>
      </div>

      {/* Title row — same height + clamp as homepage */}
      <div style={{ padding:'10px 14px 14px', height:'54px', overflow:'hidden' }}>
        <p style={{
          fontWeight:600, fontSize:'13px', color:'#e5e5e5',
          lineHeight:1.45, margin:0,
          display:'-webkit-box', WebkitLineClamp:2,
          WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>
          {video.title_mn}
        </p>
      </div>
    </div>
  );
}

// ─── RelatedRow ───────────────────────────────────────────────────────────────

function RelatedRow({ current, all, onOpen }: { current: AnyVideo; all: AnyVideo[]; onOpen: (v: AnyVideo) => void }) {
  const related = all.filter(v => v.id !== current.id && v.category === current.category).slice(0, 6);
  if (related.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize:'13px', fontWeight:600, color:'#9ca3af', marginBottom:'0.6rem' }}>
        Холбоотой видеонууд
      </div>
      <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'4px', scrollbarWidth:'none' }}>
        {related.map((v, i) => {
          const thumb = getThumb(v);
          return (
            <div key={v.id} onClick={() => onOpen(v)} className="netflix-card" style={{
              flexShrink:0, width:'160px', borderRadius:'8px',
              overflow:'hidden', background:'#1a1a1a',
            }}>
              <div style={{
                width:'160px', height:'90px',
                background: GRADIENTS[i % GRADIENTS.length],
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', overflow:'hidden',
              }}>
                {thumb
                  ? <img src={thumb} alt={v.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                  : <span style={{ fontSize:'1.5rem' }}>🎬</span>
                }
                <span style={{
                  position:'absolute', bottom:'4px', right:'4px',
                  background:'rgba(0,0,0,0.8)', color:'#e5e5e5',
                  fontSize:'9px', padding:'1px 5px', borderRadius:'2px', fontWeight:600,
                }}>
                  {v.duration_text}
                </span>
              </div>
              <div style={{ padding:'7px 10px 10px', height:'46px', overflow:'hidden' }}>
                <p style={{
                  fontWeight:600, fontSize:'11px', color:'#e5e5e5',
                  lineHeight:1.35, margin:0,
                  display:'-webkit-box', WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical', overflow:'hidden',
                }}>
                  {v.title_mn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Coming-soon movie placeholders ──────────────────────────────────────────

const MOVIE_PLACEHOLDERS = [
  { id:'m1', title:'Монгол эмэгтэйчүүдийн амжилтын түүх', emoji:'🏆' },
  { id:'m2', title:'Хоол хийх мастер класс',               emoji:'🍜' },
  { id:'m3', title:'Фитнесс & Эрүүл мэнд',                emoji:'💪' },
  { id:'m4', title:'Бизнес ярилцлага',                     emoji:'🎙️' },
  { id:'m5', title:'Гоо сайхны хичээл',                    emoji:'💄' },
];
