'use client';
import { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback: select text from a temporary input
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.2)'}`,
        color: copied ? '#10b981' : '#9ca3af',
        borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {copied ? '✅ Хуулагдлаа!' : '🔗 Линк хуулах'}
    </button>
  );
}
