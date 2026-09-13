'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { reactToVideo, getMyVideoReaction } from '@/app/actions/videos';
import { createClient } from '@/lib/supabase/client';

type ReactionType = 'super' | 'up' | 'down';

interface Props {
  videoId: string;
  initialSuper: number;
  initialUp: number;
  initialDown: number;
  locale: string;
}

export default function VideoReactions({
  videoId, initialSuper, initialUp, initialDown, locale,
}: Props) {
  const [counts, setCounts] = useState({
    super_likes_count: initialSuper,
    upvotes_count: initialUp,
    downvotes_count: initialDown,
  });
  // undefined = still loading auth, null = not logged in, object = logged in
  const [user, setUser] = useState<{ id: string } | null | undefined>(undefined);
  const [reacted, setReacted] = useState<ReactionType | null>(null);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setUser(null); return; }
      setUser(user);
      // Load any existing reaction — persists across sessions & devices
      const existing = await getMyVideoReaction(videoId);
      setReacted(existing);
    });
  }, [videoId]);

  async function handleReact(type: ReactionType) {
    if (clicking || reacted !== null || !user) return;
    setClicking(true);
    const { counts: updated, alreadyReacted } = await reactToVideo(videoId, type);
    if (alreadyReacted) {
      setReacted(type);
    } else if (updated) {
      setCounts(updated);
      setReacted(type);
    }
    setClicking(false);
  }

  const isLocked = reacted !== null || !user;

  const btn = (type: ReactionType): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', borderRadius: '999px',
    cursor: isLocked ? 'default' : 'pointer',
    fontSize: '15px', fontWeight: 700, transition: 'all 0.15s',
    background: reacted === type
      ? type === 'super' ? 'rgba(255,100,0,0.2)' : type === 'up' ? 'rgba(0,181,173,0.2)' : 'rgba(239,68,68,0.15)'
      : 'rgba(255,255,255,0.06)',
    color: reacted === type
      ? type === 'super' ? '#ff7a00' : type === 'up' ? '#00B5AD' : '#ef4444'
      : isLocked ? '#4b5563' : '#9ca3af',
    border: reacted === type
      ? type === 'super' ? '1px solid rgba(255,120,0,0.4)' : type === 'up' ? '1px solid rgba(0,181,173,0.4)' : '1px solid rgba(239,68,68,0.3)'
      : '1px solid transparent',
    transform: reacted === type ? 'scale(1.08)' : 'scale(1)',
    opacity: user === undefined ? 0.5 : 1,
  });

  return (
    <div style={{ marginTop: '0', marginBottom: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid #2a2a2a' }}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>
        {reacted ? 'Таны санал бүртгэгдлээ!' : 'Энэ видео танд таалагдсан уу?'}
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => handleReact('super')} disabled={isLocked || clicking} style={btn('super')}>
          🔥 <span style={{ fontSize: '13px' }}>{counts.super_likes_count}</span>
        </button>
        <button onClick={() => handleReact('up')} disabled={isLocked || clicking} style={btn('up')}>
          👍 <span style={{ fontSize: '13px' }}>{counts.upvotes_count}</span>
        </button>
        <button onClick={() => handleReact('down')} disabled={isLocked || clicking} style={btn('down')}>
          👎 <span style={{ fontSize: '13px' }}>{counts.downvotes_count}</span>
        </button>
        {user === null && (
          <Link
            href={`/${locale}/access`}
            style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', marginLeft: '4px', whiteSpace: 'nowrap' }}
          >
            Санал өгөхийн тулд нэвтрэнэ үү →
          </Link>
        )}
      </div>
    </div>
  );
}
