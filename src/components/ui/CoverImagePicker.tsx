'use client';
/**
 * CoverImagePicker — MommyOffice Admin (BUG-049 upgrade)
 *
 * Two upload zones side-by-side (Desktop | Mobile) + Live Dual Preview below.
 * BUG-048: Mobile card = pure image only, no text/vignette inside.
 */

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'url' | 'upload';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  mobileValue?: string;
  onMobileChange?: (url: string) => void;
  previewTitle?: string;
  previewBadge?: string;
}

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/avif';
const MAX_MB   = 10;

// ── Upload Zone ────────────────────────────────────────────────────────────────
function UploadZone({
  value, onChange, zoneLabel, spec, tipContent,
}: {
  value: string;
  onChange: (url: string) => void;
  zoneLabel: string;
  spec: string;
  tipContent: React.ReactNode;
}) {
  const [mode, setMode]           = useState<Mode>('url');
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [progress, setProgress]   = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploadErr('');
    if (!file.type.startsWith('image/')) { setUploadErr('Зөвхөн зураг (JPEG, PNG, WebP).'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setUploadErr(`${MAX_MB}MB-аас ихгүй байна.`); return; }
    setUploading(true); setProgress(10);
    const supabase = createClient();
    const ext   = file.name.split('.').pop() ?? 'jpg';
    const fname = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const tick  = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300);
    const { data, error } = await supabase.storage
      .from('media').upload(fname, file, { cacheControl: '31536000', upsert: false });
    clearInterval(tick); setProgress(100);
    if (error) { setUploadErr(`Upload алдаа: ${error.message}`); setUploading(false); setProgress(0); return; }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
    onChange(urlData.publicUrl);
    setUploading(false);
    setTimeout(() => setProgress(0), 800);
  }, [onChange]);

  function onDragOver(e: DragEvent)  { e.preventDefault(); setDragging(true); }
  function onDragLeave()              { setDragging(false); }
  function onDrop(e: DragEvent)      { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f); }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) uploadFile(f); }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', height:'100%' }}>

      {/* Header row: label + spec + mode tabs */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
        <div>
          <div style={{ fontSize:'12px', fontWeight:700, color:'#9ca3af' }}>{zoneLabel}</div>
          <div style={{ fontSize:'10px', color:'#6b7280', marginTop:'2px' }}>{spec}</div>
        </div>
        <div style={{
          display:'flex', gap:'2px', background:'#111', padding:'2px',
          borderRadius:'7px', border:'1px solid #2a2a2a', flexShrink:0,
        }}>
          {(['url','upload'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding:'3px 10px', borderRadius:'5px', fontSize:'10px', fontWeight:600,
              border:'none', cursor:'pointer',
              background: mode===m ? '#2a2a2a' : 'transparent',
              color:       mode===m ? '#e5e5e5' : '#6b7280',
              transition: 'all 0.12s',
            }}>
              {m==='url' ? '🔗 URL' : '📁 Upload'}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      {mode === 'url' ? (
        <div>
          <input
            type="url" value={value} onChange={e => onChange(e.target.value)}
            placeholder="https://cdn.example.com/cover.webp"
            style={{
              width:'100%', padding:'9px 12px', borderRadius:'8px', boxSizing:'border-box',
              border:`1px solid ${value ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
              background:'#111', color:'#e5e5e5', fontSize:'12px', outline:'none', fontFamily:'inherit',
            }}
          />
          {value && (
            <button type="button" onClick={() => onChange('')} style={{
              marginTop:'4px', background:'none', border:'none', color:'#6b7280',
              fontSize:'10px', cursor:'pointer', textDecoration:'underline', padding:0,
            }}>Устгах</button>
          )}
        </div>
      ) : (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border:`2px dashed ${dragging ? '#00B5AD' : uploading ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
            borderRadius:'8px', padding:'18px 12px', textAlign:'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragging ? 'rgba(0,181,173,0.05)' : '#111', transition:'all 0.15s',
          }}
        >
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display:'none' }} onChange={onFileChange} />
          {uploading ? (
            <div>
              <div style={{ fontSize:'18px', marginBottom:'6px' }}>⏳</div>
              <p style={{ fontSize:'11px', color:'#9ca3af', margin:'0 0 8px' }}>Байршуулж байна...</p>
              <div style={{ height:'3px', background:'#2a2a2a', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'#00B5AD', borderRadius:'2px', transition:'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'20px', marginBottom:'5px' }}>🖼️</div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'#e5e5e5', margin:'0 0 2px' }}>
                {dragging ? 'Зургаа оруулна уу' : 'Зургаа энд чирэх'}
              </p>
              <p style={{ fontSize:'10px', color:'#6b7280', margin:0 }}>
                эсвэл <span style={{ color:'#00B5AD', textDecoration:'underline' }}>Browse</span> · JPEG, PNG, WebP · 10MB
              </p>
            </>
          )}
          {uploadErr && (
            <p style={{ fontSize:'10px', color:'#fca5a5', marginTop:'8px', background:'rgba(239,68,68,0.1)', padding:'5px 8px', borderRadius:'5px' }}>
              {uploadErr}
            </p>
          )}
        </div>
      )}

      {/* Tip */}
      <div style={{ fontSize:'10px', color:'#6b7280', padding:'6px 8px', background:'rgba(0,181,173,0.04)', borderRadius:'6px', border:'1px solid rgba(0,181,173,0.08)', marginTop:'auto' }}>
        {tipContent}
      </div>

    </div>
  );
}

// ── Dual live preview ──────────────────────────────────────────────────────────
function DualPreview({
  desktopSrc, mobileSrc, previewTitle, previewBadge,
}: {
  desktopSrc: string; mobileSrc: string; previewTitle: string; previewBadge: string;
}) {
  const effective = desktopSrc || mobileSrc;
  const mobileImg = mobileSrc || desktopSrc;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ fontSize:'10px', fontWeight:700, color:'#4b5563', letterSpacing:'1px' }}>
        ◀ LIVE DUAL PREVIEW ▶
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 130px', gap:'10px', alignItems:'start' }}>

        {/* Desktop 16:9 */}
        <div>
          <div style={{ fontSize:'9px', fontWeight:700, color:'#6b7280', marginBottom:'5px' }}>🖥️ DESKTOP HERO (16:9)</div>
          <div style={{
            position:'relative', width:'100%', paddingBottom:'56.25%',
            borderRadius:'8px', overflow:'hidden',
            background:'#0d0d0d', border:'1px solid #2a2a2a',
          }}>
            {effective ? (
              <>
                <img src={effective} alt="Desktop preview" style={{
                  position:'absolute', inset:0, width:'100%', height:'100%',
                  objectFit:'cover', objectPosition:'center top',
                }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.1) 55%, transparent 70%)' }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'25%', background:'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }} />
                {previewBadge && (
                  <div style={{ position:'absolute', top:'7px', left:'8px', fontSize:'6px', fontWeight:800, color:'#00B5AD', letterSpacing:'1.5px', background:'rgba(0,181,173,0.15)', border:'1px solid rgba(0,181,173,0.4)', padding:'1px 5px', borderRadius:'3px' }}>
                    {previewBadge.toUpperCase()}
                  </div>
                )}
                <div style={{ position:'absolute', bottom:'8px', left:'10px', zIndex:2 }}>
                  <div style={{ fontSize:'8px', fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 1px 4px rgba(0,0,0,0.9)', maxWidth:'55%', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {previewTitle}
                  </div>
                  <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                    <div style={{ background:'rgba(255,255,255,0.92)', color:'#000', fontSize:'6px', fontWeight:700, padding:'2px 6px', borderRadius:'3px' }}>▶ ҮЗЭХ</div>
                    <div style={{ background:'rgba(109,109,110,0.55)', color:'#fff', fontSize:'6px', fontWeight:700, padding:'2px 6px', borderRadius:'3px' }}>ⓘ ДЭЛГЭРЭНГҮЙ</div>
                  </div>
                </div>
                <div style={{ position:'absolute', top:'5px', right:'6px', fontSize:'7px', background:'rgba(0,181,173,0.85)', color:'#fff', padding:'1px 5px', borderRadius:'2px', fontWeight:600 }}>↑ top</div>
              </>
            ) : (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <div style={{ fontSize:'22px', opacity:0.15 }}>🖼️</div>
                <p style={{ fontSize:'9px', color:'#374151', margin:0 }}>Зурагний preview энд харагдана</p>
              </div>
            )}
          </div>
          {effective && <p style={{ fontSize:'9px', color:'#4b5563', marginTop:'3px' }}>✓ objectFit:cover · objectPosition:top</p>}
        </div>

        {/* Mobile 240px pure card */}
        <div>
          <div style={{ fontSize:'9px', fontWeight:700, color:'#6b7280', marginBottom:'5px' }}>📱 MOBILE (240px)</div>
          <div style={{
            position:'relative', width:'100%', height:'120px',
            borderRadius:'8px', overflow:'hidden',
            background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.06)',
          }}>
            {mobileImg ? (
              <img src={mobileImg} alt="Mobile preview" style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', objectPosition:'center top',
              }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            ) : (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:'18px', opacity:0.15 }}>📱</div>
              </div>
            )}
          </div>
          {/* External text stack — BUG-048 */}
          <div style={{ marginTop:'5px' }}>
            {previewBadge && (
              <p style={{ fontSize:'7px', fontWeight:800, color:'#00B5AD', letterSpacing:'1px', margin:'0 0 2px', textTransform:'uppercase' }}>
                {previewBadge}
              </p>
            )}
            <p style={{ fontSize:'8px', fontWeight:900, color:'#fff', margin:'0 0 3px', lineHeight:1.25, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {previewTitle || 'Гарчиг энд харагдана'}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              <div style={{ background:'#fff', color:'#000', fontSize:'7px', fontWeight:700, padding:'3px 0', borderRadius:'4px', textAlign:'center' }}>▶ ҮЗЭХ</div>
              <div style={{ background:'rgba(30,30,30,0.9)', color:'#fff', fontSize:'7px', fontWeight:700, padding:'3px 0', borderRadius:'4px', textAlign:'center', border:'1px solid rgba(255,255,255,0.12)' }}>ⓘ ДЭЛГЭРЭНГҮЙ</div>
            </div>
          </div>
          {mobileSrc && mobileSrc !== desktopSrc && (
            <p style={{ fontSize:'8px', color:'#00B5AD', marginTop:'4px' }}>✓ Тусгай mobile зураг</p>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function CoverImagePicker({
  value, onChange, label,
  mobileValue, onMobileChange,
  previewTitle = 'Гарчиг энд харагдана',
  previewBadge = '',
}: Props) {
  const hasMobile = onMobileChange !== undefined;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Section header */}
      <div style={{ fontSize:'13px', fontWeight:700, color:'#9ca3af' }}>
        {label ?? '🖼️ Cover Image — Hero Poster'}
      </div>

      {/* Upload zones — side by side when mobile is available, single column otherwise */}
      <div style={{
        display:'grid',
        gridTemplateColumns: hasMobile ? '1fr 1fr' : '1fr',
        gap:'10px',
        alignItems:'stretch',
      }}>
        {/* Desktop upload */}
        <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:'10px', padding:'14px', display:'flex' }}>
          <UploadZone
            value={value}
            onChange={onChange}
            zoneLabel="🖥️ Desktop Hero Poster (Заавал)"
            spec="1920×1080px WebP · 16:9 · 10MB хүртэл"
            tipContent={
              <>
                💡 <strong style={{ color:'#9ca3af' }}>Thumbnail Priority:</strong> Custom upload = 100% priority. YouTube / auto-thumbnails = fallback ONLY if empty.
              </>
            }
          />
        </div>

        {/* Mobile upload (optional) */}
        {hasMobile && (
          <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:'10px', padding:'14px', display:'flex' }}>
            <UploadZone
              value={mobileValue ?? ''}
              onChange={onMobileChange}
              zoneLabel="📱 Mobile Hero Poster (Заавал биш)"
              spec="4:5 / 3:4 · subject нүүрийг дээд талд бүрэн харуулна"
              tipContent={
                <>
                  💡 Хоосон үлдвэл desktop poster автоматаар ашиглагдана. 240px card-д зөвхөн зураг — text/vignette байхгүй (BUG-048).
                </>
              }
            />
          </div>
        )}
      </div>

      {/* Live dual preview */}
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:'10px', padding:'14px' }}>
        <DualPreview
          desktopSrc={value}
          mobileSrc={mobileValue ?? value}
          previewTitle={previewTitle}
          previewBadge={previewBadge}
        />
      </div>

    </div>
  );
}
