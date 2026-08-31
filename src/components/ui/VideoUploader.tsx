'use client';
/**
 * VideoUploader — MommyOffice branded video upload component
 *
 * Flow:
 *  1. Teacher drags/drops or selects a file
 *  2. Browser pre-checks resolution, duration, format, file size instantly
 *  3. If pre-check passes → requests one-time upload URL from /api/video/request-upload
 *  4. Uploads file to Cloudflare Stream via TUS chunked protocol (no extra package needed)
 *  5. Shows MommyOffice branded progress bar throughout
 *  6. On complete → calls onSuccess(videoUid) so parent can save the CF video UID
 *
 * Cloudflare is completely invisible to the teacher.
 *
 * Props:
 *   onSuccess(videoUid: string) — called when upload completes
 *   onError(msg: string)        — called on any fatal error
 *   instructorId?: string       — stored as metadata in Cloudflare
 *   title?: string              — stored as metadata in Cloudflare
 *   disabled?: boolean
 */

import { useRef, useState, useCallback } from 'react';

// ── Quality standards (must match server-side webhook) ────────────────────────
const MIN_HEIGHT_PX  = 720;
const MIN_DURATION_S = 180;  // 3 minutes
const MAX_FILE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
const ACCEPTED_EXT   = '.mp4, .mov, .mkv, .webm';

// ── TUS chunk size: 50 MB ─────────────────────────────────────────────────────
const CHUNK_SIZE = 50 * 1024 * 1024;

type UploadStatus = 'idle' | 'checking' | 'uploading' | 'processing' | 'done' | 'error';

interface Props {
  onSuccess: (videoUid: string) => void;
  onError?: (msg: string) => void;
  instructorId?: string;
  title?: string;
  disabled?: boolean;
}

export default function VideoUploader({ onSuccess, onError, instructorId, title, disabled }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [status, setStatus]     = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage]   = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Client-side pre-check ──────────────────────────────────────────────────
  function preCheck(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      // Format check
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|mkv|webm)$/i)) {
        return resolve('Зөвшөөрөгдсөн формат: MP4, MOV, MKV, WebM');
      }
      // Size check
      if (file.size > MAX_FILE_BYTES) {
        return resolve('Файлын хэмжээ 10 GB-аас бага байх ёстой');
      }

      // Resolution + duration check via video element
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration < MIN_DURATION_S) {
          return resolve(`Видео дор хаяж 3 минут байх ёстой (одоогийн: ${Math.round(video.duration)}с)`);
        }
        if (video.videoHeight < MIN_HEIGHT_PX && video.videoHeight > 0) {
          return resolve(`Видеоны нарийвчлал дор хаяж 720p байх ёстой (одоогийн: ${video.videoHeight}p)`);
        }
        resolve(null); // all good
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('Видео файлыг уншиж чадсангүй. Файлаа шалгана уу.');
      };
      video.src = url;
    });
  }

  // ── TUS chunked upload (no external library) ───────────────────────────────
  async function tusUpload(file: File, uploadUrl: string): Promise<void> {
    const totalSize = file.size;
    let offset = 0;

    // Step 1: Check if server supports resumable (optional, CF always does)
    // Step 2: Upload chunks
    while (offset < totalSize) {
      const chunk     = file.slice(offset, offset + CHUNK_SIZE);
      const chunkSize = chunk.size;

      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
          'Tus-Resumable': '1.0.0',
          'Content-Length': String(chunkSize),
        },
        body: chunk,
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Upload chunk failed (status ${res.status})`);
      }

      offset += chunkSize;
      const pct = Math.min(Math.round((offset / totalSize) * 100), 99);
      setProgress(pct);
    }
  }

  // ── Main upload handler ────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setStatus('checking');
    setProgress(0);
    setMessage('Видеоны чанарыг шалгаж байна...');

    // 1. Pre-check
    const err = await preCheck(file);
    if (err) {
      setStatus('error');
      setMessage(err);
      onError?.(err);
      return;
    }

    // 2. Request one-time upload URL
    setStatus('uploading');
    setMessage('Байршуулах хаягийг бэлдэж байна...');

    let uploadUrl = '';
    let videoUid  = '';

    try {
      const res = await fetch('/api/video/request-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title ?? file.name,
          instructorId,
        }),
      });
      if (!res.ok) throw new Error('Upload URL request failed');
      const data = await res.json() as { uploadUrl: string; videoUid: string };
      uploadUrl = data.uploadUrl;
      videoUid  = data.videoUid;
    } catch {
      const msg = 'Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
      setStatus('error');
      setMessage(msg);
      onError?.(msg);
      return;
    }

    // 3. TUS upload
    setMessage('Видео байршуулж байна...');
    try {
      // First, initiate TUS upload with HEAD to get any existing offset
      const headRes = await fetch(uploadUrl, {
        method: 'HEAD',
        headers: { 'Tus-Resumable': '1.0.0' },
      });
      const existingOffset = parseInt(headRes.headers.get('Upload-Offset') ?? '0', 10);
      if (!isNaN(existingOffset) && existingOffset > 0) {
        // Resume from existing offset
        const partialFile = file.slice(existingOffset);
        await tusUpload(partialFile, uploadUrl);
      } else {
        await tusUpload(file, uploadUrl);
      }
    } catch {
      const msg = 'Байршуулах явцад алдаа гарлаа. Дахин оролдоно уу.';
      setStatus('error');
      setMessage(msg);
      onError?.(msg);
      return;
    }

    // 4. Done — Cloudflare is encoding, webhook will fire
    setProgress(100);
    setStatus('processing');
    setMessage('Видео боловсруулагдаж байна... (1–3 минут)');
    onSuccess(videoUid);
  }, [title, instructorId, onSuccess, onError]);

  // ── Drag and drop ──────────────────────────────────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || status === 'uploading') return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  }

  function reset() {
    setStatus('idle');
    setProgress(0);
    setMessage('');
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    wrap: {
      border: `2px dashed ${isDragOver ? '#00B5AD' : status === 'error' ? '#ef4444' : '#2a2a2a'}`,
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center' as const,
      background: isDragOver ? 'rgba(0,181,173,0.05)' : '#111',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    } as React.CSSProperties,
    icon: { fontSize: '2.5rem', marginBottom: '0.75rem' },
    title: { fontWeight: 800, fontSize: '15px', color: '#e5e5e5', marginBottom: '4px' },
    sub:   { fontSize: '12px', color: '#6b7280', lineHeight: 1.5 },
    btn: {
      display: 'inline-block', marginTop: '1rem',
      background: '#00B5AD', color: '#fff', border: 'none',
      padding: '9px 20px', borderRadius: '8px',
      fontWeight: 700, fontSize: '13px', cursor: 'pointer',
    } as React.CSSProperties,
    barWrap: { margin: '1rem 0 0.5rem', height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' },
    barFill: (pct: number, color: string) => ({
      height: '100%', width: `${pct}%`, background: color,
      borderRadius: '3px', transition: 'width 0.3s',
    }) as React.CSSProperties,
    msg: (color: string) => ({ fontSize: '12px', color, marginTop: '6px', fontWeight: 500 }),
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (status === 'done' || status === 'processing') {
    return (
      <div style={{ ...s.wrap, borderStyle: 'solid', borderColor: '#00B5AD' }}>
        <div style={s.icon}>✅</div>
        <div style={s.title}>Байршуулалт амжилттай!</div>
        <div style={s.sub}>{status === 'processing'
          ? 'Видео боловсруулагдаж байна. Бэлэн болмогц хуудас дээр харагдана (1–3 мин).'
          : 'Видео бэлэн боллоо.'}
        </div>
        <button style={{ ...s.btn, background: '#374151', marginTop: '12px' }} onClick={reset}>
          Өөр видео байршуулах
        </button>
      </div>
    );
  }

  if (status === 'uploading' || status === 'checking') {
    const color = status === 'checking' ? '#f59e0b' : '#00B5AD';
    return (
      <div style={s.wrap}>
        <div style={s.icon}>{status === 'checking' ? '🔍' : '⬆️'}</div>
        <div style={s.title}>
          {status === 'checking' ? 'Шалгаж байна...' : `Байршуулж байна... ${progress}%`}
        </div>
        <div style={s.barWrap}>
          <div style={s.barFill(status === 'checking' ? 10 : progress, color)} />
        </div>
        <div style={s.msg(color)}>{message}</div>
        <div style={{ ...s.sub, marginTop: '8px' }}>Хуудсыг хаахгүй байна уу</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ ...s.wrap, borderColor: '#ef4444', borderStyle: 'solid' }}>
        <div style={s.icon}>❌</div>
        <div style={{ ...s.title, color: '#f87171' }}>Видео шаардлага хангахгүй байна</div>
        <div style={{ ...s.sub, color: '#f87171', marginTop: '6px' }}>{message}</div>
        <button style={{ ...s.btn, background: '#374151', marginTop: '12px' }} onClick={reset}>
          Дахин оролдох
        </button>
      </div>
    );
  }

  // idle
  return (
    <div
      style={s.wrap}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        style={{ display: 'none' }}
        onChange={onInputChange}
        disabled={disabled}
      />
      <div style={s.icon}>🎬</div>
      <div style={s.title}>Видео байршуулах</div>
      <div style={s.sub}>
        Файлаа энд чирж тавих эсвэл сонгох<br />
        MP4, MOV, MKV · Дор хаяж 720p · Дор хаяж 3 минут · Хамгийн ихдээ 10 GB
      </div>
      <button style={s.btn} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
        Файл сонгох
      </button>
    </div>
  );
}
