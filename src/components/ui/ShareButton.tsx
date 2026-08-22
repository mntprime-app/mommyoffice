'use client';
import { useState } from 'react';

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl   = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shares = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: '#1877f2',
      icon: 'f',
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: '#000',
      icon: '𝕏',
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: '#0a66c2',
      icon: 'in',
    },
  ];

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', color: '#666' }}>Хуваалцах:</span>
      {shares.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={s.label}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: s.color, color: '#fff',
            fontSize: '11px', fontWeight: 800, textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          {s.icon}
        </a>
      ))}
      <button
        onClick={copyLink}
        title="Холбоосыг хуулах"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '5px 12px', borderRadius: '20px',
          background: copied ? '#10b981' : 'rgba(255,255,255,0.08)',
          color: copied ? '#fff' : '#aaa',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Хуулагдлаа' : '🔗 Холбоос хуулах'}
      </button>
    </div>
  );
}
