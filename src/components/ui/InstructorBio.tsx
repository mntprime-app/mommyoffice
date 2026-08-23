'use client';
import { useState } from 'react';

export function InstructorBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = bio.length > 280;

  const baseStyle: React.CSSProperties = {
    fontSize: '14px', color: '#888', lineHeight: 1.75, margin: '0 0 6px',
  };
  const clampStyle: React.CSSProperties = {
    ...baseStyle,
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  };

  return (
    <div>
      <p style={expanded ? baseStyle : clampStyle}>
        {bio}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: '#00B5AD', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {expanded ? 'Хураах ↑' : 'Цааш унших... ↓'}
        </button>
      )}
    </div>
  );
}
