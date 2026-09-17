'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

type QuickRange = 'today' | '7d' | '30d' | 'month' | 'all';

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function rangeFor(key: QuickRange): { from: string; to: string } | null {
  const now = new Date();
  const today = toISO(now);
  if (key === 'today') return { from: today, to: today };
  if (key === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: toISO(d), to: today }; }
  if (key === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); return { from: toISO(d), to: today }; }
  if (key === 'month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); return { from: toISO(d), to: today }; }
  return null; // 'all'
}

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'today', label: 'Өнөөдөр' },
  { key: '7d', label: '7 хоног' },
  { key: '30d', label: '30 хоног' },
  { key: 'month', label: 'Энэ сар' },
  { key: 'all', label: 'Бүгд' },
];

const STATUS_OPTS = [
  { value: 'all', label: 'Бүх статус' },
  { value: 'paid', label: 'Төлөгдсөн' },
  { value: 'pending', label: 'Хүлээгдэж байна' },
];

export function OrdersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const set = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all') params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, sp]);

  const currentFrom = sp.get('from') || '';
  const currentTo = sp.get('to') || '';
  const currentStatus = sp.get('status') || 'all';
  const currentQ = sp.get('q') || '';

  // Detect which quick range is active
  const activeQuick = (() => {
    for (const { key } of QUICK_RANGES) {
      if (key === 'all' && !currentFrom && !currentTo) return 'all';
      const r = rangeFor(key);
      if (r && r.from === currentFrom && r.to === currentTo) return key;
    }
    return currentFrom || currentTo ? 'custom' : 'all';
  })();

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: active ? 700 : 500,
    border: active ? '1px solid #00B5AD' : '1px solid #2a2a2a',
    background: active ? 'rgba(0,181,173,0.15)' : '#1a1a1a',
    color: active ? '#00B5AD' : '#9ca3af', cursor: 'pointer', transition: 'all .15s',
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #2a2a2a', background: '#161616' }}>
      {/* Quick range */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {QUICK_RANGES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              const r = rangeFor(key);
              set(r ? { from: r.from, to: r.to } : { from: null, to: null });
            }}
            style={btnStyle(activeQuick === key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <span style={{ color: '#2a2a2a', fontSize: '20px', userSelect: 'none' }}>|</span>

      {/* Custom date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="date" value={currentFrom}
          onChange={e => set({ from: e.target.value || null })}
          style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '13px', cursor: 'pointer' }}
        />
        <span style={{ color: '#6b7280', fontSize: '12px' }}>→</span>
        <input
          type="date" value={currentTo}
          onChange={e => set({ to: e.target.value || null })}
          style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '13px', cursor: 'pointer' }}
        />
      </div>

      {/* Divider */}
      <span style={{ color: '#2a2a2a', fontSize: '20px', userSelect: 'none' }}>|</span>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={e => set({ status: e.target.value })}
        style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '13px', cursor: 'pointer' }}
      >
        {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Search */}
      <input
        type="text" placeholder="Нэр эсвэл и-мэйл хайх…" value={currentQ}
        onChange={e => set({ q: e.target.value || null })}
        style={{ flex: 1, minWidth: '180px', padding: '6px 12px', borderRadius: '7px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '13px', outline: 'none' }}
      />

      {/* Clear */}
      {(currentFrom || currentTo || currentStatus !== 'all' || currentQ) && (
        <button
          onClick={() => set({ from: null, to: null, status: null, q: null })}
          style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #3f3f3f', background: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}
        >
          ✕ Цэвэрлэх
        </button>
      )}
    </div>
  );
}
