'use client';
/**
 * VideoStagingUploader
 *
 * Uploads a lesson video file to Supabase Storage (course-staging bucket) using a
 * server-generated signed upload URL. The instructor never sees raw CF Stream IDs.
 *
 * Flow:
 *  1. Instructor clicks "📁 Видео файл сонгох"
 *  2. POST /api/course-staging/presign → { token, storagePath }
 *  3. supabase.storage.uploadToSignedUrl(...) → direct upload to Supabase
 *  4. onStaged(storagePath, filename) called on success
 */

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'course-staging';
const MAX_SIZE_MB = 2048; // 2 GB practical limit

interface Props {
  courseId: string;
  moduleIdx: number;
  lessonIdx: number;
  onStaged: (storagePath: string, filename: string, fileBytes: number) => void;
  onError: (msg: string) => void;
}

export default function VideoStagingUploader({ courseId, moduleIdx, lessonIdx, onStaged, onError }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileBytesRef = useRef(0);

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      onError('Зөвхөн видео файл оруулна уу (mp4, mov, ...)');
      return;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_SIZE_MB) {
      onError(`Файлын хэмжээ хэтэрсэн (${MAX_SIZE_MB} MB хүртэл)`);
      return;
    }

    fileBytesRef.current = file.size;
    setUploading(true);
    setProgress(0);
    setStatusMsg('Байршуулах URL авч байна...');

    // 1. Get signed upload URL from our API
    let token = '';
    let storagePath = '';
    try {
      const res = await fetch('/api/course-staging/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          courseId,
          mi: moduleIdx,
          li: lessonIdx,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Presign failed');
      token = json.token;
      storagePath = json.storagePath;
    } catch (e: unknown) {
      setUploading(false);
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Bucket not found') || msg.includes('bucket') || msg.includes('404')) {
        onError('⚠️ Сүлжээний алдаа: Supabase Storage bucket тохируулаагүй байна. Admin: "course-staging" bucket үүсгэнэ үү.');
      } else {
        onError(msg || 'Байршуулах URL авахад алдаа гарлаа');
      }
      return;
    }

    setStatusMsg('Видео байршуулж байна...');

    // 2. Upload directly to Supabase Storage using signed URL
    const supabase = createClient();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(storagePath, token, file, {
        contentType: file.type,
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

    setUploading(false);

    if (uploadErr) {
      const msg = uploadErr.message ?? '';
      if (msg.includes('Bucket not found') || msg.includes('bucket') || msg.includes('not found')) {
        onError('⚠️ Сүлжээний алдаа: Supabase Storage bucket тохируулаагүй байна. Admin: "course-staging" bucket үүсгэнэ үү.');
      } else {
        onError(msg || 'Байршуулахад алдаа гарлаа. Дахин оролдоно уу.');
      }
      return;
    }

    setStatusMsg('');
    setProgress(0);
    onStaged(storagePath, file.name, fileBytesRef.current);
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid #00B5AD', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite', flexShrink: 0,
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
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            background: '#00B5AD', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '7px 14px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
          }}
        >
          📁 Видео файл сонгох
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
