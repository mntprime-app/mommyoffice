'use client';
/**
 * CoverImagePicker — MommyOffice Admin
 *
 * Two input modes:
 *  A. Drag-and-drop / browse file → uploads to Supabase Storage bucket "media"
 *  B. Paste URL directly
 *
 * Renders a live 16:9 preview card showing objectFit:cover objectPosition:top
 * exactly as it will appear in the Hero section.
 */

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'url' | 'upload';

interface Props {
  value: string;           // current thumbnail_url
  onChange: (url: string) => void;
  label?: string;
}

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/avif';
const MAX_MB   = 10;

export default function CoverImagePicker({ value, onChange, label }: Props) {
  const [mode, setMode]         = useState<Mode>('url');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Upload file to Supabase Storage ────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    setUploadErr('');
    if (!file.type.startsWith('image/')) {
      setUploadErr('Зөвхөн зураг (JPEG, PNG, WebP) оруулна уу.'); return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadErr(`Зургийн хэмжээ ${MAX_MB}MB-аас ихгүй байна.`); return;
    }
    setUploading(true); setProgress(10);
    const supabase = createClient();
    const ext   = file.name.split('.').pop() ?? 'jpg';
    const fname = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Simulate incremental progress (Supabase SDK doesn't expose upload progress)
    const tick = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300);

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fname, file, { cacheControl: '31536000', upsert: false });

    clearInterval(tick);
    setProgress(100);

    if (error) {
      setUploadErr(`Upload алдаа: ${error.message}`);
      setUploading(false); setProgress(0); return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
    onChange(urlData.publicUrl);
    setUploading(false);
    setTimeout(() => setProgress(0), 800);
  }, [onChange]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  function onDragOver(e: DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave()             { setDragging(false); }
  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* ── Section header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#9ca3af' }}>
            {label ?? '🖼️ Cover Image — Hero Poster'}
          </div>
          <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'2px' }}>
            Санал болгох: <strong style={{ color:'#9ca3af' }}>1920×1080px WebP</strong> · 16:9 харьцаа · 10MB хүртэл
          </div>
        </div>
        {/* Mode tabs */}
        <div style={{ display:'flex', gap:'4px', background:'#1a1a1a', padding:'3px', borderRadius:'8px', border:'1px solid #2a2a2a' }}>
          {(['url','upload'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding:'4px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:600,
              border:'none', cursor:'pointer',
              background: mode===m ? '#2a2a2a' : 'transparent',
              color: mode===m ? '#e5e5e5' : '#6b7280',
            }}>
              {m==='url' ? '🔗 URL' : '📁 Upload'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column layout: input left, preview right ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', alignItems:'start' }}>

        {/* LEFT: Input panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

          {mode === 'url' ? (
            /* URL paste input */
            <div>
              <input
                type="url"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="https://cdn.example.com/cover.webp"
                style={{
                  width:'100%', padding:'10px 14px', borderRadius:'8px', boxSizing:'border-box',
                  border:`1px solid ${value ? 'rgba(0,181,173,0.4)' : '#333'}`,
                  background:'#2a2a2a', color:'#e5e5e5', fontSize:'13px', outline:'none',
                  fontFamily:'inherit',
                }}
              />
              {!value && (
                <p style={{ fontSize:'11px', color:'#6b7280', marginTop:'6px' }}>
                  💡 Upload a custom high-res Hero Poster (16:9 / 1920×1080 WebP). If left empty, system will fallback to the YouTube thumbnail.
                </p>
              )}
              {value && (
                <button type="button" onClick={() => onChange('')} style={{
                  marginTop:'6px', background:'none', border:'none', color:'#6b7280',
                  fontSize:'11px', cursor:'pointer', textDecoration:'underline', padding:0,
                }}>
                  Устгах
                </button>
              )}
            </div>
          ) : (
            /* Drag-and-drop upload zone */
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => !uploading && fileRef.current?.click()}
              style={{
                border:`2px dashed ${dragging ? '#00B5AD' : uploading ? 'rgba(0,181,173,0.4)' : '#333'}`,
                borderRadius:'10px',
                padding:'28px 16px',
                textAlign:'center',
                cursor: uploading ? 'wait' : 'pointer',
                background: dragging ? 'rgba(0,181,173,0.05)' : '#1a1a1a',
                transition:'all 0.15s',
              }}
            >
              <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display:'none' }} onChange={onFileChange} />
              {uploading ? (
                <div>
                  <div style={{ fontSize:'24px', marginBottom:'8px' }}>⏳</div>
                  <p style={{ fontSize:'13px', color:'#9ca3af', margin:'0 0 10px' }}>Байршуулж байна...</p>
                  <div style={{ height:'4px', background:'#2a2a2a', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${progress}%`, background:'#00B5AD', borderRadius:'2px', transition:'width 0.3s' }} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:'28px', marginBottom:'8px' }}>🖼️</div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#e5e5e5', margin:'0 0 4px' }}>
                    {dragging ? 'Зургаа оруулна уу' : 'Зургаа энд чирэх'}
                  </p>
                  <p style={{ fontSize:'11px', color:'#6b7280', margin:0 }}>
                    эсвэл <span style={{ color:'#00B5AD', textDecoration:'underline' }}>Browse</span> дарах · JPEG, PNG, WebP · 10MB
                  </p>
                </>
              )}
              {uploadErr && (
                <p style={{ fontSize:'11px', color:'#fca5a5', marginTop:'8px', background:'rgba(239,68,68,0.1)', padding:'6px 10px', borderRadius:'6px' }}>
                  {uploadErr}
                </p>
              )}
            </div>
          )}

          {/* Asset guidance tags */}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <AssetTag icon="🖥️" label="Hero Poster" spec="16:9 · 1920×1080px · WebP санал болгоно" active />
            <AssetTag icon="📱" label="Mobile Poster" spec="4:5 эсвэл 1:1 · DB migration шаардлагатай" />
          </div>
        </div>

        {/* RIGHT: Live 16:9 preview card */}
        <div>
          <div style={{ fontSize:'11px', fontWeight:600, color:'#6b7280', marginBottom:'6px' }}>
            LIVE PREVIEW — Hero дээр яг ингэж харагдана
          </div>
          {/* 16:9 aspect wrapper */}
          <div style={{
            position:'relative', width:'100%', paddingBottom:'56.25%',
            borderRadius:'10px', overflow:'hidden',
            background:'#0a0a0a', border:'1px solid #2a2a2a',
          }}>
            {value ? (
              <>
                <img
                  src={value}
                  alt="Cover preview"
                  style={{
                    position:'absolute', inset:0, width:'100%', height:'100%',
                    objectFit:'cover', objectPosition:'center top',
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Simulated gradient overlay */}
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 35%, transparent 65%)',
                }} />
                <div style={{ position:'absolute', bottom:'10px', left:'12px', zIndex:2 }}>
                  <div style={{ fontSize:'9px', fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>
                    Гарчиг<br />энд харагдана
                  </div>
                  <div style={{ display:'flex', gap:'6px', marginTop:'6px' }}>
                    <div style={{ background:'rgba(255,255,255,0.9)', color:'#000', fontSize:'7px', fontWeight:700, padding:'2px 7px', borderRadius:'3px' }}>▶ ҮЗЭХ</div>
                    <div style={{ background:'rgba(109,109,110,0.6)', color:'#fff', fontSize:'7px', fontWeight:700, padding:'2px 7px', borderRadius:'3px' }}>ⓘ ДЭЛГЭРЭНГҮЙ</div>
                  </div>
                </div>
                {/* object-position:top indicator */}
                <div style={{ position:'absolute', top:'6px', right:'8px', fontSize:'8px', background:'rgba(0,181,173,0.85)', color:'#fff', padding:'2px 6px', borderRadius:'3px', fontWeight:600 }}>
                  object-top ↑
                </div>
              </>
            ) : (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <div style={{ fontSize:'28px', opacity:0.3 }}>🖼️</div>
                <p style={{ fontSize:'11px', color:'#4b5563', margin:0 }}>Cover image preview</p>
              </div>
            )}
          </div>
          {value && (
            <p style={{ fontSize:'10px', color:'#4b5563', marginTop:'5px' }}>
              ✓ objectFit: cover · objectPosition: center top · нүүр/толгой хэрчигдэхгүй
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetTag({ icon, label, spec, active }: { icon: string; label: string; spec: string; active?: boolean }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'7px 10px', borderRadius:'7px',
      background: active ? 'rgba(0,181,173,0.06)' : 'transparent',
      border:`1px solid ${active ? 'rgba(0,181,173,0.2)' : '#2a2a2a'}`,
    }}>
      <span style={{ fontSize:'13px' }}>{icon}</span>
      <div>
        <div style={{ fontSize:'11px', fontWeight:700, color: active ? '#00B5AD' : '#6b7280' }}>{label}</div>
        <div style={{ fontSize:'10px', color:'#4b5563' }}>{spec}</div>
      </div>
      {active && <div style={{ marginLeft:'auto', fontSize:'9px', fontWeight:700, color:'#00B5AD', background:'rgba(0,181,173,0.1)', padding:'1px 6px', borderRadius:'3px' }}>ACTIVE</div>}
    </div>
  );
}
