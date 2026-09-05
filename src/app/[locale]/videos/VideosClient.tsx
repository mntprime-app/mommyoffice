'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Video } from './page';

// ─── types ───────────────────────────────────────────────────────────────────

type AnyVideo = Video;
type RatingType = 'up' | 'down' | 'super';

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
  return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&enablejsapi=1&origin=https://mommyoffice.com`;
}

/** Match % using the weighted algorithm. Returns null if < 10 total votes. */
function matchDisplay(v: AnyVideo): { label: string; color: string } {
  const up  = v.upvotes_count    ?? 0;
  const dn  = v.downvotes_count  ?? 0;
  const sup = v.super_likes_count ?? 0;
  const total = up + dn + sup;
  if (total < 10) {
    return sup > 0 || up > 2
      ? { label: 'Өндөр үнэлгээтэй', color: '#10b981' }
      : { label: 'Шинэ',             color: '#9ca3af' };
  }
  const pct   = Math.round((up + 1.5 * sup) / total * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return { label: `${pct}% Таалагдсан`, color };
}

// ─── gradients ───────────────────────────────────────────────────────────────

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
  { id:'ph1',  title_mn:'Бизнес эхлүүлэх 5 алхам',          title_en:null, slug:'biznes-ehluureh-5-alkham', description_mn:'Монголын бизнес орчинд амжилттай ажил хэрэг эхлүүлэх бодит алхмуудыг хуваалцана.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'45 мин', category:'Бизнес & Санхүү',              view_count:12400, is_featured:true,  placement:'hero',   video_type:'free', created_at:'2026-08-20T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph2',  title_mn:'Санхүүгийн чөлөөт байдал',         title_en:null, slug:null, description_mn:'Орлогын олон эх үүсвэр байгуулах, идэвхгүй орлого бий болгох аргачлал.',               description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'52 мин', category:'Бизнес & Санхүү',              view_count:21000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-18T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph3',  title_mn:'Эмэгтэй CEO-уудтай яриа',          title_en:null, slug:null, description_mn:'Монгол эмэгтэй удирдагчдын амжилтын түүх, бизнесийн нууц болон бодит зөвлөгөө.',     description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'47 мин', category:'Бизнес & Санхүү',              view_count:18000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-15T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph4',  title_mn:'Онлайн бизнес 2026',               title_en:null, slug:null, description_mn:'Онлайн платформоор бизнес хэрхэн байгуулах, цахим орчинд брэнд үүсгэх аргачлал.',   description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'55 мин', category:'Бизнес & Санхүү',              view_count:24000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-10T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph5',  title_mn:'Хоолны дэглэм — бодит хандлага',  title_en:null, slug:null, description_mn:'Эмэгтэйчүүдэд тохирсон эрүүл хоолны дэглэм, хоол тэжээлийн зөв ойлголт.',          description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'32 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:8100,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-19T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph6',  title_mn:'Арьс, үсний арчилгаа',             title_en:null, slug:null, description_mn:'Монгол орны уур амьсгалд тохирсон арьс, үсний арчилгааны бодит арга зам.',          description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'19 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:15000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-17T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph7',  title_mn:'Стресс менежмент',                 title_en:null, slug:null, description_mn:'Өдөр тутмын стрессийг удирдах, сэтгэл зүйн тэнцвэрийг хадгалах практик аргууд.',    description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'33 мин', category:'Эрүүл мэнд & Гоо сайхан',    view_count:13000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-12T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph8',  title_mn:'Хүүхдийн хүмүүжлийн арга',        title_en:null, slug:null, description_mn:'Эерэг хүмүүжлийн зарчим, хүүхдийг сайн хүн болгоход чиглэсэн практик зөвлөгөө.',    description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'28 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:6700,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-16T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph9',  title_mn:'Хүүхэдтэй харилцах ур чадвар',    title_en:null, slug:null, description_mn:'Ялгаатай насны хүүхэдтэй хэрхэн харилцах, итгэлцэл бий болгох аргачлал.',            description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'41 мин', category:'Хүүхдийн хүмүүжил & Гэр бүл', view_count:11000, is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-14T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph10', title_mn:'Өдрийн хуваарь зохион байгуулах', title_en:null, slug:null, description_mn:'Цагаа зөв хуваарилах, бүтээлч байдлаа нэмэгдүүлэх, productivity дээшлүүлэх систем.',  description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'26 мин', category:'Хувийн хөгжил & Карьер',       view_count:8900,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-13T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph11', title_mn:'Ажил карьер ба гэр бүл',          title_en:null, slug:null, description_mn:'Карьер болон гэр бүлийн амьдралыг хэрхэн тэнцвэртэй авч явах вэ — бодит туршлагаас.', description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'38 мин', category:'Хувийн хөгжил & Карьер',       view_count:9300,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-11T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph12', title_mn:'Гэрийн цэвэрлэгээний систем',     title_en:null, slug:null, description_mn:'Гэрийг цэвэрхэн, эмх цэгцтэй байлгах системчилсэн арга, хугацаа хэмнэх зөвлөгөө.',   description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'21 мин', category:'Гэрийн менежмент & Лайфстайл',  view_count:4200,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-09T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
  { id:'ph13', title_mn:'Гэрийн цэсний 7 хоног',           title_en:null, slug:null, description_mn:'7 хоногийн хоолны цэс гаргах, хүнсний зардлаа хэмнэх практик удирдамж.',             description_en:null, youtube_id:null, cloudflare_stream_id:null, thumbnail_url:null, duration_text:'16 мин', category:'Гэрийн менежмент & Лайфстайл',  view_count:3800,  is_featured:false, placement:'normal', video_type:'free', created_at:'2026-08-08T00:00:00Z', upvotes_count:0, downvotes_count:0, super_likes_count:0 },
];

// ─── rows ─────────────────────────────────────────────────────────────────────

const GENRE_LABELS = [
  'Бүгд', 'Амжилтын эзэд', 'Бизнес & Санхүү', 'Эрүүл мэнд & Гоо сайхан',
  'Хүүхдийн хүмүүжил & Гэр бүл', 'Хувийн хөгжил & Карьер',
  'Гэрийн менежмент & Лайфстайл',
];

type Row = {
  key: string; emoji: string; label: string; gold?: boolean;
  filter: (v: AnyVideo) => boolean;
  sort: (a: AnyVideo, b: AnyVideo) => number;
};
const ROWS: Row[] = [
  { key:'new',     emoji:'🔥', label:'Шинээр нэмэгдсэн',                         filter:()=>true,                                           sort:(a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime() },
  { key:'top',     emoji:'⭐', label:'Санал болгох',                              filter:()=>true,                                           sort:(a,b)=>b.view_count-a.view_count },
  { key:'ezed',    emoji:'🏆', label:'Амжилтын эзэд',              gold:true,    filter:(v)=>v.category==='Амжилтын эзэд',                 sort:(a,b)=>b.view_count-a.view_count },
  { key:'money',   emoji:'💰', label:'MoneyCorner — Бизнес & Санхүү', gold:true, filter:(v)=>v.category==='Бизнес & Санхүү',               sort:(a,b)=>b.view_count-a.view_count },
  { key:'health', emoji:'💆‍♀️', label:'Эрүүл мэнд & Гоо сайхан',                filter:(v)=>v.category==='Эрүүл мэнд & Гоо сайхан',    sort:(a,b)=>b.view_count-a.view_count },
  { key:'family', emoji:'👨‍👩‍👧', label:'Хүүхдийн хүмүүжил & Гэр бүл',          filter:(v)=>v.category==='Хүүхдийн хүмүүжил & Гэр бүл',sort:(a,b)=>b.view_count-a.view_count },
  { key:'growth', emoji:'🚀', label:'Хувийн хөгжил & Карьер',                   filter:(v)=>v.category==='Хувийн хөгжил & Карьер',      sort:(a,b)=>b.view_count-a.view_count },
  { key:'home',   emoji:'🏠', label:'Гэрийн менежмент & Лайфстайл',             filter:(v)=>v.category==='Гэрийн менежмент & Лайфстайл',sort:(a,b)=>b.view_count-a.view_count },
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
  const [genre, setGenre]           = useState('Бүгд');
  const [infoVideo, setInfoVideo]   = useState<AnyVideo | null>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [watchlist, setWatchlist]   = useState<string[]>([]);
  const [heroVideoActive, setHeroVideoActive] = useState(false);
  const [heroMuted, setHeroMuted]             = useState(true);

  // ── Rating state ─────────────────────────────────────────────────────────
  // Map: video_id → user's current rating type (loaded from DB)
  const [userRatingMap, setUserRatingMap] = useState<Record<string, RatingType>>({});
  // Guest gate: shown when unauthed user tries to rate
  const [guestGate, setGuestGate]   = useState(false);
  // Post-watch prompt: shown after video ends / 90% completion
  const [ratingPrompt, setRatingPrompt] = useState<AnyVideo | null>(null);
  const [promptDismissed, setPromptDismissed] = useState<Record<string, boolean>>({});

  const savedScrollY = useRef(0);

  const displayVideos: AnyVideo[] = videos.length > 0 ? videos : PH;
  const filtered = genre === 'Бүгд' ? displayVideos : displayVideos.filter(v => v.category === genre);
  const hero = displayVideos.find(v => v.is_featured) ?? displayVideos[0] ?? null;

  // ── Hydrate localStorage ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const wl = localStorage.getItem('mo_watchlist');
      if (wl) setWatchlist(JSON.parse(wl));
    } catch {}
  }, []);

  // ── Hero auto-play: start muted video after 4s ────────────────────────────
  useEffect(() => {
    if (!hero?.youtube_id) return;
    setHeroVideoActive(false);
    const t = setTimeout(() => setHeroVideoActive(true), 4000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero?.id]);

  // ── URL deep-link ─────────────────────────────────────────────────────────
  useEffect(() => {
    const vId = new URLSearchParams(window.location.search).get('v');
    if (vId) {
      const found = displayVideos.find(v => v.id === vId || v.slug === vId);
      if (found) { savedScrollY.current = 0; openInfoRaw(found); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load user's existing ratings when modal opens ─────────────────────────
  useEffect(() => {
    if (!infoVideo) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('mo_video_ratings')
        .select('video_id, rating_type')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!data) return;
          const map: Record<string, RatingType> = {};
          data.forEach(r => { map[r.video_id] = r.rating_type as RatingType; });
          setUserRatingMap(map);
        });
    });
  }, [infoVideo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── YouTube postMessage: detect video end ─────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !infoVideo) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // YouTube fires { event: 'onStateChange', info: 0 } when video ends
        if (data?.event === 'onStateChange' && data?.info === 0) {
          if (!promptDismissed[infoVideo.id]) setRatingPrompt(infoVideo);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isPlaying, infoVideo, promptDismissed]);

  // ── 90% completion timer for placeholder / no-youtube videos ─────────────
  useEffect(() => {
    if (!isPlaying || !infoVideo || infoVideo.youtube_id) return;
    const match = infoVideo.duration_text.match(/(\d+)/);
    const mins = match ? parseInt(match[1]) : 30;
    // Show prompt at 90% of video duration (capped at 8s in dev/placeholder mode)
    const ms = Math.min(mins * 60 * 0.9 * 1000, 8000);
    const t = setTimeout(() => {
      if (!promptDismissed[infoVideo.id]) setRatingPrompt(infoVideo);
    }, ms);
    return () => clearTimeout(t);
  }, [isPlaying, infoVideo, promptDismissed]);

  // ── ESC ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (guestGate)  { setGuestGate(false); return; }
        if (ratingPrompt) { setRatingPrompt(null); return; }
        closeInfo();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────────────────────────────────────────────

  function openInfoRaw(video: AnyVideo) {
    setInfoVideo(video);
    setIsPlaying(false);
    setModalVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  }
  function openInfo(video: AnyVideo) {
    savedScrollY.current = window.scrollY;
    openInfoRaw(video);
    history.replaceState(null, '', `${window.location.pathname}?v=${video.id}`);
  }
  function openPlayer(video: AnyVideo) {
    savedScrollY.current = window.scrollY;
    setInfoVideo(video);
    setIsPlaying(true);
    setModalVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
    history.replaceState(null, '', `${window.location.pathname}?v=${video.id}`);
  }
  const closeInfo = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => {
      setInfoVideo(null);
      setIsPlaying(false);
      history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: savedScrollY.current, behavior: 'instant' });
    }, 280);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Rating helpers
  // ─────────────────────────────────────────────────────────────────────────

  async function handleRate(video: AnyVideo, type: RatingType) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGuestGate(true); return; }

    // Optimistic toggle: clicking same type removes the rating
    const prev = userRatingMap[video.id];
    if (prev === type) {
      setUserRatingMap(m => { const n = {...m}; delete n[video.id]; return n; });
      await supabase.from('mo_video_ratings').delete()
        .eq('user_id', user.id).eq('video_id', video.id);
    } else {
      setUserRatingMap(m => ({ ...m, [video.id]: type }));
      await supabase.from('mo_video_ratings').upsert(
        { user_id: user.id, video_id: video.id, rating_type: type },
        { onConflict: 'user_id,video_id' }
      );
    }
    // Dismiss post-watch prompt after rating
    setPromptDismissed(d => ({ ...d, [video.id]: true }));
    setRatingPrompt(null);
  }

  function toggleWatchlist(id: string) {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('mo_watchlist', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background:'#141414', minHeight:'100vh', color:'#e5e5e5', overflowX:'hidden' }}>

      {/* ══ HERO — Floating Netflix Card ══════════════════════════════════════ */}
      <div style={{ background:'#141414' }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'12px 2rem 0' }}>
        <section style={{ position:'relative', width:'100%', aspectRatio:'16/9', maxHeight:'68vh', overflow:'hidden', background:'#000', borderRadius:'24px' }}>

          {/* ── Background: crisp thumbnail ── */}
          {hero && getThumbHQ(hero) && !heroVideoActive && (
            <img src={getThumbHQ(hero)} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
          )}

          {/* ── Auto-play muted YouTube video after 4s ── */}
          {hero?.youtube_id && heroVideoActive && (
            <>
              {getThumbHQ(hero) && (
                <img src={getThumbHQ(hero)} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
              )}
              <iframe
                key={`hero-${hero.id}`}
                src={`https://www.youtube.com/embed/${hero.youtube_id}?autoplay=1&mute=${heroMuted?1:0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${hero.youtube_id}&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                allow="autoplay; fullscreen"
              />
            </>
          )}

          {/* ── Fallback: no thumbnail ── */}
          {(!hero || !getThumbHQ(hero)) && (
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #0a2744 70%, #061428 100%)' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(ellipse at 75% 35%, rgba(0,181,173,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 75%, rgba(255,217,61,0.06) 0%, transparent 45%)` }} />
            </div>
          )}

          {/* ── Streaming-standard asymmetric mask: darkens LEFT text zone only, right stays bright ── */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 55%, transparent 72%)' }} />
          {/* Thin bottom vignette for button row */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'18%', background:'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)' }} />

          {/* ── TOP-LEFT: brand badge ── */}
          <div style={{ position:'absolute', top:'24px', left:'24px', zIndex:5, display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(0,181,173,0.18)', border:'1px solid rgba(0,181,173,0.45)', color:'#00B5AD', padding:'4px 12px', borderRadius:'4px', fontSize:'10px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', backdropFilter:'blur(6px)' }}>
            🎬 КИНО & ВИДЕО
          </div>

          {/* ── TOP-RIGHT: mute / unmute button ── */}
          <button
            onClick={() => setHeroMuted(m => !m)}
            style={{ position:'absolute', top:'24px', right:'24px', width:'42px', height:'42px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.6)', background:'rgba(0,0,0,0.4)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5, backdropFilter:'blur(8px)' }}
            title={heroMuted ? 'Дуу нэмэх' : 'Дуу хаах'}
          >
            {heroMuted
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            }
          </button>

          {/* ── BOTTOM-LEFT: title + tags + action buttons ── */}
          <div style={{ position:'absolute', bottom:'32px', left:'32px', maxWidth:'560px', zIndex:2 }}>
            <h1 style={{ fontSize:'clamp(1.6rem, 3vw, 2.6rem)', fontWeight:800, lineHeight:1.15, color:'#fff', marginBottom:'0.5rem', letterSpacing:'-0.5px', textShadow:'0 4px 12px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.7)' }}>
              {hero?.title_mn ?? 'Кино & Видео'}
            </h1>
            {/* Tags row: Category • Duration • Type */}
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'0.75rem', fontSize:'13px', fontWeight:600, color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,0.9)' }}>
              <span>{hero?.category ?? 'Платформ'}</span>
              {hero?.duration_text && <><span style={{ color:'rgba(255,255,255,0.5)' }}>•</span><span>{hero.duration_text}</span></>}
              <span style={{ color:'rgba(255,255,255,0.5)' }}>•</span>
              <span>{hero?.video_type === 'paid' ? '🔒 Гишүүнчлэл' : '✓ Үнэгүй'}</span>
            </div>
            <p style={{ fontSize:'14px', color:'#fff', lineHeight:1.6, marginBottom:'1.25rem', maxWidth:'440px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', textShadow:'0 2px 8px rgba(0,0,0,0.9)' }}>
              {hero?.description_mn ?? 'Монгол эмэгтэйчүүдэд зориулсан онлайн видео контентийн нэгдсэн платформ.'}
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <button onClick={() => hero && openPlayer(hero)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#fff', color:'#000', padding:'12px 30px', borderRadius:'8px', fontWeight:700, fontSize:'15px', border:'none', cursor:'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ҮЗЭХ
              </button>
              <button onClick={() => hero && openInfo(hero)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(109,109,110,0.45)', color:'#fff', padding:'12px 30px', borderRadius:'8px', fontWeight:700, fontSize:'15px', border:'none', cursor:'pointer', backdropFilter:'blur(8px)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> ДЭЛГЭРЭНГҮЙ
              </button>
            </div>
          </div>

          {/* ── BOTTOM-RIGHT: "Шинээр нэмэгдсэн" badge ── */}
          {hero && (
            <div style={{ position:'absolute', bottom:'32px', right:'24px', zIndex:2, display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.2)', color:'#e5e5e5', padding:'6px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:600, backdropFilter:'blur(8px)' }}>
              🆕 Шинээр нэмэгдсэн
            </div>
          )}
        </section>
        </div>
      </div>

      {/* ══ GENRE PILLS ═══════════════════════════════════════════════════════ */}
      <div style={{ borderBottom:'1px solid #1f1f1f', position:'relative', zIndex:3 }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'1.25rem 2rem', display:'flex', gap:'8px', overflowX:'auto', scrollbarWidth:'none' }}>
          {GENRE_LABELS.map(g => (
            <button key={g} onClick={() => setGenre(g)} style={{ flexShrink:0, padding:'7px 18px', borderRadius:'20px', fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1px solid', transition:'all 0.15s', background: genre===g ? 'rgba(0,181,173,0.15)' : '#1a1a1a', color: genre===g ? '#00B5AD' : '#9ca3af', borderColor: genre===g ? 'rgba(0,181,173,0.4)' : '#2a2a2a' }}>{g}</button>
          ))}
        </div>
      </div>

      {/* ══ VIDEO ROWS ════════════════════════════════════════════════════════ */}
      <div style={{ padding:'0.5rem 0 2rem' }}>
        {ROWS.map(row => {
          const rowVideos = filtered.filter(row.filter).sort(row.sort).slice(0,12);
          if (!rowVideos.length) return null;
          return (
            <div key={row.key} style={{ maxWidth:'1400px', margin:'0 auto', padding:'1.5rem 2rem 0.5rem' }}>
              <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'1rem', color: row.gold ? '#f59e0b' : '#e5e5e5', display:'flex', alignItems:'center', gap:'8px' }}>{row.emoji} {row.label}</div>
              <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
                {rowVideos.map((v, i) => (
                  <VideoCard key={v.id} video={v} index={i} onPlay={() => openPlayer(v)} onInfo={() => openInfo(v)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ COMING SOON: MOVIES ═══════════════════════════════════════════════ */}
      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 2rem 4rem' }}>
        <div style={{ fontSize:'16px', fontWeight:700, marginBottom:'1rem', color:'#e5e5e5', display:'flex', alignItems:'center', gap:'8px' }}>🎬 Кино & Баримтат кино</div>
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
          MORE INFO / PLAYER MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {infoVideo && (
        <>
          <div onClick={closeInfo} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9000, transition:'opacity 0.28s', opacity: modalVisible ? 1 : 0 }} />

          <div style={{ position:'fixed', bottom:0, left:'50%', transform: modalVisible ? 'translate(-50%, 0)' : 'translate(-50%, 100%)', transition:'transform 0.28s cubic-bezier(0.32,0,0.67,0)', width:'100%', maxWidth:'900px', maxHeight:'92vh', overflowY:'auto', background:'#181818', borderRadius:'8px 8px 0 0', zIndex:9001, scrollbarWidth:'none' }}>

            {/* ── TOP: Player or Blurred Hero ─────────────────────────────── */}
            {isPlaying ? (
              <div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
                {infoVideo.youtube_id ? (
                  <iframe src={ytSrc(infoVideo.youtube_id, true)} title={infoVideo.title_mn}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <div style={{ position:'absolute', inset:0, background: GRADIENTS[0], display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                    <div style={{ width:'80px', height:'80px', background:'rgba(0,181,173,0.2)', border:'2px solid rgba(0,181,173,0.4)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>▶</div>
                    <p style={{ color:'#9ca3af', fontSize:'14px' }}>Видео удахгүй нэмэгдэх болно</p>
                  </div>
                )}
                <button onClick={() => setIsPlaying(false)} style={{ position:'absolute', top:'12px', left:'12px', zIndex:10, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                  ← Мэдээлэл рүү
                </button>
              </div>
            ) : (
              <div style={{ position:'relative', height:'42vh', minHeight:'280px', overflow:'hidden' }}>
                {getThumbHQ(infoVideo)
                  ? <img src={getThumbHQ(infoVideo)} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(2px) brightness(0.55)', transform:'scale(1.05)' }} />
                  : <div style={{ position:'absolute', inset:0, background: GRADIENTS[0] }} />
                }
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(24,24,24,0.95) 100%)' }} />

                <div style={{ position:'absolute', bottom:'28px', left:'32px', right:'80px', zIndex:2 }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'#00B5AD', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px' }}>{infoVideo.category}</p>
                  <h2 style={{ fontSize:'clamp(1.4rem, 3vw, 2rem)', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'10px', textShadow:'0 2px 16px rgba(0,0,0,0.8)' }}>{infoVideo.title_mn}</h2>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ background:'rgba(0,181,173,0.2)', border:'1px solid rgba(0,181,173,0.35)', color:'#00B5AD', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>{infoVideo.duration_text}</span>
                    <span style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>{infoVideo.video_type==='free' ? '🔓 Үнэгүй' : '🔐 Paid'}</span>
                    {infoVideo.view_count > 0 && <span style={{ color:'#9ca3af', fontSize:'12px' }}>{fmtViews(infoVideo.view_count)} үзсэн</span>}
                    {/* Dynamic match % */}
                    {(() => { const m = matchDisplay(infoVideo); return <span style={{ fontSize:'12px', fontWeight:700, color: m.color }}>{m.label}</span>; })()}
                  </div>
                </div>

                <button onClick={() => setIsPlaying(true)} style={{ position:'absolute', bottom:'28px', right:'32px', zIndex:2, width:'56px', height:'56px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.5)', color:'#fff', fontSize:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>▶</button>
              </div>
            )}

            {/* Close button — always visible */}
            <button onClick={closeInfo} style={{ position:'absolute', top:'12px', right:'12px', zIndex:20, width:'36px', height:'36px', borderRadius:'50%', background:'rgba(24,24,24,0.9)', border:'1px solid rgba(255,255,255,0.2)', color:'#e5e5e5', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

            {/* ── ACTION ROW ──────────────────────────────────────────────── */}
            <div style={{ padding:'20px 32px 0', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
              {/* Play */}
              <button onClick={() => setIsPlaying(true)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#fff', color:'#141414', padding:'10px 28px', borderRadius:'6px', fontWeight:800, fontSize:'15px', border:'none', cursor:'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ҮЗЭХ
              </button>

              {/* My List */}
              <button onClick={() => toggleWatchlist(infoVideo.id)} title={watchlist.includes(infoVideo.id) ? 'Жагсаалтаас хасах' : 'Жагсаалтад нэмэх'} style={{ width:'42px', height:'42px', borderRadius:'50%', background: watchlist.includes(infoVideo.id) ? 'rgba(0,181,173,0.2)' : 'rgba(255,255,255,0.1)', border: watchlist.includes(infoVideo.id) ? '2px solid #00B5AD' : '2px solid rgba(255,255,255,0.4)', color: watchlist.includes(infoVideo.id) ? '#00B5AD' : '#fff', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                {watchlist.includes(infoVideo.id) ? '✓' : '+'}
              </button>

              {/* ── Rating buttons (🔥 👍 👎) ───────────────────────────── */}
              <div style={{ display:'flex', gap:'6px', alignItems:'center', marginLeft:'4px' }}>
                {(['super','up','down'] as RatingType[]).map(type => {
                  const active = userRatingMap[infoVideo.id] === type;
                  const emoji  = type==='super' ? '🔥' : type==='up' ? '👍' : '👎';
                  const tip    = type==='super' ? 'Маш их таалагдсан' : type==='up' ? 'Таалагдсан' : 'Таалагддаггүй';
                  return (
                    <button key={type} onClick={() => handleRate(infoVideo, type)} title={tip} style={{ width:'40px', height:'40px', borderRadius:'50%', background: active ? 'rgba(0,181,173,0.2)' : 'rgba(255,255,255,0.07)', border: active ? '2px solid #00B5AD' : '2px solid rgba(255,255,255,0.2)', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', transform: active ? 'scale(1.15)' : 'scale(1)' }}>
                      {emoji}
                    </button>
                  );
                })}
              </div>

              {/* Match % */}
              {(() => { const m = matchDisplay(infoVideo); return <span style={{ marginLeft:'auto', fontSize:'13px', fontWeight:700, color: m.color }}>{m.label}</span>; })()}

              {/* Share */}
              <button onClick={() => { const url = `${window.location.origin}${window.location.pathname}?v=${infoVideo.id}`; navigator.clipboard?.writeText(url).catch(()=>{}); }} title="Холбоос хуулах" style={{ width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'2px solid rgba(255,255,255,0.3)', color:'#9ca3af', fontSize:'16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↗</button>
            </div>

            {/* ── DESCRIPTION ──────────────────────────────────────────────── */}
            {infoVideo.description_mn && (
              <p style={{ padding:'16px 32px 0', fontSize:'14px', color:'#cbd5e1', lineHeight:1.7, margin:0 }}>{infoVideo.description_mn}</p>
            )}

            {/* ── METADATA TAGS ─────────────────────────────────────────────── */}
            <div style={{ padding:'14px 32px 0', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'12px', color:'#9ca3af' }}>Ангилал:</span>
              <span style={{ background:'rgba(0,181,173,0.12)', color:'#00B5AD', border:'1px solid rgba(0,181,173,0.25)', fontSize:'12px', fontWeight:600, padding:'3px 10px', borderRadius:'4px' }}>{infoVideo.category}</span>
              <span style={{ fontSize:'12px', color:'#9ca3af', marginLeft:'8px' }}>Үргэлжлэх хугацаа:</span>
              <span style={{ fontSize:'12px', color:'#e5e5e5', fontWeight:600 }}>{infoVideo.duration_text}</span>
              {/* Vote counts (only if votes exist) */}
              {(infoVideo.upvotes_count + infoVideo.downvotes_count + infoVideo.super_likes_count) > 0 && (
                <span style={{ fontSize:'12px', color:'#6b7280', marginLeft:'8px' }}>
                  🔥 {infoVideo.super_likes_count} &nbsp;👍 {infoVideo.upvotes_count} &nbsp;👎 {infoVideo.downvotes_count}
                </span>
              )}
            </div>

            {/* ── RELATED VIDEOS ─────────────────────────────────────────────── */}
            <RelatedRow current={infoVideo} all={displayVideos} onPlay={openPlayer} onInfo={openInfo} />

            <div style={{ height:'32px' }} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          POST-WATCH RATING PROMPT (bottom toast)
      ══════════════════════════════════════════════════════════════════════ */}
      {ratingPrompt && (
        <div style={{ position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', zIndex:10000, background:'#1f1f1f', border:'1px solid #333', borderRadius:'12px', padding:'14px 20px', display:'flex', alignItems:'center', gap:'14px', boxShadow:'0 8px 32px rgba(0,0,0,0.7)', minWidth:'320px', maxWidth:'480px', animation:'slideUp 0.25s ease' }}>
          <p style={{ fontSize:'14px', fontWeight:600, color:'#e5e5e5', margin:0, flex:1 }}>Танд энэ видео таалагдсан уу?</p>
          <div style={{ display:'flex', gap:'6px' }}>
            {(['super','up','down'] as RatingType[]).map(type => {
              const active = userRatingMap[ratingPrompt.id] === type;
              const emoji  = type==='super' ? '🔥' : type==='up' ? '👍' : '👎';
              return (
                <button key={type} onClick={() => handleRate(ratingPrompt, type)} style={{ width:'38px', height:'38px', borderRadius:'50%', background: active ? 'rgba(0,181,173,0.25)' : 'rgba(255,255,255,0.08)', border: active ? '2px solid #00B5AD' : '2px solid rgba(255,255,255,0.2)', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                  {emoji}
                </button>
              );
            })}
          </div>
          <button onClick={() => { setPromptDismissed(d => ({ ...d, [ratingPrompt.id]: true })); setRatingPrompt(null); }} style={{ background:'none', border:'none', color:'#6b7280', fontSize:'18px', cursor:'pointer', padding:'0 4px', flexShrink:0 }}>✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          GUEST GATE MINI-MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {guestGate && (
        <div onClick={() => setGuestGate(false)} style={{ position:'fixed', inset:0, zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'14px', padding:'2rem 2.5rem', maxWidth:'360px', width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔐</div>
            <h3 style={{ fontSize:'18px', fontWeight:700, color:'#fff', marginBottom:'0.5rem' }}>Үнэлгээ өгөх</h3>
            <p style={{ fontSize:'14px', color:'#9ca3af', marginBottom:'1.75rem', lineHeight:1.6 }}>Үнэлгээ өгөхийн тулд нэвтрэнэ үү.<br/>Нэвтэрсний дараа таны үнэлгээ хадгалагдана.</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <Link href={`/${locale}/auth/login`} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#00B5AD', color:'#fff', padding:'10px 24px', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize:'14px' }}>
                Нэвтрэх
              </Link>
              <button onClick={() => setGuestGate(false)} style={{ background:'#2a2a2a', color:'#9ca3af', border:'1px solid #333', padding:'10px 20px', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer' }}>
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({ video, index, onPlay, onInfo }: { video: AnyVideo; index: number; onPlay: () => void; onInfo: () => void; }) {
  const [hovered, setHovered] = useState(false);
  const thumb = getThumb(video);
  const match = matchDisplay(video);

  return (
    <div className="netflix-card" onClick={onInfo} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ flexShrink:0, width:'280px', borderRadius:'10px', overflow:'hidden', background:'#1a1a1a', position:'relative', cursor:'pointer' }}>
      <div style={{ width:'280px', height:'157px', background: GRADIENTS[index % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {thumb ? <img src={thumb} alt={video.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" /> : <span style={{ fontSize:'3rem' }}>🎬</span>}
        <span style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'0.8px' }}>{video.category.split(' & ')[0]}</span>
        <span style={{ position:'absolute', bottom:'10px', right:'10px', background:'#00B5AD', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'4px' }}>{video.duration_text}</span>
        {hovered && (
          <div onClick={(e) => { e.stopPropagation(); onPlay(); }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'44px', height:'44px', background:'#00B5AD', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'#fff' }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding:'10px 14px 4px' }}>
        <p style={{ fontWeight:600, fontSize:'13px', color:'#e5e5e5', lineHeight:1.45, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{video.title_mn}</p>
      </div>
      {/* Match % below title */}
      <div style={{ padding:'2px 14px 10px' }}>
        <span style={{ fontSize:'11px', fontWeight:600, color: match.color }}>{match.label}</span>
      </div>
    </div>
  );
}

// ─── RelatedRow ───────────────────────────────────────────────────────────────

function RelatedRow({ current, all, onPlay, onInfo }: { current: AnyVideo; all: AnyVideo[]; onPlay: (v: AnyVideo) => void; onInfo: (v: AnyVideo) => void; }) {
  const related = all.filter(v => v.id !== current.id && v.category === current.category).slice(0, 8);
  if (!related.length) return null;
  return (
    <div style={{ padding:'24px 32px 0' }}>
      <div style={{ fontSize:'14px', fontWeight:700, color:'#e5e5e5', marginBottom:'12px' }}>Төстэй видеонууд</div>
      <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' }}>
        {related.map((v, i) => {
          const thumb = getThumb(v);
          const match = matchDisplay(v);
          return (
            <div key={v.id} onClick={() => onInfo(v)} style={{ flexShrink:0, width:'200px', borderRadius:'8px', overflow:'hidden', background:'#222', cursor:'pointer' }}>
              <div style={{ width:'200px', height:'113px', background: GRADIENTS[i % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                {thumb ? <img src={thumb} alt={v.title_mn} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" /> : <span style={{ fontSize:'2rem' }}>🎬</span>}
                <span style={{ position:'absolute', bottom:'5px', right:'6px', background:'rgba(0,0,0,0.8)', color:'#e5e5e5', fontSize:'9px', padding:'1px 6px', borderRadius:'2px', fontWeight:600 }}>{v.duration_text}</span>
              </div>
              <div style={{ padding:'8px 10px' }}>
                <p style={{ fontWeight:600, fontSize:'11px', color:'#e5e5e5', lineHeight:1.35, margin:'0 0 3px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{v.title_mn}</p>
                <span style={{ fontSize:'10px', fontWeight:600, color: match.color }}>{match.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
