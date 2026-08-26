'use client';

import { useRef, useCallback } from 'react';
import { uploadImage } from '@/app/actions/admin';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  folder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'HTML эсвэл энгийн текст...', folder = 'articles' }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

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

  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const { url, error } = await uploadImage(fd, folder);
      if (url) {
        const ta = ref.current;
        if (!ta) return;
        const pos  = ta.selectionStart;
        const tag  = `<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:1rem 0;" />`;
        const next = ta.value.slice(0, pos) + tag + ta.value.slice(pos);
        onChange(next);
      } else {
        alert('Зураг upload хийхэд алдаа: ' + error);
      }
    };
    input.click();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, value]);

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

      {/* ── TOOLBAR ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '10px 12px',
        borderBottom: '1px solid #2a2a2a', background: '#141414', alignItems: 'center',
      }}>
        <button type="button" title="Bold" style={btn({ fontWeight: 900 })} onClick={() => wrap('<strong>', '</strong>')}><b>B</b></button>
        <button type="button" title="Italic" style={btn({ fontStyle: 'italic' })} onClick={() => wrap('<em>', '</em>')}><i>I</i></button>
        <button type="button" title="Underline" style={btn({ textDecoration: 'underline' })} onClick={() => wrap('<u>', '</u>')}>U</button>
        <div style={sep} />
        <button type="button" title="H2 гарчиг" style={btn()} onClick={() => wrap('<h2>', '</h2>')}>H2</button>
        <button type="button" title="H3 гарчиг" style={btn()} onClick={() => wrap('<h3>', '</h3>')}>H3</button>
        <div style={sep} />
        <button type="button" title="Параграф" style={btn()} onClick={() => wrap('<p>', '</p>')}>&lt;p&gt;</button>
        <button type="button" title="Цэгтэй жагсаалт" style={btn()} onClick={() => wrap('<ul>\n  <li>', '</li>\n</ul>')}>• —</button>
        <button type="button" title="List item" style={btn()} onClick={() => wrap('<li>', '</li>')}>&lt;li&gt;</button>
        <button type="button" title="Иш татах" style={btn()} onClick={() => wrap('<blockquote>', '</blockquote>')}>&ldquo;</button>
        <div style={sep} />
        <button type="button" title="Холбоос" style={btn()} onClick={addLink}>🔗</button>
        <button type="button" title="Зураг оруулах" style={btn()} onClick={addImage}>🖼</button>
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

      <div style={{ padding: '6px 14px', borderTop: '1px solid #1f1f1f', fontSize: '11px', color: '#444', background: '#111' }}>
        HTML · Текст сонгоод товч дарж формат хийнэ
      </div>
    </div>
  );
}
