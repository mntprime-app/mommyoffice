'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import { uploadImage } from '@/app/actions/admin';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  folder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Нийтлэлийн агуулга энд бичнэ...', folder = 'articles' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'mo-link' } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'mo-tiptap-body',
        spellcheck: 'false',
      },
    },
  });

  // Sync external value changes (e.g. edit page loading data)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const addImage = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const { url, error } = await uploadImage(fd, folder);
      if (url) editor.chain().focus().setImage({ src: url }).run();
      else alert('Зураг upload хийхэд алдаа: ' + error);
    };
    input.click();
  }, [editor, folder]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL оруулна уу:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '5px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '13px', lineHeight: 1,
    background: active ? '#00B5AD' : '#2a2a2a',
    color: active ? '#fff' : '#bbb',
    transition: 'all 0.12s',
    minWidth: '30px',
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

        {/* History */}
        <button type="button" title="Буцаах" style={btn(false)} onClick={() => editor.chain().focus().undo().run()}>↩</button>
        <button type="button" title="Дахин хийх" style={btn(false)} onClick={() => editor.chain().focus().redo().run()}>↪</button>
        <div style={sep} />

        {/* Headings */}
        <button type="button" title="Дэд гарчиг 1" style={btn(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" title="Дэд гарчиг 2" style={btn(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <div style={sep} />

        {/* Inline marks */}
        <button type="button" title="Тод (Bold)" style={{ ...btn(editor.isActive('bold')), fontWeight: 900 }}
          onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" title="Налуу (Italic)" style={{ ...btn(editor.isActive('italic')), fontStyle: 'italic' }}
          onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" title="Доогуур зураас" style={{ ...btn(editor.isActive('underline')), textDecoration: 'underline' }}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button type="button" title="Тодруулах" style={{ ...btn(editor.isActive('highlight')), background: editor.isActive('highlight') ? '#fbbf24' : '#2a2a2a', color: editor.isActive('highlight') ? '#000' : '#bbb' }}
          onClick={() => editor.chain().focus().toggleHighlight().run()}>★</button>
        <div style={sep} />

        {/* Lists */}
        <button type="button" title="Цэгтэй жагсаалт" style={btn(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>• —</button>
        <button type="button" title="Дугаарлагдсан жагсаалт" style={btn(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
        <button type="button" title="Иш татах" style={btn(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;</button>
        <div style={sep} />

        {/* Alignment */}
        <button type="button" title="Зүүн" style={btn(editor.isActive({ textAlign: 'left' }))}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬜L</button>
        <button type="button" title="Төв" style={btn(editor.isActive({ textAlign: 'center' }))}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡C</button>
        <button type="button" title="Баруун" style={btn(editor.isActive({ textAlign: 'right' }))}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>R⬜</button>
        <button type="button" title="Тэгш" style={btn(editor.isActive({ textAlign: 'justify' }))}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}>≡≡</button>
        <div style={sep} />

        {/* Link & Image */}
        <button type="button" title="Холбоос" style={btn(editor.isActive('link'))} onClick={setLink}>🔗</button>
        <button type="button" title="Зураг оруулах" style={btn(false)} onClick={addImage}>🖼</button>
        <div style={sep} />

        {/* Clear */}
        <button type="button" title="Формат арилгах" style={btn(false)}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>✕</button>
      </div>

      {/* ── EDITOR BODY ── */}
      <EditorContent editor={editor} />

      <style>{`
        .mo-tiptap-body {
          min-height: 280px;
          padding: 16px 18px;
          outline: none;
          color: #e5e5e5;
          font-size: 15px;
          line-height: 1.75;
          font-family: inherit;
        }
        .mo-tiptap-body p { margin: 0 0 1rem; }
        .mo-tiptap-body h2 { font-size: 1.3rem; font-weight: 800; color: #fff; margin: 1.5rem 0 0.6rem; border-bottom: 1px solid #2a2a2a; padding-bottom: 4px; }
        .mo-tiptap-body h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 1.2rem 0 0.4rem; }
        .mo-tiptap-body strong { color: #fff; font-weight: 700; }
        .mo-tiptap-body em { font-style: italic; color: #c8c8c8; }
        .mo-tiptap-body u { text-decoration: underline; }
        .mo-tiptap-body mark { background: #fbbf24; color: #000; border-radius: 3px; padding: 0 3px; }
        .mo-tiptap-body ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
        .mo-tiptap-body ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
        .mo-tiptap-body li { margin-bottom: 4px; }
        .mo-tiptap-body blockquote { border-left: 4px solid #00B5AD; margin: 1.5rem 0; padding: 0.75rem 1.25rem; background: rgba(0,181,173,0.07); border-radius: 0 8px 8px 0; font-style: italic; color: #aaa; }
        .mo-tiptap-body a.mo-link { color: #00B5AD; text-decoration: underline; }
        .mo-tiptap-body img { max-width: 100%; border-radius: 8px; margin: 1rem 0; display: block; }
        .mo-tiptap-body p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #4b5563; pointer-events: none; height: 0; }
        .mo-tiptap-body:focus { outline: none; }
      `}</style>
    </div>
  );
}
