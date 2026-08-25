'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Video } from './page';

// ─── types ───────────────────────────────────────────────────────────────────

type PlaceholderVideo = Video & { _placeholder?: true };
type AnyVideo = Video | PlaceholderVideo;

// ─── helpers ─────────────────────────────────────────────────────────────────

function getThumb(v: AnyVideo): string {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
  return '';
}
function getThumbHQ(v: AnyVideo): string {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`;
  return '';
}
function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}к` : String(n);
}
function ytSrc(id: string, autoplay = false) {
  return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&origin=https://mommyoffice.com`;
}

// ─── gradients (shared with homepage palette) ─────────────────────────────

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

const PH: Video[] = [
  { id:'ph1',  title_mn:'Бизнес эхлүүлэх 5 алхам',          title_en:null, slug:'biznes-ehluureh-5-alkham',  description_mn:'Монголын бизнес орчинд амжилттай ажил хэрэг эхлүүлэх бодит алхмуудыг хуваалцана.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'45 мин', category:'Бизнес & Санхүү',              view_count:12400, is_featured:true,  placement:'hero',   video_type:'free', created_at:'2026-08-20T00:00:00Z' },
  { id:'ph2',  title_mn:'Санхүүгийн чөлөөт байдал',         title_en:null, slug:null, description_mn:'Орлогын олон эх үүсвэр байгуулах, идэвхгүй орлого бий болгох аргачлал.',               description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'52 мин', category:'Бизнес & Санхүү',              view_count:21000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-18T00:00:00Z' },
  { id:'ph3',  title_mn:'Эмэгтэй CEO-уудтай яриа',          title_en:null, slug:null, description_mn:'Монгол эмэгтэй удирдагчдын амжилтын түүх, бизнесийн нууц болон бодит зөвлөгөө.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'47 мин', category:'Бизнес & Санхүү',              view_count:18000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-15T00:00:00Z' },
  { id:'ph4',  title_mn:'Онлайн бизнес 2026',               title_en:null, slug:null, description_mn:'Онлайн платформоор бизнес хэрхэн байгуулах, цахим орчинд брэнд үүсгэх аргачлал.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'55 мин', category:'Бизнес & Санхүү',              view_count:24000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-10T00:00:00Z' },
  { id:'ph5',  title_mn:'Хоолны дэглэм — бодит хандлага',  title_en:null, slug:null, description_mn:'Эмэгтэйчүүдэд тохирсон эрүүл хоолны дэглэм, хоол тэжээлийн зөв ойлголт.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'32 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:8100,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-19T00:00:00Z' },
  { id:'ph6',  title_mn:'Арьс, үсний арчилгаа',             title_en:null, slug:null, description_mn:'Монгол орны уур амьсгалд тохирсон арьс, үсний арчилгааны бодит арга зам.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'19 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:15000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-17T00:00:00Z' },
  { id:'ph7',  title_mn:'Стресс менежмент',                 title_en:null, slug:null, description_mn:'Өдөр тутмын стрессийг удирдах, сэтгэл зүйн тэнцвэрийг хадгалах практик аргууд.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'33 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:13000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-12T00:00:00Z' },
  { id:'ph8',  title_mn:'Хүүхдийн хүмүүжлийн арга',        title_en:null, slug:null, description_mn:'Эерэг хүмүүжлийн зарчим, хүүхдийг сайн хүн болгоход чиглэсэн практик зөвлөгөө.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'28 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:6700,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-16T00:00:00Z' },
  { id:'ph9',  title_mn:'Хүүхэдтэй харилцах ур чадвар',    title_en:null, slug:null, description_mn:'Ялгаатай насны хүүхэдтэй хэрхэн харилцах, итгэлцэл бий болгох аргачлал.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'41 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:11000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-14T00:00:00Z' },
  { id:'ph10', title_mn:'Өдрийн хуваарь зохион байгуулах', title_en:null, slug:null, description_mn:'Цагаа зөв хуваарилах, бүтээлч байдлаа нэмэгдүүлэх, productivity дээшлүүлэх систем.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'26 мин', category:'Хувийн хөгжил & Карьер',       view_count:8900,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-13T00:00:00Z' },
  { id:'ph11', title_mn:'Ажил карьер ба гэр бүл',          title_en:null, slug:null, description_mn:'Карьер болон гэр бүлийн амьдралыг хэрхэн тэнцвэртэй авч явах вэ — бодит туршлагаас.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'38 мин', category:'Хувийн хөгжил & Карьер',       view_count:9300,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-11T00:00:00Z' },
  { id:'ph12', title_mn:'Гэрийн цэвэрлэгээний систем',     title_en:null, slug:null, description_mn:'Гэрийг цэвэрхэн, эмх цэгцтэй байлгах системчилсэн арга, хугацаа хэмнэх зөвлөгөө.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'21 мин', category:'Гэрийн менежмент & Лайфстайл',  view_count:4200,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-09T00:00:00Z' },
  { id:'ph13', title_mn:'Гэрийн цэсний 7 хоног',           title_en:null, slug:null, description_mn:'7 хоногийн хоолны цэс гаргах, хүнсний зардлаа хэмнэх практик удирдамж.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'16 мин', category:'Гэрийн менежмент & Лайфстайл',  view_count:3800,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-08T00:00:00Z' },
];

// ─── rows ─────────────────────────────────────────────────────────────────────

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
    filter:()=>true, sort:(a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime() },
  { key:'top',    emoji:'⭐', label:'Санал болгох',
    filter:()=>true, sort:(a,b)=>b.view_count-a.view_count },
  { key:'money',  emoji:'💰', label:'MoneyCorner — Бизнес & Санхүү', gold:true,
    filter:(v)=>v.category==='Бизнес & Санхүү', sort:(a,b)=>b.view_count-a.view_count },
  { key:'health', emoji:'💆‍♀️', label:'Эрүүл мэнд & Гоо сайхан',
    filter:(v)=>v.category==='Эрүүл мэнд & Гоо сайхан', sort:(a,b)=>b.view_count-a.view_count },
  { key:'family', emoji:'👨‍👩‍👧', label:'Хүүхдийн хүмүүжил & Гэр бүл',
    filter:(v)=>v.category==='Хүүхдийн хүмүүжил & Гэр бүл', sort:(a,b)=>b.view_count-a.view_count },
  { key:'growth', emoji:'🚀', label:'Хувийн хөгжил & Карьер',
    filter:(v)=>v.category==='Хувийн хөгжил & Карьер', sort:(a,b)=>b.view_count-a.view_count },
  { key:'home',   emoji:'🏠', label:'Гэрийн менежмент & Лайфстайл',
    filter:(v)=>v.category==='Гэрийн менежмент & Лайфстайл', sort:(a,b)=>b.view_count-a.view_count },
];

const MOVIE_PLACEHOLDERS = [
  { id:'m1', title:'Монгол эмэгтэйчүүдийн амжилтын түүх', emoji:'🏆' },
  { id:'m2', title:'Хоол хийх мастер класс',               emoji:'🍜' },
  { id:'m3', title:'Фитнесс & Эрүүл мэнд',                emoji:'💪' },
  { id:'m4', title:'Бизнес ярилцлага',                     emoji:'🎙️' },
  { id:'m5', title:'Гоо сайхны хичээл',                    emoji:'💄' },
];

// ─── main component ───────────────────────────────────────────────────────────

export default function VideosClient({ videos, locale }: { videos: Video[]; locale: string }) {
  const [genre, setGenre]       = useState('Бүгд');
  const [infoVideo, setInfoVideo] = useState<AnyVideo | null>(null);   // "More Info" panel
  const [isPlaying, setIsPlaying] = useState(false);                   // player inside info modal
  const [watchlist, setWatchlist] = useState<string[]>([]);            // localStorage My List
  const [modalVisible, setModalVisible] = useState(false);             // drives slide-up anim
  const savedScrollY = useRef(0);

  const displayVideos: AnyVideo[] = videos.length > 0 ? videos : PH;
  const filtered = genre === 'Бүгд' ? displayVideos : displayVideos.filter(v => v.category === genre);
  const hero = displayVideos.find(v => v.is_featured) ?? displayVideos[0] ?? null;

  const heroTitle = hero?.title_mn?.trim() || null;
  const heroDesc  = hero?.description_mn?.trim() || null;

  // ── hydrate watchlist from localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mo_watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {}
  }, []);

  // ── URL deep-link: auto-open ?v=id on load ────────────────────────────────
  useEffect(() => {
    const vId = new URLSearchParams(window.location.search).get('v');
    if (vId) {
      const found = displayVideos.find(v => v.id === vId || v.slug === vId);
      if (found) openInfo(found, false); // false = don't overwrite URL (already has it)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ESC handler ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeInfo(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  function openInfo(video: AnyVideo, updateUrl = true) {
    savedScrollY.current = window.scrollY;
    setInfoVideo(video);
    setIsPlaying(false);
    setModalVisible(false);
    // Slide-up anim: set visible on next tick
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
    if (updateUrl) {
      history.replaceState(null, '', `${window.location.pathname}?v=${video.id}`);
    }
  }

  const closeInfo = useCallback(() => {
    setModalVisible(false);
    // Wait for slide-down before unmounting
    setTimeout(() => {
      setInfoVideo(null);
      setIsPlaying(false);
      history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: savedScrollY.current, behavior: 'instant' });
    }, 280);
  }, []);

  function toggleWatchlist(id: string) {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('mo_watchlist', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background:'#141414', minHeight:'100vh', color:'#e5e5e5', overflowX:'hidden' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position:'relative', width:'100%', height:'88vh', minHeight:'560px',
        overflow:'hidden', background:'#000',
      }}>
        <div style={{
          position:'absolute', top:0, left:0, right:0, bottom:0,
          background:'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #0a2744 70%, #061428 100%)',
        }}>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:`radial-gradient(ellipse at 75% 35%, rgba(0,181,173,0.1) 0%, transparent 55%),
              radial-gradient(ellipse at 15% 75%, rgba(255,217,61,0.06) 0%, transparent 45%)`,
          }} />
        </div>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to bottom, transparent, #141414)' }} />

        <div style={{ position:'absolute', bottom:'20%', left:'4%', maxWidth:'560px', zIndex:2 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'6px',
            background:'rgba(0,181,173,0.15)', border:'1px solid rgba(0,181,173,0.4)',
            color:'#00B5AD', padding:'4px 12px', borderRadius:'4px',
            fontSize:'10px', fontWeight:700, marginBottom:'1.25rem',
            letterSpacing:'2px', textTransform:'uppercase',
          }}>🎬 КИНО & ВИДЕО ПЛАТФОРМ</div>

          <h1 style={{
            fontSize:'clamp(1.6rem, 3vw, 2.6rem)', fontWeight:800, lineHeight:1.15,
            color:'#fff', marginBottom: heroTitle ? '0.5rem' : '1rem',
            textShadow:'0 2px 24px rgba(0,0,0,0.7)', letterSpacing:'-0.5px',
          }}>Кино & Видео</h1>

          {heroTitle && (
            <p style={{ fontSize:'16px', fontWeight:600, color:'#cbd5e1', lineHeight:1.4, marginBottom:'0.75rem' }}>
              {heroTitle}
            </p>
          )}

          <p style={{ fontSize:'15px', color:'#9ba8b5', lineHeight:1.7, marginBottom:'2rem' }}>
            {heroDesc ?? 'Бизнес, эрүүл мэнд, гэр бүлийн сэдвээр монгол эмэгтэйчүүдэд зориулсан онлайн видео контентийн нэгдсэн платформ.'}
          </p>

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button
              onClick={() => hero && (setInfoVideo(hero), setIsPlaying(true), setModalVisible(false), requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true))), hero && history.replaceState(null, '', `${window.location.pathname}?v=${hero.id}`))}
              style={{
                display:'inline-flex', alignItems:'center', gap:'8px',
                background:'#00B5AD', color:'#fff', padding:'12px 30px', borderRadius:'6px',
                fontWeight:700, fontSize:'15px', border:'none', cursor:'pointer',
                boxShadow:'0 4px 24px rgba(0,181,173,0.35)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              ҮЗЭХ
            </button>
            <button
              onClick={() => hero && openInfo(hero)}
              style={{
                display:'inline-flex', alignItems:'center', gap:'8px',
                background:'rgba(109,109,110,0.65)', color:'#fff',
                padding:'12px 30px', borderRadius:'6px',
                fontWeight:700, fontSize:'15px', border:'none', cursor:'pointer',
                backdropFilter:'blur(6px)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              ДЭЛГЭРЭНГҮЙ
            </button>
          </div>
        </div>
      </section>

      {/* ══ GENRE PILLS ═══════════════════════════════════════════════════════ */}
      <div style={{
        display:'flex', gap:'8px', padding:'1.25rem 4%', overflowX:'auto',
        borderBottom:'1px solid #1f1f1f', scrollbarWidth:'none',
        marginTop:'-3rem', position:'relative', zIndex:3,
      }}>
        {GENRE_LABELS.map(g => (
          <button key={g} onClick={() => setGenre(g)} style={{
            flexShrink:0, padding:'7px 18px', borderRadius:'20px',
            fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1px solid',
            transition:'all 0.15s',
            background: genre===g ? 'rgba(0,181,173,0.15)' : '#1a1a1a',
            color: genre===g ? '#00B5AD' : '#9ca3af',
            borderColor: genre===g ? 'rgba(0,181,173,0.4)' : '#2a2a2a',
          }}>{g}</button>
        ))}
      </div>

      {/* ══ VIDEO ROWS ════════════════════════════════════════════════════════ */}
      <div style={{ padding:'0.5rem 0 2rem' }}>
        {ROWS.map(row => {
          const rowVideos = filtered.filter(row.filter).sort(row.sort).slice(0,12);
          if (!rowVideos.length) return null;
          return (
            <div key={row.key} style={{ padding:'1.5rem 4% 0.5rem' }}>
              <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'1rem', color: row.gold ? '#f59e0b' : '#e5e5e5', display:'flex', alignItems:'center', gap:'8px' }}>
                {row.emoji} {row.label}
              </div>
              <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
                {rowVideos.map((v, i) => (
                  <VideoCard key={v.id} video={v} index={i} onPlay={() => { setInfoVideo(v); setIsPlaying(true); setModalVisible(false); requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true))); history.replaceState(null, '', `${window.location.pathname}?v=${v.id}`); }} onInfo={() => openInfo(v)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ COMING-SOON MOVIES ════════════════════════════════════════════════ */}
      <div style={{ padding:'0 4% 4rem' }}>
        <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'1rem', color:'#e5e5e5', display:'flex', alignItems:'center', gap:'8px' }}>
          🎬 Кино & Баримтат кино
        </div>
        <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
          {MOVIE_PLACEHOLDERS.map((m, i) => (
            <div key={m.id} className="netflix-card" style={{ flexShrink:0, width:'280px', borderRadius:'10px', overflow:'hidden', background:'#1a1a1a' }}>
              <div style={{ width:'280px', height:'157px', background: GRADIENTS[i % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                <span style={{ fontSize:'3rem' }}>{m.emoji}</span>
                <span style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(239,68,68,0.85)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'0.8px' }}>УДАХГҮЙ</span>
              </div>
              <div style={{ padding:'10px 14px 14px', height:'54px', overflow:'hidden' }}>
                <p style={{ fontWeight:600, fontSize:'13px', color:'#9ca3af', lineHeight:1.45, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{m.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MORE INFO MODAL — Netflix-style slide-up drawer
          Single modal handles both "info" view and "player" view
      ══════════════════════════════════════════════════════════════════════ */}
      {infoVideo && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeInfo}
            style={{
              position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
              zIndex:9000, transition:'opacity 0.28s',
              opacity: modalVisible ? 1 : 0,
            }}
          />

          {/* Drawer */}
          <div style={{
            position:'fixed', bottom:0, left:'50%',
            transform: modalVisible
              ? 'translate(-50%, 0)'
              : 'translate(-50%, 100%)',
            transition:'transform 0.28s cubic-bezier(0.32,0,0.67,0)',
            width:'100%', maxWidth:'900px',
            maxHeight:'92vh', overflowY:'auto',
            background:'#181818', borderRadius:'8px 8px 0 0',
            zIndex:9001, scrollbarWidth:'none',
          }}>

            {/* ── TOP: Player or Blurred Hero ─────────────────────────────── */}
            <div style={{ position:'relative', width:'100%' }}>
              {isPlaying ? (
                /* ─ PLAYER MODE ─ */
                <div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
                  {infoVideo.youtube_id ? (
                    <iframe
                      src={ytSrc(infoVideo.youtube_id, true)}
                      title={infoVideo.title_mn}
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div style={{
                      position:'absolute', inset:0,
                      background: GRADIENTS[0],
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:'12px',
                    }}>
                      <div style={{ width:'80px', height:'80px', background:'rgba(0,181,173,0.2)', border:'2px solid rgba(0,181,173,0.4)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>▶</div>
                      <p style={{ color:'#9ca3af', fontSize:'14px' }}>Видео удахгүй нэмэгдэх болно</p>
                    </div>
                  )}
                  {/* Back to info button */}
                  <button
                    onClick={() => setIsPlaying(false)}
                    style={{
                      position:'absolute', top:'12px', left:'12px', zIndex:10,
                      background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.2)',
                      color:'#fff', borderRadius:'6px', padding:'6px 14px',
                      fontSize:'12px', fontWeight:600, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:'6px',
                    }}
                  >
                    ← Мэдээлэл рүү
                  </button>
                </div>
              ) : (
                /* ─ INFO HERO MODE: blurred thumbnail backdrop ─ */
                <div style={{ position:'relative', height:'42vh', minHeight:'280px', overflow:'hidden' }}>
                  {/* Blurred background */}
                  {getThumbHQ(infoVideo) ? (
                    <img
                      src={getThumbHQ(infoVideo)}
                      alt=""
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(2px) brightness(0.55)', transform:'scale(1.05)' }}
                    />
                  ) : (
                    <div style={{ position:'absolute', inset:0, background: GRADIENTS[0] }} />
                  )}
                  {/* Dark gradient overlay */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(24,24,24,0.95) 100%)' }} />

                  {/* Content centered */}
                  <div style={{ position:'absolute', bottom:'28px', left:'32px', right:'80px', zIndex:2 }}>
                    <p style={{ fontSize:'11px', fontWeight:700, color:'#00B5AD', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px' }}>
                      {infoVideo.category}
                    </p>
                    <h2 style={{ fontSize:'clamp(1.4rem, 3vw, 2rem)', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'10px', textShadow:'0 2px 16px rgba(0,0,0,0.8)' }}>
                      {infoVideo.title_mn}
                    </h2>
                    {/* Inline meta chips */}
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ background:'rgba(0,181,173,0.2)', border:'1px solid rgba(0,181,173,0.35)', color:'#00B5AD', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>
                        {infoVideo.duration_text}
                      </span>
                      <span style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>
                        {infoVideo.video_type === 'free' ? '🔓 Үнэгүй' : '🔐 Paid'}
                      </span>
                      {infoVideo.view_count > 0 && (
                        <span style={{ color:'#9ca3af', fontSize:'12px' }}>
                          {fmtViews(infoVideo.view_count)} үзсэн
                        </span>
                      )}
                      <span style={{ color:'#9ca3af', fontSize:'12px' }}>
                        {new Date(infoVideo.created_at).toLocaleDateString('mn-MN')}
                      </span>
                    </div>
                  </div>

                  {/* Play button overlay */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    style={{
                      position:'absolute', bottom:'28px', right:'32px', zIndex:2,
                      width:'56px', height:'56px', borderRadius:'50%',
                      background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.5)',
                      color:'#fff', fontSize:'22px', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      backdropFilter:'blur(4px)', transition:'background 0.15s',
                    }}
                    title="Тоглуулах"
                  >▶</button>
                </div>
              )}

              {/* Close button — always visible */}
              <button
                onClick={closeInfo}
                style={{
                  position:'absolute', top:'12px', right:'12px', zIndex:20,
                  width:'36px', height:'36px', borderRadius:'50%',
                  background:'rgba(24,24,24,0.9)', border:'1px solid rgba(255,255,255,0.2)',
                  color:'#e5e5e5', fontSize:'18px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >✕</button>
            </div>

            {/* ── ACTION ROW ──────────────────────────────────────────────── */}
            <div style={{ padding:'20px 32px 0', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
              {/* ҮЗЭХ — Play, inside same modal */}
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:'8px',
                  background:'#fff', color:'#141414',
                  padding:'10px 28px', borderRadius:'6px',
                  fontWeight:800, fontSize:'15px', border:'none', cursor:'pointer',
                  transition:'background 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                ҮЗЭХ
              </button>

              {/* + My List toggle */}
              <button
                onClick={() => toggleWatchlist(infoVideo.id)}
                title={watchlist.includes(infoVideo.id) ? 'Жагсаалтаас хасах' : 'Жагсаалтад нэмэх'}
                style={{
                  width:'42px', height:'42px', borderRadius:'50%',
                  background: watchlist.includes(infoVideo.id) ? 'rgba(0,181,173,0.2)' : 'rgba(255,255,255,0.1)',
                  border: watchlist.includes(infoVideo.id) ? '2px solid #00B5AD' : '2px solid rgba(255,255,255,0.4)',
                  color: watchlist.includes(infoVideo.id) ? '#00B5AD' : '#fff',
                  fontSize:'20px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.15s',
                }}
              >
                {watchlist.includes(infoVideo.id) ? '✓' : '+'}
              </button>

              {/* Match score chip */}
              <span style={{ marginLeft:'auto', fontSize:'13px', fontWeight:700, color:'#10b981' }}>
                98% Таалагдсан
              </span>

              {/* Share */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?v=${infoVideo.id}`;
                  navigator.clipboard?.writeText(url).catch(() => {});
                }}
                title="Холбоос хуулах"
                style={{
                  width:'42px', height:'42px', borderRadius:'50%',
                  background:'rgba(255,255,255,0.08)', border:'2px solid rgba(255,255,255,0.3)',
                  color:'#9ca3af', fontSize:'16px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >↗</button>
            </div>

            {/* ── DESCRIPTION ──────────────────────────────────────────────── */}
            {infoVideo.description_mn && (
              <p style={{ padding:'16px 32px 0', fontSize:'14px', color:'#cbd5e1', lineHeight:1.7, margin:0 }}>
                {infoVideo.description_mn}
              </p>
            )}

            {/* ── METADATA TAGS ROW ─────────────────────────────────────────── */}
            <div style={{ padding:'14px 32px 0', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'12px', color:'#9ca3af' }}>Ангилал:</span>
              <span style={{
                background:'rgba(0,181,173,0.12)', color:'#00B5AD',
                border:'1px solid rgba(0,181,173,0.25)', fontSize:'12px', fontWeight:600,
                padding:'3px 10px', borderRadius:'4px',
              }}>{infoVideo.category}</span>
              <span style={{ fontSize:'12px', color:'#9ca3af', marginLeft:'8px' }}>Үргэлжлэх хугацаа:</span>
              <span style={{ fontSize:'12px', color:'#e5e5e5', fontWeight:600 }}>{infoVideo.duration_text}</span>
            </div>

            {/* ── RELATED VIDEOS ────────────────────────────────────────────── */}
            <RelatedRow current={infoVideo} all={displayVideos} onPlay={(v) => { setInfoVideo(v); setIsPlaying(true); }} onInfo={(v) => { setIsPlaying(false); setInfoVideo(v); history.replaceState(null, '', `${window.location.pathname}?v=${v.id}`); }} locale={locale} />

            {/* Bottom safe area */}
            <div style={{ height:'32px' }} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── VideoCard — netflix-card (same as homepage) ──────────────────────────────

function VideoCard({ video, index, onPlay, onInfo }: {
  video: AnyVideo; index: number;
  onPlay: () => void; onInfo: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const thumb = getThumb(video);

  return (
    <div
      className="netflix-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flexShrink:0, width:'280px', borderRadius:'10px', overflow:'hidden', background:'#1a1a1a', position:'relative', cursor:'pointer' }}
    >
      <div
        onClick={onPlay}
        style={{ width:'280px', height:'157px', background: GRADIENTS[index % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}
      >
        {thumb
          ? <img src={thumb} alt={video.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
          : <span style={{ fontSize:'3rem' }}>🎬</span>
        }
        {/* Category badge */}
        <span style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'0.8px' }}>
          {video.category.split(' & ')[0]}
        </span>
        {/* Duration badge */}
        <span style={{ position:'absolute', bottom:'10px', right:'10px', background:'#00B5AD', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>
          {video.duration_text}
        </span>
        {/* Play overlay on hover */}
        {hovered && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
            <div style={{ width:'44px', height:'44px', background:'#00B5AD', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'#fff' }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding:'10px 14px 2px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
        <p
          onClick={onPlay}
          style={{ fontWeight:600, fontSize:'13px', color:'#e5e5e5', lineHeight:1.45, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', flex:1 }}
        >
          {video.title_mn}
        </p>
        {/* ⓘ More Info button */}
        <button
          onClick={onInfo}
          title="Дэлгэрэнгүй"
          style={{
            flexShrink:0, width:'24px', height:'24px', borderRadius:'50%',
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)',
            color:'#9ca3af', fontSize:'13px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginTop:'2px',
          }}
        >ⓘ</button>
      </div>
      <div style={{ height:'10px' }} />
    </div>
  );
}

// ─── RelatedRow (inside More Info modal) ─────────────────────────────────────

function RelatedRow({ current, all, onPlay, onInfo, locale }: {
  current: AnyVideo; all: AnyVideo[];
  onPlay: (v: AnyVideo) => void;
  onInfo: (v: AnyVideo) => void;
  locale: string;
}) {
  const related = all.filter(v => v.id !== current.id && v.category === current.category).slice(0, 8);
  void locale;
  if (!related.length) return null;
  return (
    <div style={{ padding:'24px 32px 0' }}>
      <div style={{ fontSize:'14px', fontWeight:700, color:'#e5e5e5', marginBottom:'12px' }}>
        Төстэй видеонууд
      </div>
      <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
        {related.map((v, i) => {
          const thumb = getThumb(v);
          return (
            <div key={v.id} style={{ flexShrink:0, width:'200px', borderRadius:'8px', overflow:'hidden', background:'#222', cursor:'pointer' }}>
              <div
                onClick={() => onPlay(v)}
                style={{ width:'200px', height:'113px', background: GRADIENTS[i % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}
              >
                {thumb
                  ? <img src={thumb} alt={v.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                  : <span style={{ fontSize:'2rem' }}>🎬</span>
                }
                <span style={{ position:'absolute', bottom:'5px', right:'6px', background:'rgba(0,0,0,0.8)', color:'#e5e5e5', fontSize:'9px', padding:'1px 6px', borderRadius:'2px', fontWeight:600 }}>{v.duration_text}</span>
              </div>
              <div style={{ padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'6px' }}>
                <p
                  onClick={() => onPlay(v)}
                  style={{ fontWeight:600, fontSize:'11px', color:'#e5e5e5', lineHeight:1.35, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', flex:1 }}
                >
                  {v.title_mn}
                </p>
                <button onClick={() => onInfo(v)} style={{ flexShrink:0, background:'none', border:'none', color:'#6b7280', fontSize:'12px', cursor:'pointer', padding:'0', marginTop:'1px' }}>ⓘ</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
