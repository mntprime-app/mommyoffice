/**
 * CategoryBadge — single source of truth for category tags across all card types.
 * Inline-style only (no Tailwind — project standard).
 * Matches the Article section baseline: rounded-md (6px), teal, semi-transparent bg + border.
 */

const BADGE_STYLE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  color: '#00B5AD',
  background: 'rgba(0,181,173,0.12)',
  border: '1px solid rgba(0,181,173,0.35)',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  lineHeight: 1.5,
};

export function CategoryBadge({ text }: { text: string }) {
  return <span style={BADGE_STYLE}>{text}</span>;
}

/** Free / paid status pill — same shape as CategoryBadge, green or amber variant. */
export function StatusBadge({ type }: { type: string }) {
  const isFree = type === 'free';
  const style: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: isFree ? '#10b981' : '#f59e0b',
    background: isFree ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
    border: isFree ? '1px solid rgba(16,185,129,0.30)' : '1px solid rgba(251,191,36,0.30)',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    lineHeight: 1.5,
  };
  return <span style={style}>{isFree ? 'Үнэгүй' : 'Гишүүн'}</span>;
}

/** Price badge for courses — free = green, paid = teal with ₮ amount. */
export function PriceBadge({ price }: { price: number }) {
  const isFree = price === 0;
  const style: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: isFree ? '#10b981' : '#00B5AD',
    background: isFree ? 'rgba(16,185,129,0.12)' : 'rgba(0,181,173,0.12)',
    border: isFree ? '1px solid rgba(16,185,129,0.30)' : '1px solid rgba(0,181,173,0.30)',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    lineHeight: 1.5,
  };
  return <span style={style}>{isFree ? 'Үнэгүй' : `${price.toLocaleString()}₮`}</span>;
}
