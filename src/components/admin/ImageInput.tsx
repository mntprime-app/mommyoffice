'use client';
import { useState } from 'react';
import { compressImage, fmtSize } from '@/lib/imageCompress';
import { uploadImage } from '@/app/actions/admin';

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  folder: 'articles' | 'courses' | 'videos';
  hint?: string;
}

export default function ImageInput({ value, onChange, folder, hint }: ImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const defaultHint = folder === 'articles'
    ? '💡 Зөвлөмж: 1200×630px (16:9, макс 5MB)'
    : folder === 'courses'
    ? '💡 Зөвлөмж: 1280×720px (HD 16:9, макс 5MB)'
    : '💡 Зөвлөмж: 1280×720px (HD 16:9, макс 5MB)';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploading(true); setIsError(false);
    setStatus('Зургийг шахаж байна...');
    try {
      const file = await compressImage(raw, { preset: folder === 'articles' ? 'article' : 'course' });
      setStatus(`✓ Шахагдсан: ${fmtSize(raw.size)} → ${fmtSize(file.size)} (WebP)`);
      const fd = new FormData();
      fd.append('file', file);
      const { error, url } = await uploadImage(fd, folder);
      if (error || !url) {
        setIsError(true);
        setStatus(`Upload алдаа: ${error ?? 'URL хоосон'}`);
      } else {
        onChange(url);
        setStatus('✓ Амжилттай upload хийлээ');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch {
      setIsError(true);
      setStatus('Зураг upload хийхэд алдаа гарлаа.');
    }
    setUploading(false);
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: '8px',
    border: '1px solid #333', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none', background: '#2a2a2a',
    color: '#e5e5e5', fontFamily: 'inherit',
  };

  return (
    <div>
      <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>{hint || defaultHint}</p>

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <img
            src={value}
            alt="preview"
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '10px', border: '2px dashed #00B5AD', display: 'block' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px'
            }}
          >
            Зураг арилгах ✕
          </button>
        </div>
      )}

      {/* Dual input row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: uploading ? '#374151' : '#2a2a2a',
          border: '1px solid #333', color: '#e5e5e5',
          padding: '9px 16px', borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {uploading ? '⏳ Uploading...' : '📁 Зураг upload'}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setStatus(''); }}
          placeholder="https://... (URL-аар оруулах)"
          style={{ ...inp, flex: 1, minWidth: '180px' }}
        />
      </div>

      {/* Status */}
      {status && (
        <p style={{
          fontSize: '12px', marginTop: '6px', padding: '6px 12px', borderRadius: '6px',
          background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          color: isError ? '#fca5a5' : '#6ee7b7', margin: '6px 0 0',
        }}>
          {status}
        </p>
      )}
    </div>
  );
}
