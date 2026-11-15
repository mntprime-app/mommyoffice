'use client';

import { useRef, useCallback, useState } from 'react';
import { uploadImage } from '@/app/actions/admin';
import { compressImage } from '@/lib/imageCompress';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  folder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'HTML эсвэл энгийн текст...',
  folder = 'articles',
}: Props) {
  const ref          = useRef<HTMLTextAreaElement>(null);
  // React-managed hidden file input — avoids React #441 (Server Action called
  // from native DOM onchange handler, not a React synthetic event)
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // ── Wrap selected text with open/close tags ───────────────────────────────
  function wrap(open: string, close: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = ta.value.slice(start, end);
    const next  = ta.value.slice(0, start) + open + (sel || '...') + close + ta.value.slice(end);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + open.length, start + open.length + (sel || '...').length);
    }, 0);
  }

  const addLink = useCallback(() => {
    const url = window.prompt('URL оруулна уу:', 'https://');
    if (!url) return;
    wrap(`<a href="${url}">`, '</a>');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Trigger the React-managed file input (not a programmatic DOM element)
  const addImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  // ── File selected — runs inside a React synthetic onChange ────────────────
  // This is what fixed React #441: Server Actions must be called from React's
  // event system, not from native DOM event handlers.
  const handleImageFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected on a subsequent click
    e.target.value = '';

    setUploading(true);
    try {
      // ── Compress to WebP before upload ──────────────────────────────────
      let uploadFile: File = file;
      try {
        uploadFile = await compressImage(file, { preset: 'inline', quality: 0.85 });
      } catch {
        // Compression failed — upload original
        uploadFile = file;
      }

      const fd = new FormData();
      fd.append('file', uploadFile);
      const { url, error } = await uploadImage(fd, folder);

      if (url) {
        const ta  = ref.current;
        if (!ta) return;
        const pos = ta.selectionStart ?? ta.value.length;
        const tag = `<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:1rem 0;" />`;
        const next = ta.value.slice(0, pos) + tag + ta.value.slice(pos);
        onChange(next);
      } else {
        alert('Зураг upload хийхэд алдаа: ' + error);
      }
    } catch (err) {
      alert('Зураг upload хийхэд алдаа: ' + (err instanceof Error ? err.message : 'Тодорхойгүй алдаа'));
    } finally {
      setUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, onChange]);

  // ── Style helpers ─────────────────────────────────────────────────────────
  const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '13px', lineHeight: 1,
    background: '#2a2a2a', color: '#bbb',
    transition: 'background 0.1s',
    ...extra,
  });

  const sep: React.CSSProperties = {
    width: '1px', background: '#333', alignSelf: 'stretch', margin: '0 2px',
  };

  return (
    <div style={{ border: '1px solid #333', borderRadius: '10px', overflow: 'hidden', background: '#1a1a1a' }}>

      {/* Hidden React-managed file input — onChange is a React synthetic event,
          so calling uploadImage (Server Action) from here is safe in React 19 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFile}
      />

      {/* ── TOOLBAR ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '10px 12px',
        borderBottom: '1px solid #2a2a2a', background: '#141414', alignItems: 'center',
      }}>
        <button type="button" title="Bold"      style={btn({ fontWeight: 900 })}           onClick={() => wrap('<strong>', '</strong>')}><b>B</b></button>
        <button type="button" title="Italic"    style={btn({ fontStyle: 'italic' })}        onClick={() => wrap('<em>', '</em>')}><i>I</i></button>
        <button type="button" title="Underline" style={btn({ textDecoration: 'underline' })} onClick={() => wrap('<u>', '</u>')}>U</button>
        <div style={sep} />
        <button type="button" title="H2 гарчиг" style={btn()} onClick={() => wrap('<h2>', '</h2>')}>H2</button>
        <button type="button" title="H3 гарчиг" style={btn()} onClick={() => wrap('<h3>', '</h3>')}>H3</button>
        <div style={sep} />
        <button type="button" title="Параграф"       style={btn()} onClick={() => wrap('<p>', '</p>')}>&lt;p&gt;</button>
        <button type="button" title="Цэгтэй жагсаалт" style={btn()} onClick={() => wrap('<ul>\n  <li>', '</li>\n</ul>')}>• —</button>
        <button type="button" title="List item"       style={btn()} onClick={() => wrap('<li>', '</li>')}>&lt;li&gt;</button>
        <button type="button" title="Иш татах"        style={btn()} onClick={() => wrap('<blockquote>', '</blockquote>')}>&ldquo;</button>
        <div style={sep} />
        <button type="button" title="Холбоос"   style={btn()} onClick={addLink}>🔗</button>
        <button
          type="button"
          title="Зураг оруулах"
          style={btn({ opacity: uploading ? 0.5 : 1, cursor: uploading ? 'wait' : 'pointer' })}
          onClick={addImage}
          disabled={uploading}
        >
          {uploading ? '⏳' : '🖼'}
        </button>
      </div>

      {/* ── EDITOR ── */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          width: '100%', minHeight: '300px', padding: '16px 18px',
          background: 'transparent', color: '#e5e5e5', border: 'none', outline: 'none',
          fontSize: '13px', lineHeight: 1.75, fontFamily: '"Fira Code", "Cascadia Code", monospace',
          resize: 'vertical', boxSizing: 'border-box',
        }}
      />

      <div style={{ padding: '6px 14px', borderTop: '1px solid #1f1f1f', fontSize: '11px', color: '#444', background: '#111', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span>HTML · Текст сонгоод товч дарж формат хийнэ</span>
        {uploading && <span style={{ color: '#00B5AD' }}>Зураг байршуулж байна...</span>}
      </div>
    </div>
  );
}
