'use client';
/**
 * CoverImagePicker — MommyOffice Admin
 *
 * Two separately usable parts:
 *
 *   1. `default export CoverImagePicker`  — compact upload zone (URL + drag-drop).
 *      Place this inside a SideCard or any narrow column.
 *
 *   2. `export CoverImagePreview`  — full-width live dual preview panel.
 *      Place this as a standalone section BELOW the main two-column grid on every
 *      admin form so the preview is always large and readable.
 *
 * BUG-057: Simplified from dual Desktop/Mobile upload to single image.
 *          Preview moved to full-width standalone component.
 */

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'url' | 'upload';

interface PickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** @deprecated kept for backward compat — ignored */
  mobileValue?: string;
  /** @deprecated kept for backward compat — no-op */
  onMobileChange?: (url: string) => void;
  /** @deprecated kept for backward compat — preview now lives in CoverImagePreview */
  previewTitle?: string;
  /** @deprecated kept for backward compat — preview now lives in CoverImagePreview */
  previewBadge?: string;
}

export interface PreviewProps {
  src: string;
  title?: string;
  badge?: string;
}

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/avif';
const MAX_MB   = 10;

// ── Client-side compression (Canvas → WebP) ───────────────────────────────────
async function compressImage(file: File, maxW: number, maxH: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/webp', 0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// ── Compact upload zone ───────────────────────────────────────────────────────
export default function CoverImagePicker({ value, onChange, label }: PickerProps) {
  const [mode, setMode]           = useState<Mode>('url');
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [progress, setProgress]   = useState(0);
  const [compressed, setCompressed] = useState<{before:number;after:number}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploadErr(''); setCompressed(null);
    if (!file.type.startsWith('image/')) { setUploadErr('Зөвхөн зураг (JPEG, PNG, WebP).'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setUploadErr(`${MAX_MB}MB-аас ихгүй байна.`); return; }
    setUploading(true); setProgress(15);

    let blob: Blob;
    try {
      blob = await compressImage(file, 1920, 1080);
      setCompressed({ before: file.size, after: blob.size });
    } catch {
      blob = file;
    }
    setProgress(40);

    const supabase = createClient();
    const fname = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const tick  = setInterval(() => setProgress(p => Math.min(p + 10, 88)), 300);
    const { data, error } = await supabase.storage
      .from('media').upload(fname, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    clearInterval(tick); setProgress(100);
    if (error) { setUploadErr(`Upload алдаа: ${error.message}`); setUploading(false); setProgress(0); return; }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
    onChange(urlData.publicUrl);
    setUploading(false);
    setMode('url'); // switch to URL tab so user sees the filled URL + preview activates
    setTimeout(() => setProgress(0), 800);
  }, [onChange]);

  function onDragOver(e: DragEvent)  { e.preventDefault(); setDragging(true); }
  function onDragLeave()              { setDragging(false); }
  function onDrop(e: DragEvent)      { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f); }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) uploadFile(f); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {label && <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af' }}>{label}</div>}

      {/* Label + spec + mode tabs */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af' }}>Үндсэн нүүр зураг (16:9)</div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>1920×1080px — авто WebP шахалт</div>
        </div>
        <div style={{ display: 'flex', gap: '2px', background: '#111', padding: '2px', borderRadius: '7px', border: '1px solid #2a2a2a', flexShrink: 0 }}>
          {(['url', 'upload'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding: '3px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: mode === m ? '#2a2a2a' : 'transparent',
              color:       mode === m ? '#e5e5e5' : '#6b7280',
              transition: 'all 0.12s',
            }}>
              {m === 'url' ? '🔗 URL' : '📁 Upload'}
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
              width: '100%', padding: '9px 12px', borderRadius: '8px', boxSizing: 'border-box',
              border: `1px solid ${value ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
              background: '#111', color: '#e5e5e5', fontSize: '12px', outline: 'none', fontFamily: 'inherit',
            }}
          />
          {value && (
            <button type="button" onClick={() => onChange('')} style={{
              marginTop: '4px', background: 'none', border: 'none', color: '#6b7280',
              fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', padding: 0,
            }}>Устгах</button>
          )}
          {compressed && (
            <p style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>
              ✓ {(compressed.before/1024).toFixed(0)}KB → {(compressed.after/1024).toFixed(0)}KB · WebP
            </p>
          )}
        </div>
      ) : (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#00B5AD' : uploading ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`,
            borderRadius: '8px', padding: '18px 12px', textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragging ? 'rgba(0,181,173,0.05)' : '#111', transition: 'all 0.15s',
          }}
        >
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={onFileChange} />
          {uploading ? (
            <div>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>⏳</div>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>Байршуулж байна...</p>
              <div style={{ height: '3px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#00B5AD', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🖼️</div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#e5e5e5', margin: '0 0 2px' }}>
                {dragging ? 'Зургаа оруулна уу' : 'Зургаа энд чирэх'}
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>
                эсвэл <span style={{ color: '#00B5AD', textDecoration: 'underline' }}>Browse</span> · JPEG, PNG, WebP · 10MB
              </p>
            </>
          )}
          {uploadErr && (
            <p style={{ fontSize: '10px', color: '#fca5a5', marginTop: '8px', background: 'rgba(239,68,68,0.1)', padding: '5px 8px', borderRadius: '5px' }}>
              {uploadErr}
            </p>
          )}
        </div>
      )}

      {/* Priority tip */}
      <div style={{ fontSize: '10px', color: '#6b7280', padding: '6px 8px', background: 'rgba(0,181,173,0.04)', borderRadius: '6px', border: '1px solid rgba(0,181,173,0.08)' }}>
        💡 <strong style={{ color: '#9ca3af' }}>Thumbnail Priority:</strong> Custom upload = 100% priority. YouTube / auto-thumbnails = fallback ONLY if empty.
      </div>

    </div>
  );
}

// ── Full-width live dual preview (named export) ───────────────────────────────
// Place this BELOW the main two-column grid in every admin form.
export function CoverImagePreview({ src, title, badge }: PreviewProps) {
  return (
    <div style={{
      marginTop: '2rem',
      background: '#161616',
      border: '1px solid #2a2a2a',
      borderRadius: '16px',
      padding: '20px 24px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '14px', marginBottom: '16px', borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#00B5AD', letterSpacing: '0.5px' }}>👁 LIVE DUAL PREVIEW</span>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>— 1:1 production layout match</span>
      </div>

      {/* Full-width desktop hero preview */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: '56.25%',
        borderRadius: '12px', overflow: 'hidden',
        background: '#0d0d0d', border: '1px solid #2a2a2a',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        {src ? (
          <>
            <img
              src={src} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 55%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
            {badge && (
              <div style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '9px', fontWeight: 800, color: '#00B5AD', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(0,181,173,0.5)', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {badge}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '18px', left: '18px', maxWidth: '50%' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.9)', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                {title || 'Гарчиг энд харагдана'}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ background: 'rgba(255,255,255,0.95)', color: '#000', fontSize: '10px', fontWeight: 700, padding: '5px 14px', borderRadius: '4px' }}>▶ ҮЗЭХ</div>
                <div style={{ background: 'rgba(90,90,90,0.8)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '5px 14px', borderRadius: '4px' }}>ⓘ ДЭЛГЭРЭНГҮЙ</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ fontSize: '36px', opacity: 0.08 }}>🖼️</div>
            <p style={{ fontSize: '12px', color: '#374151', margin: 0, textAlign: 'center' }}>Зурагний preview энд том харагдана<br /><span style={{ fontSize: '10px', color: '#1f2937' }}>Зурагны URL эсвэл файл нэмнэ үү</span></p>
          </div>
        )}
      </div>
      {src && <p style={{ fontSize: '10px', color: '#4b5563', margin: '8px 0 0' }}>✓ object-fit: cover · object-position: center top</p>}
    </div>
  );
}
