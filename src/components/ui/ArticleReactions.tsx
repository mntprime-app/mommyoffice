'use client';
import { useState } from 'react';
import { reactToArticle } from '@/app/actions/articles';

type ReactionType = 'super' | 'up' | 'down';

interface Props {
  articleId: string;
  initialSuper: number;
  initialUp: number;
  initialDown: number;
}

export default function ArticleReactions({ articleId, initialSuper, initialUp, initialDown }: Props) {
  const [counts, setCounts] = useState({
    super_likes_count: initialSuper,
    upvotes_count: initialUp,
    downvotes_count: initialDown,
  });
  const [reacted, setReacted] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReact(type: ReactionType) {
    if (loading || reacted) return; // one reaction per session
    setLoading(true);
    const { counts: updated } = await reactToArticle(articleId, type);
    if (updated) {
      setCounts(updated);
    } else {
      // optimistic fallback
      setCounts(prev => ({
        ...prev,
        [type === 'super' ? 'super_likes_count' : type === 'up' ? 'upvotes_count' : 'downvotes_count']:
          prev[type === 'super' ? 'super_likes_count' : type === 'up' ? 'upvotes_count' : 'downvotes_count'] + 1,
      }));
    }
    setReacted(type);
    setLoading(false);
  }

  const btn = (type: ReactionType, emoji: string, count: number): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', borderRadius: '999px', cursor: reacted ? 'default' : 'pointer',
    fontSize: '15px', fontWeight: 700, transition: 'all 0.15s',
    background: reacted === type
      ? type === 'super' ? 'rgba(255,100,0,0.2)' : type === 'up' ? 'rgba(0,181,173,0.2)' : 'rgba(239,68,68,0.15)'
      : 'rgba(255,255,255,0.06)',
    color: reacted === type
      ? type === 'super' ? '#ff7a00' : type === 'up' ? '#00B5AD' : '#ef4444'
      : reacted ? '#4b5563' : '#9ca3af',
    border: reacted === type
      ? type === 'super' ? '1px solid rgba(255,120,0,0.4)' : type === 'up' ? '1px solid rgba(0,181,173,0.4)' : '1px solid rgba(239,68,68,0.3)'
      : '1px solid transparent',
    transform: reacted === type ? 'scale(1.08)' : 'scale(1)',
  });

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #2a2a2a' }}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>
        {reacted ? 'Таны санал бүртгэгдлээ!' : 'Энэ нийтлэл танд таалагдсан уу?'}
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => handleReact('super')} disabled={!!reacted || loading} style={btn('super', '🔥', counts.super_likes_count)}>
          🔥 <span style={{ fontSize: '13px' }}>{counts.super_likes_count}</span>
        </button>
        <button onClick={() => handleReact('up')} disabled={!!reacted || loading} style={btn('up', '👍', counts.upvotes_count)}>
          👍 <span style={{ fontSize: '13px' }}>{counts.upvotes_count}</span>
        </button>
        <button onClick={() => handleReact('down')} disabled={!!reacted || loading} style={btn('down', '👎', counts.downvotes_count)}>
          👎 <span style={{ fontSize: '13px' }}>{counts.downvotes_count}</span>
        </button>
      </div>
    </div>
  );
}
