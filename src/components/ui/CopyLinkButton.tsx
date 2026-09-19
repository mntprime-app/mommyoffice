'use client';
import { useState } from 'react';

export default function CopyLinkButton({ url, style }: { url: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const copy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(copy).catch(() => fallback());
    } else {
      fallback();
    }
    function fallback() {
      try {
        const el = document.createElement('input');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        copy();
      } catch { /* silent */ }
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '6px 12px', borderRadius: '6px',
        background: copied ? 'rgba(16,185,129,0.15)' : '#1e1e1e',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : '#333'}`,
        color: copied ? '#10b981' : '#aaa',
        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {copied ? '✓ Хуулагдлаа!' : '🔗 Холбоос'}
    </button>
  );
}
