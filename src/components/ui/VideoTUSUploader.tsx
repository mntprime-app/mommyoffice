'use client';
/**
 * VideoTUSUploader — Direct Cloudflare Stream TUS upload (no Supabase Storage)
 *
 * Flow:
 *  1. User picks a video file (validated: ≤4 GB, .mp4/.mov/.mkv/.webm)
 *  2. POST /api/video/request-upload → { uploadUrl, videoUid }
 *  3. TUS chunked PATCH directly to CF Stream (50 MB chunks)
 *  4. onUploaded(videoUid) — parent stores stream_id and sets video_status='approved' instantly
 *
 * Auto-approval: no pending gate — videos publish immediately on upload.
 * Max file size: 4 GB (Kajabi standard).
 */

import { useRef, useState, useCallback } from 'react';

const MAX_FILE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB (Kajabi standard)
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
const ACCEPTED_EXT = '.mp4, .mov, .mkv, .webm';
const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB per chunk

interface Props {
  onUploaded: (streamId: string, fileName: string, fileSize: number) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}

export default function VideoTUSUploader({ onUploaded, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  function preCheck(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|mkv|webm)$/i)) {
      return 'Зөвшөөрөгдсөн формат: MP4, MOV, MKV, WebM';
    }
    if (file.size > MAX_FILE_BYTES) {
      return '⚠️ Файлын хэмжээ хэтэрсэн байна. Дээд хэмжээ 4GB (Kajabi стандарт).';
    }
    return null;
  }

  async function tusUpload(file: File, uploadUrl: string): Promise<void> {
    const totalSize = file.size;
    let offset = 0;
    while (offset < totalSize) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
          'Upload-Length': String(totalSize),
          'Tus-Resumable': '1.0.0',
        },
        body: chunk,
      });
      if (!res.ok && res.status !== 204) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Upload chunk failed (HTTP ${res.status}${errText ? ': ' + errText.slice(0, 120) : ''})`);
      }
      offset += chunk.size;
      setProgress(Math.min(Math.round((offset / totalSize) * 100), 99));
    }
  }

  const handleFile = useCallback(async (file: File) => {
    setErrMsg('');
    const preErr = preCheck(file);
    if (preErr) { setErrMsg(preErr); onError?.(preErr); return; }

    setUploading(true);
    setProgress(0);
    setStatusMsg('Байршуулах хаягийг бэлдэж байна...');

    let uploadUrl = '';
    let videoUid = '';

    try {
      const res = await fetch('/api/video/request-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: file.name, fileSize: file.size }),
      });
      if (!res.ok) throw new Error('Upload URL request failed');
      const data = await res.json() as { uploadUrl: string; videoUid: string };
      uploadUrl = data.uploadUrl;
      videoUid = data.videoUid;
    } catch {
      const msg = 'Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
      setErrMsg(msg); setUploading(false); onError?.(msg); return;
    }

    setStatusMsg('Видео байршуулж байна...');
    try {
      await tusUpload(file, uploadUrl);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const msg = detail || 'Байршуулах явцад алдаа гарлаа. Дахин оролдоно уу.';
      setErrMsg(msg); setUploading(false); onError?.(msg); return;
    }

    setUploading(false);
    onUploaded(videoUid, file.name, file.size);
    // Parent auto-approves and transitions to STATE C (green) — this component will unmount
  }, [onUploaded, onError]);

  function reset() { setErrMsg(''); setProgress(0); setStatusMsg(''); }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        disabled={disabled}
      />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid #00B5AD', borderTopColor: 'transparent',
              animation: 'vtu-spin 0.8s linear infinite', flexShrink: 0,
            }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{statusMsg}</span>
          </div>
          {progress > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#00B5AD', transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0 }}>{progress}%</span>
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#6b7280' }}>Хуудсыг хаахгүй байна уу</div>
        </div>
      ) : errMsg ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#f87171' }}>❌ {errMsg}</span>
          <button type="button" onClick={reset} style={{
            background: '#374151', color: '#9ca3af', border: 'none', borderRadius: '5px',
            padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 700,
          }}>Дахин оролдох</button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          style={{
            background: '#00B5AD', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '7px 14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          📁 Видео файл сонгох
        </button>
      )}

      <style>{`@keyframes vtu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
