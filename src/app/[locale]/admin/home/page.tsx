'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getHomeConfig, saveHomeConfig } from '@/app/actions/admin';
import { type HomeConfig } from '@/lib/homeConfig';
import { CoverImageSection } from '@/components/ui/CoverImagePicker';

function extractYouTubeId(input: string): string {
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const short = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = clean.match(/(?:v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  return clean;
}

const lbl: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '0.4rem',
};

const inp: React.CSSProperties = {
  width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px',
  padding: '10px 12px', color: '#e5e5e5', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
};

const card: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px', marginBottom: 0 }}>{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222' }}>
      <div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
          background: checked ? '#00B5AD' : '#374151', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: '3px',
          left: checked ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%', background: 'white',
          transition: 'left 0.2s', display: 'block',
        }} />
      </button>
    </div>
  );
}

export default function AdminHomePage() {
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [ytRaw, setYtRaw] = useState('');

  const [cfg, setCfg] = useState<HomeConfig>({
    hero_title_mn: '',
    hero_title_en: '',
    hero_subtitle_mn: '',
    hero_subtitle_en: '',
    hero_badge_text: '',
    hero_cover_image_url: '',
    hero_youtube_id: '',
    hero_primary_cta_text: '',
    hero_primary_cta_href: '',
    hero_secondary_cta_text: '',
    hero_secondary_cta_href: '',
    show_courses_section: true,
    show_articles_section: true,
    show_videos_section: true,
    show_shop_section: false,
    hero_is_popular: false,
    hero_duration_text: '',
    hero_year: '',
    hero_content_slug: '',
  });

  useEffect(() => {
    getHomeConfig().then((data) => {
      setCfg(data);
      setYtRaw(data.hero_youtube_id || '');
      setLoading(false);
    });
  }, []);

  function set<K extends keyof HomeConfig>(key: K, val: HomeConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleYtInput(raw: string) {
    setYtRaw(raw);
    const id = extractYouTubeId(raw);
    set('hero_youtube_id', id);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    const { error: err } = await saveHomeConfig(cfg);
    if (err) { setError(err); setSaving(false); return; }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
      Уншиж байна…
    </div>
  );

  const ytThumb = cfg.hero_youtube_id?.length === 11
    ? `https://img.youtube.com/vi/${cfg.hero_youtube_id}/hqdefault.jpg`
    : null;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.25rem' }}>
          <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link>
          {' / Нүүр хуудас'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>🏠 Нүүр хуудас удирдлага</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          Hero зураг, гарчиг, болон бүлгийн харагдах байдлыг тохируулна уу.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── HERO IMAGE ── */}
        <div style={card}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1rem' }}>🎬 Hero зураг / видео</p>


          {/* YouTube ID */}
          <div style={{ marginTop: '1rem' }}>
            <Field
              label="▶ YouTube Autoplay (заавал биш)"
              hint="YouTube видео URL эсвэл ID оруулна. Desktop дээр 2.5 секундын дараа дуугүй автоматаар тоглоно."
            >
              <input
                style={inp}
                placeholder="https://youtube.com/watch?v=... эсвэл dQw4w9WgXcQ"
                value={ytRaw}
                onChange={(e) => handleYtInput(e.target.value)}
              />
            </Field>
            {ytThumb && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={ytThumb} alt="YT thumb" style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #333' }} />
                <span style={{ fontSize: '11px', color: '#00B5AD' }}>✅ ID: <code style={{ color: '#e5e5e5' }}>{cfg.hero_youtube_id}</code></span>
              </div>
            )}
          </div>
        </div>

        {/* ── HERO TEXT ── */}
        <div style={card}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1rem' }}>✍️ Hero гарчиг & тайлбар</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Field label="Гарчиг (МН)">
              <input style={inp} value={cfg.hero_title_mn} onChange={(e) => set('hero_title_mn', e.target.value)} placeholder="Монголын №1 платформ" />
            </Field>
            <Field label="Гарчиг (EN)">
              <input style={inp} value={cfg.hero_title_en} onChange={(e) => set('hero_title_en', e.target.value)} placeholder="Mongolia #1 Platform" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Field label="Тайлбар (МН)">
              <textarea style={{ ...inp, height: '72px', resize: 'vertical' }} value={cfg.hero_subtitle_mn} onChange={(e) => set('hero_subtitle_mn', e.target.value)} placeholder="Мэдлэг эзэмш. Амьдралаа сайжруул." />
            </Field>
            <Field label="Тайлбар (EN)">
              <textarea style={{ ...inp, height: '72px', resize: 'vertical' }} value={cfg.hero_subtitle_en} onChange={(e) => set('hero_subtitle_en', e.target.value)} placeholder="Learn. Grow. Achieve." />
            </Field>
          </div>

          <Field label="Badge текст" hint="Hero картны дээр жижиг чип байдлаар харагдана">
            <input style={inp} value={cfg.hero_badge_text} onChange={(e) => set('hero_badge_text', e.target.value)} placeholder="🇲🇳 MONGOLIA #1 PLATFORM" />
          </Field>
        </div>

        {/* ── CTA BUTTONS ── */}
        <div style={card}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 1rem' }}>🔘 CTA товчнууд</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Field label="Үндсэн товч — текст">
              <input style={inp} value={cfg.hero_primary_cta_text} onChange={(e) => set('hero_primary_cta_text', e.target.value)} placeholder="Үзэх" />
            </Field>
            <Field label="Үндсэн товч — холбоос" hint="Жишээ: /mn/courses эсвэл /mn/videos">
              <input style={inp} value={cfg.hero_primary_cta_href} onChange={(e) => set('hero_primary_cta_href', e.target.value)} placeholder="/mn/courses" />
            </Field>
          </div>
          <Field
            label="Хоёрдогч товч — текст"
            hint='Бөглөвөл "Дэлгэрэнгүй" маягийн товч гарч ирнэ — дарахад Netflix шиг дэлгэрэнгүй мэдээллийн цонх нээгдэнэ. Хоосон үлдээвэл товч харагдахгүй.'
          >
            <input
              style={inp}
              value={cfg.hero_secondary_cta_text}
              onChange={(e) => set('hero_secondary_cta_text', e.target.value)}
              placeholder="Дэлгэрэнгүй"
            />
          </Field>

          {/* Netflix modal metadata — only relevant when secondary CTA is set */}
          {cfg.hero_secondary_cta_text?.trim() && (
            <div style={{ marginTop: '1rem', padding: '14px', background: 'rgba(0,181,173,0.04)', border: '1px solid rgba(0,181,173,0.15)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#00B5AD', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎬 Netflix маягийн цонхны мэдээлэл
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Field label="Жил" hint='Жишээ: 2026'>
                  <input
                    style={inp}
                    value={cfg.hero_year || ''}
                    onChange={(e) => set('hero_year', e.target.value)}
                    placeholder={String(new Date().getFullYear())}
                  />
                </Field>
                <Field label="Үргэлжлэх хугацаа" hint='Жишээ: 45 мин — эсвэл 3 цуврал (цуврал бол)'>
                  <input
                    style={inp}
                    value={cfg.hero_duration_text || ''}
                    onChange={(e) => set('hero_duration_text', e.target.value)}
                    placeholder="45 мин"
                  />
                </Field>
              </div>

              {/* Hero content slug — for fetching episodes */}
              <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #222' }}>
                <Field
                  label="Видеоны Slug (цуврал бол)"
                  hint='Цуврал видеоны slug оруулна. Жишээ: tinder-iin-esreg — энэ тохиолдолд Дэлгэрэнгүй цонхонд ангиудын жагсаалт харагдана.'
                >
                  <input
                    style={inp}
                    value={cfg.hero_content_slug || ''}
                    onChange={(e) => set('hero_content_slug', e.target.value.trim())}
                    placeholder="tinder-iin-esreg"
                  />
                </Field>
              </div>

              {/* Most Liked toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #222' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
                    🔴 Хамгийн их үзэгдсэн
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Асаавал Netflix-ийн "Most Liked" шиг улаан тэмдэглэгээ гарна
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('hero_is_popular', !cfg.hero_is_popular)}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                    background: cfg.hero_is_popular ? '#e50914' : '#374151',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: cfg.hero_is_popular ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', display: 'block',
                  }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION VISIBILITY ── */}
        <div style={card}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 0.25rem' }}>🔀 Бүлгийн харагдах байдал</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 0.75rem' }}>Нүүр хуудасны аль бүлгийг харуулах/нуухыг тохируулна уу.</p>

          <Toggle
            checked={cfg.show_courses_section}
            onChange={(v) => set('show_courses_section', v)}
            label="Сургалтууд"
            desc="Онцлох сургалтуудын эгнээ"
          />
          <Toggle
            checked={cfg.show_articles_section}
            onChange={(v) => set('show_articles_section', v)}
            label="Трэндинг нийтлэлүүд"
            desc="Нийтлэлийн editorial grid + scroll эгнээ"
          />
          <Toggle
            checked={cfg.show_videos_section}
            onChange={(v) => set('show_videos_section', v)}
            label="Кино & Видео"
            desc="Видеоны scroll эгнээ"
          />
          <div style={{ borderBottom: 'none' }}>
            <Toggle
              checked={cfg.show_shop_section}
              onChange={(v) => set('show_shop_section', v)}
              label="Дэлгүүр"
              desc="Бүтээгдэхүүний scroll эгнээ"
            />
          </div>
        </div>

        {/* ── LIVE PREVIEW NOTE ── */}
        <div style={{ background: 'rgba(0,181,173,0.06)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#00B5AD' }}>
            💡 <strong>Агуулгын эгнээ удирдлага:</strong> Articles → admin/articles-д Placement = <code>hero</code> / <code>trending</code> тохируулна.
            Videos → admin/videos-д Placement = <code>hero</code> / <code>trending</code> тохируулна.
            Сургалтууд автоматаар сүүлийн нийтлэгдсэнийг харуулна.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Save */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#374151' : '#00B5AD', color: 'white',
              border: 'none', borderRadius: '8px', padding: '12px 32px',
              fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Хадгалж байна…' : '💾 Хадгалах'}
          </button>
          {saved && (
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>
              ✅ Амжилттай хадгалагдлаа!
            </span>
          )}
          <Link href={`/${locale}/admin`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginLeft: 'auto' }}>
            ← Admin буцах
          </Link>
        </div>

        {/* Cover image upload + live preview */}
        <CoverImageSection
          value={cfg.hero_cover_image_url}
          onChange={(url) => set('hero_cover_image_url', url)}
          title={cfg.hero_title_mn || 'Гарчиг энд харагдана'}
          badge={cfg.hero_badge_text || 'MommyOffice'}
        />
      </form>
    </div>
  );
}
