/**
 * Client-side WebP compression via Canvas API.
 * Zero dependencies — runs in the browser before Supabase upload.
 *
 * Usage:
 *   const compressed = await compressImage(file, { preset: 'article' });
 *   // → File (WebP, <200KB target)
 */

export type ImagePreset = 'article' | 'course' | 'avatar' | 'inline';

interface CompressOptions {
  preset: ImagePreset;
  quality?: number; // 0–1, default 0.82
}

const PRESETS: Record<ImagePreset, { w: number; h: number; maxKB: number }> = {
  article:  { w: 1280, h: 720,  maxKB: 200 },  // course posters + article headers (16:9)
  course:   { w: 1280, h: 720,  maxKB: 200 },  // same as article
  avatar:   { w: 400,  h: 400,  maxKB: 50  },  // instructor 1:1
  inline:   { w: 1200, h: 630,  maxKB: 150 },  // in-article inline images
};

export async function compressImage(
  file: File,
  { preset, quality = 0.82 }: CompressOptions,
): Promise<File> {
  const { w: targetW, h: targetH } = PRESETS[preset];

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale to fit inside target box, maintaining aspect ratio
      const srcRatio = img.width / img.height;
      const tgtRatio = targetW / targetH;

      let drawW: number, drawH: number;
      if (srcRatio > tgtRatio) {
        // source is wider — fit by height
        drawH = targetH;
        drawW = Math.round(targetH * srcRatio);
      } else {
        // source is taller — fit by width
        drawW = targetW;
        drawH = Math.round(targetW / srcRatio);
      }

      // Centre-crop to exact target dimensions
      const offsetX = Math.round((drawW - targetW) / 2);
      const offsetY = Math.round((drawH - targetH) / 2);

      const canvas = document.createElement('canvas');
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, -offsetX, -offsetY, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
          resolve(new File([blob], name, { type: 'image/webp' }));
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Human-readable file size */
export function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** Check against preset's max KB, return error string or null */
export function checkSize(file: File, preset: ImagePreset): string | null {
  const maxBytes = PRESETS[preset].maxKB * 1024;
  if (file.size > maxBytes) {
    return `Зургийн хэмжээ ${PRESETS[preset].maxKB}KB-аас хэтэрлээ (${fmtSize(file.size)}). Автоматаар шахагдаж байна...`;
  }
  return null;
}
