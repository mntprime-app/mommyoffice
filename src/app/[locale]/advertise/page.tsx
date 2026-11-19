import { getLocale }              from 'next-intl/server';
import { getSiteSettings }         from '@/app/actions/admin';
import AdvertiseContactForm        from '@/components/ui/AdvertiseContactForm';
import { CategoryBadge }           from '@/components/ui/CategoryBadge';
import UniversalHero               from '@/components/shared/UniversalHero';
import type { Metadata }           from 'next';

export const metadata: Metadata = {
  title: 'Сурталчилгаа байршуулах | MommyOffice',
  description:
    'MommyOffice платформд сурталчилгаа байршуулж, Монголын шийдвэр гаргагч эмэгтэйчүүдэд хүрнэ үү.',
};

// ─── Package design tokens (non-editable) ────────────────────────────────────
const PKG_DESIGN: Record<string, { color: string; glow: string; border: string }> = {
  gold:     { color: '#d4a017', glow: 'rgba(212,160,23,0.12)',  border: 'rgba(212,160,23,0.3)' },
  premium:  { color: '#00B5AD', glow: 'rgba(0,181,173,0.12)',   border: 'rgba(0,181,173,0.4)' },
  platinum: { color: '#a78bfa', glow: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
};

// ─── Package defaults ─────────────────────────────────────────────────────────
const DEFAULT_PACKAGES = [
  { id: 'gold',     name: 'GOLD',     badge: 'Эхлэх',               price: '₮950,000',   savings: '15% хэмнэлт', items: ['🏠 Hero баннер — 2 долоо хоног', '📄 C1 + V1 баннер — бүтэн сар', '🎬 1 Reel ҮНЭГҮЙ (₮500,000 үнэтэй)', '💸 Баннер үнэ ₮1,110,000'] },
  { id: 'premium',  name: 'PREMIUM',  badge: '⭐ Хамгийн алдартай', price: '₮2,000,000',  savings: '25% хэмнэлт', items: ['🏠 Hero баннер — бүтэн сар', '📄 A1 · A2 · A3 · AR1 · C1 баннер', '💥 POP-UP зар — 1 долоо хоног ҮНЭГҮЙ', '🎬 2 Reel ҮНЭГҮЙ', '💸 Баннер үнэ ₮2,660,000'] },
  { id: 'platinum', name: 'PLATINUM', badge: 'Максимум',             price: '₮2,800,000',  savings: '40% хэмнэлт', items: ['🏠 Hero баннер — бүтэн сар', '📄 Бүх 8 байршлын баннер (A1–V1)', '💥 POP-UP зар — 2 долоо хоног ҮНЭГҮЙ', '🎬 4 Reel ҮНЭГҮЙ', '✍️ 1 Брэндийн нийтлэл ҮНЭГҮЙ', '💸 Баннер үнэ ₮4,673,000'] },
];

// ─── Banner specs — 8 slots with codes and prices ────────────────────────────
const BANNER_SPECS = [
  { code: 'POP-UP', name: 'Поп-ап зар',           placement: 'Нүүр хуудас — дэлгэцийн дунд',      desktop: '800×400 px',  mobile: '800×400 px',  formats: 'JPG / PNG / GIF / MP4 · 2 MB',  price: '₮350,000',   priceSub: '/ 3 хоногийн блок' },
  { code: 'H1',     name: 'Hero баннер',            placement: 'Нүүр хуудас — hero хэсгийн доор',  desktop: '1336×120 px', mobile: '390×100 px',  formats: 'JPG / PNG / GIF / MP4 · 2 MB',  price: '₮700,000',   priceSub: '/ сар'              },
  { code: 'A1',     name: 'Нийтлэлийн баннер',      placement: 'Нийтлэлүүд — дундах баннер',        desktop: '728×90 px',   mobile: '390×100 px',  formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮450,000',   priceSub: '/ сар'              },
  { code: 'A2',     name: 'Нийтлэлийн sidebar',     placement: 'Нийтлэлүүд — sidebar (desktop)',   desktop: '300×250 px',  mobile: '—',           formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮380,000',   priceSub: '/ сар'              },
  { code: 'A3',     name: 'Нийтлэлийн footer',      placement: 'Нийтлэлүүд — footer баннер',        desktop: '970×90 px',   mobile: '390×100 px',  formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮350,000',   priceSub: '/ сар'              },
  { code: 'AR1',    name: 'Нийтлэлийн sidebar',     placement: 'Нийтлэл — sidebar (desktop+mob)',  desktop: '300×250 px',  mobile: '390×100 px',  formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮400,000',   priceSub: '/ сар'              },
  { code: 'C1',     name: 'Хичээлийн баннер',        placement: 'Хичээлүүд — хөндлөн баннер',        desktop: '1336×120 px', mobile: '390×100 px',  formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮380,000',   priceSub: '/ сар'              },
  { code: 'V1',     name: 'Видео баннер',            placement: 'Видеонүүд — хөндлөн баннер',        desktop: '1336×120 px', mobile: '390×100 px',  formats: 'JPG / PNG / GIF / WebP · 1 MB', price: '₮380,000',   priceSub: '/ сар'              },
];

const PILLAR_EMOJI = ['🏆', '🚀', '💚', '🏠', '💞', '🎨'];

function s(settings: Record<string, string>, key: string, fallback = '') {
  return settings[key] || fallback;
}

// ─── SVG wireframe mockup for each banner slot ────────────────────────────────
function SlotMockupSvg({ code }: { code: string }) {
  const W = 320, H = 180;
  const bg = '#070707', nav = '#111111', block = '#0d0d0d';
  const line = '#1a1a1a', line2 = '#141414';
  const tFill = 'rgba(0,181,173,0.16)', tStroke = '#00B5AD', tText = '#00B5AD';

  // Reusable nav bar
  const NavBar = () => (
    <>
      <rect width={W} height={20} fill={nav}/>
      <rect x="10" y="7" width="34" height="6" rx="2" fill={line}/>
      <rect x="216" y="8" width="22" height="4" rx="1" fill={line2}/>
      <rect x="242" y="8" width="22" height="4" rx="1" fill={line2}/>
      <rect x="268" y="8" width="42" height="4" rx="1" fill={line2}/>
    </>
  );
  // Reusable content lines
  const Lines = ({ x, y, w, n, gap = 7 }: { x:number; y:number; w:number; n:number; gap?:number }) => (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? Math.round(w * 0.65) : w} height="3" rx="1" fill={line}/>
      ))}
    </>
  );
  // Teal banner rect with label
  const Banner = ({ x, y, w, h, label }: { x:number; y:number; w:number; h:number; label:string }) => (
    <>
      <rect x={x} y={y} width={w} height={h} fill={tFill} stroke={tStroke} strokeWidth="1.5" rx="1"/>
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fill={tText} fontSize="6.5" fontFamily="monospace" fontWeight="700">{label}</text>
    </>
  );

  if (code === 'POP-UP') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <Lines x={12} y={26} w={180} n={5}/>
      {/* Dim overlay */}
      <rect width={W} height={H} fill="rgba(0,0,0,0.52)"/>
      {/* Popup box */}
      <rect x="68" y="38" width="184" height="104" rx="8" fill="#070f0e" stroke={tStroke} strokeWidth="1.5"/>
      <rect x="82" y="52" width="156" height="62" rx="3" fill={tFill}/>
      <text x="160" y="85" textAnchor="middle" fill={tText} fontSize="7.5" fontFamily="monospace" fontWeight="700">POP-UP</text>
      <text x="160" y="96" textAnchor="middle" fill={tText} fontSize="6" fontFamily="monospace">800 × 400 px</text>
      <text x="242" y="52" fill="#374151" fontSize="12" style={{ cursor: 'pointer' }}>✕</text>
      <rect x="104" y="128" width="112" height="10" rx="2" fill="rgba(0,181,173,0.2)" stroke={tStroke} strokeWidth="1"/>
      <text x="160" y="136" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="600">Дэлгэцийн дунд · гарах үед</text>
    </svg>
  );

  if (code === 'H1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      {/* Hero area */}
      <rect x="0" y="20" width={W} height="44" fill="#0c1a18"/>
      <rect x="12" y="30" width="90" height="8" rx="2" fill="#1a2e28"/>
      <rect x="12" y="41" width="65" height="5" rx="1" fill="#152420"/>
      <rect x="12" y="50" width="52" height="9" rx="2" fill="rgba(0,181,173,0.22)" stroke={tStroke} strokeWidth="1"/>
      {/* H1 banner */}
      <Banner x={0} y={64} w={W} h={18} label="H1  ·  1336 × 120 px"/>
      <Lines x={12} y={90} w={W - 24} n={3}/>
      {[0,1,2].map(i => (
        <rect key={i} x={10 + i * 103} y={114} width="97" height="52" rx="4" fill={block}/>
      ))}
    </svg>
  );

  if (code === 'A1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      {/* Article + sidebar layout */}
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="213" y="20" width="102" height="155" fill={block} opacity="0.25"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <rect x="10" y="36" width="95" height="4" rx="1" fill={line2}/>
      <Lines x={10} y={46} w={188} n={4}/>
      {/* A1 horizontal banner mid-article */}
      <Banner x={10} y={80} w={190} h={16} label="A1  ·  728 × 90 px"/>
      <Lines x={10} y={102} w={188} n={5}/>
      <rect x="216" y="26" width="96" height="62" rx="3" fill={block}/>
      <rect x="216" y="94" width="96" height="38" rx="3" fill={block}/>
    </svg>
  );

  if (code === 'A2') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={9}/>
      {/* A2 sidebar banner */}
      <Banner x={214} y={22} w={100} h={76} label={"A2 · 300×250"}/>
      <rect x="214" y="104" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="140" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="156" width="100" height="14" rx="2" fill="rgba(0,181,173,0.08)" stroke="rgba(0,181,173,0.2)" strokeWidth="1"/>
      <text x="264" y="166" textAnchor="middle" fill={tText} fontSize="5.5">Desktop only</text>
    </svg>
  );

  if (code === 'A3') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="130" fill={block} opacity="0.4"/>
      <rect x="213" y="20" width="102" height="130" fill={block} opacity="0.25"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={6}/>
      <rect x="216" y="26" width="96" height="56" rx="3" fill={block}/>
      <Lines x={10} y={100} w={188} n={3}/>
      {/* A3 article footer banner */}
      <Banner x={5} y={154} w={310} h={18} label="A3  ·  970 × 90 px"/>
    </svg>
  );

  if (code === 'AR1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <rect x="0" y="20" width="208" height="155" fill={block} opacity="0.4"/>
      <rect x="10" y="26" width="140" height="7" rx="2" fill={line}/>
      <Lines x={10} y={40} w={188} n={9}/>
      {/* AR1 sidebar — desktop + mobile */}
      <Banner x={214} y={22} w={100} h={76} label={"AR1 · 300×250"}/>
      <rect x="214" y="104" width="100" height="30" rx="3" fill={block}/>
      <rect x="214" y="140" width="100" height="14" rx="2" fill="rgba(0,181,173,0.1)" stroke={tStroke} strokeWidth="1"/>
      <text x="264" y="150" textAnchor="middle" fill={tText} fontSize="5.5" fontWeight="700">Desktop + Mobile</text>
      <Lines x={10} y={100} w={188} n={5}/>
    </svg>
  );

  if (code === 'C1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      {/* C1 banner right below nav */}
      <Banner x={0} y={20} w={W} h={18} label="C1  ·  1336 × 120 px"/>
      <rect x="10" y="45" width="96" height="6" rx="2" fill={line}/>
      <rect x="10" y="54" width="68" height="4" rx="1" fill={line2}/>
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x={10 + (i % 3) * 102} y={64 + Math.floor(i / 3) * 55} width="96" height="49" rx="4" fill={block}/>
      ))}
    </svg>
  );

  if (code === 'V1') return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      {/* V1 banner right below nav */}
      <Banner x={0} y={20} w={W} h={18} label="V1  ·  1336 × 120 px"/>
      <rect x="10" y="45" width="78" height="6" rx="2" fill={line}/>
      {[0,1,2,3].map(i => (
        <rect key={i} x={10 + (i % 2) * 156} y={58 + Math.floor(i / 2) * 54} width="150" height="48" rx="4" fill={block}/>
      ))}
      {[0,1,2,3].map(i => (
        <circle key={i} cx={85 + (i % 2) * 156} cy={82 + Math.floor(i / 2) * 54} r="10" fill="rgba(255,255,255,0.07)"/>
      ))}
    </svg>
  );

  // Fallback
  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width={W} height={H} fill={bg}/>
      <NavBar/>
      <text x="160" y="96" textAnchor="middle" fill="#374151" fontSize="14" fontFamily="monospace">{code}</text>
    </svg>
  );
}

export default async function AdvertisePage() {
  const locale   = await getLocale();
  const settings = await getSiteSettings();
  void locale;

  // ── Hero ──────────────────────────────────────────────────────────────────
  const email       = s(settings, 'advertise_contact_email', 'info.mommyoffice@gmail.com');
  const phone       = s(settings, 'advertise_contact_phone');
  const headline    = s(settings, 'advertise_hero_headline', 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул');
  const subtitle    = s(settings, 'advertise_hero_subtitle', '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессэжийг хүргэнэ үү.');
  const heroBg      = s(settings, 'advertise_hero_bg');
  const heroYtId    = s(settings, 'advertise_hero_youtube_id');
  const ctaText     = s(settings, 'advertise_hero_cta',  'Сурталчилгааны санал татаж авах');
  const ctaText2    = s(settings, 'advertise_hero_cta2', 'Захиалга өгөх');
  const mediakitUrl = s(settings, 'advertise_mediakit_url');

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statsImg   = s(settings, 'advertise_stats_image');
  const statsTitle = s(settings, 'advertise_stats_title', 'Манай платформын хүрэлцээ');
  const stats = [
    { value: s(settings, 'advertise_stat_1_value', '88.8%'), label: s(settings, 'advertise_stat_1_label', 'Эмэгтэй үзэгч') },
    { value: s(settings, 'advertise_stat_2_value', '31K+'),  label: s(settings, 'advertise_stat_2_label', 'Нийт дагагч') },
    { value: s(settings, 'advertise_stat_3_value', '50K+'),  label: s(settings, 'advertise_stat_3_label', 'Сарын хүрэлцээ') },
  ];

  // ── Why ───────────────────────────────────────────────────────────────────
  const whyTitle = s(settings, 'advertise_why_title', 'Яагаад MommyOffice-д сурталчлах вэ?');
  const whyText  = s(settings, 'advertise_why_text', 'Монголын өрхийн худалдан авалтын шийдвэрийг гаргадаг 25–44 насны эмэгтэйчүүд бидний гол үзэгчид. Брэндийнхаа мессэжийг зорилтот орчинд хүргэн, итгэлийн маркетингийн давуу талыг ашиглаарай.');

  // ── Section headings ──────────────────────────────────────────────────────
  const pillarsSectionTitle  = s(settings, 'advertise_pillars_section_title',  'Агуулгын үндсэн баганууд');
  const pillarsSectionDesc   = s(settings, 'advertise_pillars_section_desc',   'Брэндийнхаа зорилтот хэрэглэгчидтэй холбогдох 6 платформын тулгуур контент.');
  const packagesSectionTitle = s(settings, 'advertise_packages_section_title', 'Багцаар илүү хэмнэнэ');
  const packagesSectionDesc  = s(settings, 'advertise_packages_section_desc',  'Reel байршуулалт зөвхөн багцад — тусдаа худалдаалагдахгүй');
  const slotsSectionTitle    = s(settings, 'advertise_slots_section_title',    'Байршуулалтын сонголтууд');
  const slotsSectionDesc     = s(settings, 'advertise_slots_section_desc',     'Захиалах товч дарж яг тохирох байршуулалтаа сонгоорой');
  const mediakitSectionTitle = s(settings, 'advertise_mediakit_section_title', 'Дэлгэрэнгүй мэдээллийг татаж авна уу');
  const mediakitSectionDesc  = s(settings, 'advertise_mediakit_section_desc',  'Аудиторийн тайлан, байршуулалтын жагсаалт болон үнийн санал бүхий бүрэн медиа кит.');
  const mediakitBg           = s(settings, 'advertise_mediakit_section_bg');

  // ── Pillars ───────────────────────────────────────────────────────────────
  const pillars = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    title: s(settings, `advertise_pillar_${n}_title`, `Багана ${n}`),
    desc:  s(settings, `advertise_pillar_${n}_desc`,  ''),
    image: s(settings, `advertise_pillar_${n}_image`, ''),
    emoji: PILLAR_EMOJI[n - 1],
  }));

  // ── Packages ──────────────────────────────────────────────────────────────
  type PkgOverride = { id: string; name?: string; badge?: string; price?: string; savings?: string; items?: string[] };
  let pkgOverrides: PkgOverride[] = [];
  try { pkgOverrides = JSON.parse(s(settings, 'advertise_packages_data', '[]')); } catch { pkgOverrides = []; }
  const packages = DEFAULT_PACKAGES.map((def) => {
    const ov = pkgOverrides.find((x) => x.id === def.id) ?? {};
    return { ...def, ...ov, ...PKG_DESIGN[def.id] };
  });

  // ── Slot overrides (image per code, uploaded via admin) ──────────────────
  type SlotImageOverride = { id: string; image?: string };
  let slotOverrides: SlotImageOverride[] = [];
  try { slotOverrides = JSON.parse(s(settings, 'advertise_slots_data', '[]')); } catch { slotOverrides = []; }

  // ── Specs price overrides ─────────────────────────────────────────────────
  type SpecsOverride = { code: string; price?: string; priceSub?: string };
  let specsOverrides: SpecsOverride[] = [];
  try { specsOverrides = JSON.parse(s(settings, 'advertise_specs_data', '[]')); } catch { specsOverrides = []; }
  const specsRows = BANNER_SPECS.map((def) => {
    const ov = specsOverrides.find((x) => x.code === def.code) ?? {};
    return { ...def, ...ov };
  });

  // ── Section visibility (default ON — missing key = shown) ─────────────────
  const show = (key: string) => (settings[key] ?? '1') !== '0';
  const showHero     = show('advertise_show_hero');
  const showStats    = show('advertise_show_stats');
  const showWhy      = show('advertise_show_why');
  const showPillars  = show('advertise_show_pillars');
  const showPackages = show('advertise_show_packages');
  const showSlots    = show('advertise_show_slots');
  const showSpecs    = show('advertise_show_specs');
  const showMediakit = show('advertise_show_mediakit');
  const showContact  = show('advertise_show_contact');

  // ── Table cell styles (plain objects — no React.CSSProperties needed) ─────
  const thS = { padding: '12px 20px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700, color: '#9ca3af' as const, letterSpacing: '0.8px', textTransform: 'uppercase' as const, borderBottom: '1px solid #1e1e1e' as const, whiteSpace: 'nowrap' as const };
  const tdS = { padding: '15px 20px', fontSize: '14px', color: '#c0c8d2' as const, borderBottom: '1px solid #161616' as const };

  return (
    <main style={{ background: '#070707', color: '#e5e5e5', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO — UniversalHero (exact site-wide standard)
      ══════════════════════════════════════════════════════════════════════════ */}
      {showHero && (
        <UniversalHero
          badgeText="MommyOffice · Advertise"
          title={headline}
          description={subtitle}
          coverImage={heroBg || undefined}
          youtubeId={heroYtId || undefined}
          primaryActionText={mediakitUrl ? ctaText : undefined}
          primaryHref={mediakitUrl || undefined}
          secondaryActionText={ctaText2}
          secondaryHref="#contact"
          contentVAlign="center"
          fallbackGradient="linear-gradient(135deg, #0a1a19 0%, #061412 50%, #0d0d0d 100%)"
          desktopHeight="clamp(480px, 60vh, 640px)"
          mobileCardHeight="220px"
          titleFontSize="clamp(1.4rem, 2.6vw, 2.2rem)"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          2. STATS — full-width banner image (or number fallback)
      ══════════════════════════════════════════════════════════════════════════ */}
      {showStats && (statsImg ? (
        <section style={{ background: '#0a0a0a', borderBottom: '1px solid #111' }}>
          <img
            src={statsImg}
            alt={statsTitle}
            style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
          />
        </section>
      ) : (
        <section style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 4%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {stats.map((st, i) => (
                <div key={st.label} style={{
                  textAlign: 'center', padding: 'clamp(1.25rem, 4vw, 2rem) clamp(0.5rem, 2vw, 1rem)',
                  borderRight: i < 2 ? '1px solid #1a1a1a' : 'none',
                }}>
                  <div style={{ fontSize: 'clamp(1.4rem, 7vw, 3.25rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {st.value}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {st.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ═══════════════════════════════════════════════════════════════════════
          3. WHY ADVERTISE
      ══════════════════════════════════════════════════════════════════════════ */}
      {showWhy && (
        <section style={{ padding: 'clamp(2.5rem, 7vw, 4rem) 1.5rem', borderBottom: '1px solid #111' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)',
              fontWeight: 900, color: '#fff', margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}>
              {whyTitle}
            </h2>
            <p style={{ fontSize: 'clamp(14px, 1.6vw, 16px)', color: '#9ca3af', lineHeight: 1.8, margin: 0 }}>
              {whyText}
            </p>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          4. 6 CONTENT PILLARS
      ══════════════════════════════════════════════════════════════════════════ */}
      {showPillars && (
      <section style={{ padding: 'clamp(2.5rem, 7vw, 4rem) 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              {pillarsSectionTitle}
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              {pillarsSectionDesc}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {pillars.map((p) => (
              <div key={p.n} style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  width: '100%', aspectRatio: '16/9',
                  background: p.image ? 'transparent' : '#111',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.image ? (
                    <img
                      src={p.image} alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>{p.emoji}</span>
                  )}
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <CategoryBadge text={p.title} size="md" />
                  </div>
                  {p.desc && (
                    <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.5, textWrap: 'balance' as never }}>
                      {p.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          5. PACKAGES
      ══════════════════════════════════════════════════════════════════════════ */}
      {showPackages && (
      <section style={{ padding: 'clamp(2.5rem, 7vw, 4rem) 1.5rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              {packagesSectionTitle}
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              {packagesSectionDesc}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{
                position: 'relative', background: '#0f0f0f',
                border: `1px solid ${pkg.border}`, borderRadius: '16px',
                padding: '1.75rem', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  position: 'absolute', top: -50, right: -50,
                  width: 160, height: 160, borderRadius: '50%',
                  background: pkg.glow, filter: 'blur(50px)', pointerEvents: 'none',
                }} />
                <span style={{
                  display: 'inline-block', fontSize: '11px', fontWeight: 800,
                  padding: '3px 10px', background: `${pkg.color}18`,
                  color: pkg.color, borderRadius: '20px', border: `1px solid ${pkg.border}`,
                  marginBottom: '1.25rem', alignSelf: 'flex-start',
                }}>
                  {pkg.badge}
                </span>
                <h3 style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: pkg.color, margin: '0 0 0.3rem' }}>
                  {pkg.name}
                </h3>
                <div style={{ marginBottom: pkg.savings ? '0.75rem' : '1.5rem' }}>
                  <span style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                    {pkg.price}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '4px' }}>/сар</span>
                </div>
                {pkg.savings && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'rgba(249,115,22,0.15)',
                      border: '1px solid rgba(249,115,22,0.45)',
                      color: '#fb923c',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.3px',
                    }}>
                      🔥 {pkg.savings}
                    </span>
                  </div>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                  {pkg.items.map((item) => (
                    <li key={item} style={{
                      fontSize: '13px', color: '#c4cdd6', padding: '0.5rem 0',
                      borderBottom: '1px solid #161616',
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    borderRadius: '10px', border: `1px solid ${pkg.border}`,
                    color: pkg.color, fontWeight: 700, fontSize: '14px',
                    textDecoration: 'none', background: `${pkg.color}0a`,
                  }}
                >
                  Захиалга өгөх
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          6. INDIVIDUAL SLOT PRICING
      ══════════════════════════════════════════════════════════════════════════ */}
      {showSlots && (
      <section style={{ padding: 'clamp(2.5rem, 7vw, 4rem) 1.5rem', borderBottom: '1px solid #111' }}>
        <style>{`
          .slots-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
          @media(max-width:1024px){.slots-grid{grid-template-columns:repeat(3,1fr)}}
          @media(max-width:640px){.slots-grid{grid-template-columns:repeat(2,1fr);gap:0.875rem}}
          .slot-card{background:#0d0d0d;border-radius:12px;border:1px solid #1a1a1a;overflow:hidden;transition:border-color 0.15s}
          .slot-card:hover{border-color:rgba(0,181,173,0.3)}
        `}</style>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em',
            }}>
              {slotsSectionTitle}
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              {slotsSectionDesc}
            </p>
          </div>
          <div className="slots-grid">
            {specsRows.map((slot) => {
              const override = slotOverrides.find((o) => o.id === slot.code);
              const imgUrl   = override?.image ?? '';
              return (
                <div key={slot.code} className="slot-card">
                  {/* Mockup image — 16:9 aspect ratio */}
                  <div style={{ aspectRatio: '16/9', background: '#070707', overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <SlotMockupSvg code={slot.code} />
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ marginBottom: '0.4rem' }}>
                      <CategoryBadge text={slot.code} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 0.2rem', lineHeight: 1.3 }}>
                      {slot.name}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                      {slot.placement}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          6B. BANNER SPECIFICATIONS TABLE
      ══════════════════════════════════════════════════════════════════════════ */}
      {showSpecs && (
      <section style={{ padding: '3rem 1.5rem', borderBottom: '1px solid #111' }}>
        {/* Hover, premium-row accent, and mobile price-priority layout */}
        <style>{`
          .specs-table tbody tr { transition: background 0.12s; }
          .specs-table tbody tr:hover { background: #131313 !important; }
          .specs-table tbody tr.specs-premium td:first-child {
            border-left: 2px solid rgba(0,181,173,0.45);
            padding-left: 18px;
          }
          @media (max-width: 640px) {
            .specs-table th, .specs-table td { padding: 13px 14px !important; }
          }
        `}</style>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.4rem', letterSpacing: '-0.02em',
            }}>
              {s(settings, 'advertise_specs_title', 'Баннерийн техникийн шаардлага')}
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              {s(settings, 'advertise_specs_desc', 'Зар материалаа доорх хэмжээнд тааруулж бэлтгэнэ үү. Файлыг яг тохирох пикселийн харьцаатай оруулна уу.')}
            </p>
          </div>
          <div style={{ overflow: 'auto', borderRadius: '14px', border: '1px solid #1e1e1e', boxShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#0d0d0d', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#111' }}>
                  <th style={{ ...thS, width: '90px' }}>Код</th>
                  <th style={thS}>Нэр / Байршил</th>
                  <th style={{ ...thS, width: '145px' }}>Үнэ</th>
                  <th style={{ ...thS, width: '120px' }}>Desktop</th>
                  <th style={{ ...thS, width: '120px' }}>Mobile</th>
                  <th style={thS}>Формат · Хэмжээ</th>
                </tr>
              </thead>
              <tbody>
                {specsRows.map((row, i) => {
                  const isPremium = row.code === 'POP-UP' || row.code === 'H1';
                  return (
                    <tr
                      key={row.code}
                      className={isPremium ? 'specs-premium' : undefined}
                      style={{ background: i % 2 === 0 ? '#0d0d0d' : '#0a0a0a' }}
                    >
                      <td style={tdS}>
                        <span style={{
                          display: 'inline-block',
                          background: isPremium ? 'rgba(0,181,173,0.13)' : 'rgba(0,181,173,0.07)',
                          border: `1px solid ${isPremium ? 'rgba(0,181,173,0.4)' : 'rgba(0,181,173,0.18)'}`,
                          borderRadius: '5px',
                          padding: '3px 9px', fontFamily: 'monospace', fontSize: '13px',
                          fontWeight: 700, color: '#00B5AD', whiteSpace: 'nowrap' as const,
                        }}>{row.code}</span>
                      </td>
                      <td style={tdS}>
                        <span style={{ display: 'block', color: '#e5e5e5', fontWeight: 600, fontSize: '14px' }}>{row.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'block' }}>{row.placement}</span>
                      </td>
                      <td style={tdS}>
                        <span style={{
                          display: 'block',
                          color: isPremium ? '#2dd4bf' : '#00B5AD',
                          fontWeight: 800,
                          fontSize: isPremium ? '16px' : '15px',
                          letterSpacing: '-0.01em',
                        }}>{row.price}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'block' }}>{row.priceSub}</span>
                      </td>
                      <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '13px', color: '#c0c8d2' }}>{row.desktop}</td>
                      <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '13px', color: row.mobile === '—' ? '#374151' : '#c0c8d2' }}>{row.mobile}</td>
                      <td style={{ ...tdS, fontSize: '13px', color: '#9ca3af' }}>{row.formats}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          7. MEDIA KIT DOWNLOAD BANNER — compact
      ══════════════════════════════════════════════════════════════════════════ */}
      {showMediakit && (
      <section style={{
        padding: '2.25rem 1.5rem',
        background: mediakitBg
          ? `linear-gradient(rgba(7,7,7,0.75), rgba(7,7,7,0.75)), url('${mediakitBg}') center/cover no-repeat`
          : 'linear-gradient(135deg, #0a0f0e 0%, #061a18 50%, #0a0f0e 100%)',
        borderBottom: '1px solid #111',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block', fontSize: '10px', fontWeight: 800,
            letterSpacing: '2px', textTransform: 'uppercase', color: '#00B5AD',
            marginBottom: '0.6rem',
          }}>
            Media Kit
          </span>
          <h2 style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', fontWeight: 900,
            color: '#fff', margin: '0 0 0.6rem', letterSpacing: '-0.02em',
          }}>
            {mediakitSectionTitle}
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {mediakitSectionDesc}
          </p>
          {mediakitUrl ? (
            <a
              href={mediakitUrl}
              target="_blank" rel="noopener noreferrer"
              download
              style={{
                display: 'inline-block', padding: '11px 36px',
                background: '#00B5AD', color: '#fff',
                borderRadius: '100px', fontWeight: 800, fontSize: '14px',
                textDecoration: 'none', boxShadow: '0 0 32px rgba(0,181,173,0.2)',
              }}
            >
              ⬇ {ctaText}
            </a>
          ) : (
            <a
              href={`mailto:${email}?subject=Media Kit хүсэлт — MommyOffice`}
              style={{
                display: 'inline-block', padding: '11px 36px',
                background: '#00B5AD', color: '#fff',
                borderRadius: '100px', fontWeight: 800, fontSize: '14px',
                textDecoration: 'none', boxShadow: '0 0 32px rgba(0,181,173,0.2)',
              }}
            >
              Media Kit хүсэх →
            </a>
          )}
          {phone && (
            <p style={{ marginTop: '1rem', fontSize: '13px', color: '#374151' }}>
              Утсаар:{' '}
              <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                {phone}
              </a>
            </p>
          )}
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          8. CONTACT FORM
      ══════════════════════════════════════════════════════════════════════════ */}
      {showContact && (
      <section id="contact" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '2px',
              textTransform: 'uppercase', color: '#00B5AD', display: 'block',
              marginBottom: '0.75rem',
            }}>
              Contact Us to Advertise
            </span>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 900,
              color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.02em',
            }}>
              Сурталчилгааны захиалга өгөх
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.8 }}>
              Таны мессэжид бид ажлын өдрүүдэд 24 цагийн дотор хариу өгөх болно.{' '}
              Та мөн манай{' '}
              <a
                href="tel:+97685388383"
                style={{
                  color: '#00B5AD',
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid rgba(0,181,173,0.35)',
                  paddingBottom: '1px',
                }}
              >
                📞 8538-8383
              </a>
              {' '}дугаарт холбогдож мэдээлэл авах боломжтой.
            </p>
          </div>
          <AdvertiseContactForm />
        </div>
      </section>
      )}

    </main>
  );
}
