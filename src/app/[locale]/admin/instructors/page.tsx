'use client';
import { useState, useEffect } from 'react';
import { listInstructors, approveInstructor, suspendInstructor, deleteInstructorById } from '@/app/actions/admin';

type Instructor = {
  id: string;
  name_mn: string;
  name_en: string | null;
  title_mn: string | null;
  title_en: string | null;
  bio_mn: string | null;
  bio_en: string | null;
  profile_image_url: string | null;
  subscription_status: string | null;
  is_approved: boolean;
  approved_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  user_id: string | null;
};

const STATUS_FILTER = ['all', 'pending', 'active', 'suspended'] as const;

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Instructor | null>(null);

  async function load() {
    setLoading(true);
    const data = await listInstructors();
    setInstructors(data as Instructor[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    setBusy(id);
    await approveInstructor(id);
    await load();
    setBusy(null);
    if (selected?.id === id) setSelected((s) => s ? { ...s, is_approved: true, subscription_status: 'active' } : null);
  }

  async function handleSuspend(id: string) {
    setBusy(id);
    await suspendInstructor(id);
    await load();
    setBusy(null);
    if (selected?.id === id) setSelected((s) => s ? { ...s, is_approved: false, subscription_status: 'suspended' } : null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" багшийг бүрмөсөн устгах уу?`)) return;
    setBusy(id);
    await deleteInstructorById(id);
    setSelected(null);
    await load();
    setBusy(null);
  }

  const filtered = instructors.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !i.is_approved && i.subscription_status !== 'suspended';
    if (filter === 'active') return i.is_approved && i.subscription_status === 'active';
    if (filter === 'suspended') return i.subscription_status === 'suspended';
    return true;
  });

  const counts = {
    all: instructors.length,
    pending: instructors.filter((i) => !i.is_approved && i.subscription_status !== 'suspended').length,
    active: instructors.filter((i) => i.is_approved && i.subscription_status === 'active').length,
    suspended: instructors.filter((i) => i.subscription_status === 'suspended').length,
  };

  function statusBadge(inst: Instructor) {
    if (inst.is_approved && inst.subscription_status === 'active') {
      return <span style={badge('#10b981', 'rgba(16,185,129,0.15)')}>✓ Идэвхтэй</span>;
    }
    if (inst.subscription_status === 'suspended') {
      return <span style={badge('#ef4444', 'rgba(239,68,68,0.15)')}>✕ Түтгэлзүүлсэн</span>;
    }
    return <span style={badge('#f59e0b', 'rgba(245,158,11,0.15)')}>⏳ Хүлээгдэж байна</span>;
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.3rem' }}>Admin / Багш нар</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Багш нарын удирдлага</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {counts.pending > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
              ⏳ {counts.pending} шинэ хүсэлт
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', borderBottom: '1px solid #2a2a2a', paddingBottom: '0' }}>
        {STATUS_FILTER.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontSize: '13px', fontWeight: 600,
            color: filter === f ? '#00B5AD' : '#6b7280',
            borderBottom: filter === f ? '2px solid #00B5AD' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {f === 'all' ? 'Бүгд' : f === 'pending' ? 'Хүлээгдэж байна' : f === 'active' ? 'Идэвхтэй' : 'Түтгэлзүүлсэн'}
            <span style={{ marginLeft: '6px', background: '#2a2a2a', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', color: '#9ca3af' }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Instructor list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ color: '#6b7280', padding: '2rem', textAlign: 'center' }}>Ачааллаж байна...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: '#6b7280', padding: '2rem', textAlign: 'center', border: '1px dashed #2a2a2a', borderRadius: '12px' }}>
              {filter === 'pending' ? 'Шинэ хүсэлт байхгүй байна' : 'Багш олдсонгүй'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((inst) => (
                <div key={inst.id}
                  onClick={() => setSelected(inst)}
                  style={{
                    border: `1px solid ${selected?.id === inst.id ? '#00B5AD' : '#2a2a2a'}`,
                    borderRadius: '12px', background: selected?.id === inst.id ? 'rgba(0,181,173,0.05)' : '#1a1a1a',
                    padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'center',
                    transition: 'border-color 0.15s',
                  }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: inst.profile_image_url ? 'transparent' : '#2a2a2a',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {inst.profile_image_url
                      ? <img src={inst.profile_image_url} alt={inst.name_mn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '20px', color: '#6b7280' }}>{inst.name_mn[0]}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '14px' }}>{inst.name_mn}</span>
                      {inst.name_en && <span style={{ fontSize: '12px', color: '#6b7280' }}>{inst.name_en}</span>}
                      {statusBadge(inst)}
                    </div>
                    {inst.title_mn && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{inst.title_mn}</div>}
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                      Бүртгүүлсэн: {new Date(inst.created_at).toLocaleDateString('mn-MN')}
                      {inst.user_id && <span style={{ marginLeft: '8px', color: '#10b981' }}>✓ Нэвтрэх эрхтэй</span>}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {!inst.is_approved && inst.subscription_status !== 'suspended' && (
                      <button onClick={() => handleApprove(inst.id)} disabled={busy === inst.id} style={{
                        background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
                        border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        {busy === inst.id ? '...' : '✓ Зөвшөөрөх'}
                      </button>
                    )}
                    {inst.is_approved && (
                      <button onClick={() => handleSuspend(inst.id)} disabled={busy === inst.id} style={{
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        {busy === inst.id ? '...' : 'Түтгэлзүүлэх'}
                      </button>
                    )}
                    {inst.subscription_status === 'suspended' && (
                      <button onClick={() => handleApprove(inst.id)} disabled={busy === inst.id} style={{
                        background: 'rgba(0,181,173,0.1)', color: '#00B5AD',
                        border: '1px solid rgba(0,181,173,0.25)', borderRadius: '7px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        {busy === inst.id ? '...' : 'Сэргээх'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '2rem', alignSelf: 'flex-start' }}>
            <div style={{ border: '1px solid #2a2a2a', borderRadius: '12px', background: '#1a1a1a', overflow: 'hidden' }}>
              {/* Profile header */}
              <div style={{ background: '#111', padding: '1.25rem', textAlign: 'center', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 0.75rem',
                  background: selected.profile_image_url ? 'transparent' : '#2a2a2a',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected.profile_image_url
                    ? <img src={selected.profile_image_url} alt={selected.name_mn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '28px', color: '#6b7280' }}>{selected.name_mn[0]}</span>
                  }
                </div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px' }}>{selected.name_mn}</div>
                {selected.name_en && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{selected.name_en}</div>}
                {selected.title_mn && <div style={{ fontSize: '13px', color: '#00B5AD', marginTop: '4px' }}>{selected.title_mn}</div>}
                <div style={{ marginTop: '10px' }}>{statusBadge(selected)}</div>
              </div>

              {/* Details */}
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selected.bio_mn && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Тухай</div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, maxHeight: '80px', overflow: 'hidden' }}>{selected.bio_mn}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <InfoCell label="Бүртгүүлсэн" value={new Date(selected.created_at).toLocaleDateString('mn-MN')} />
                  <InfoCell label="Нэвтрэх эрх" value={selected.user_id ? '✓ Холбогдсон' : '✕ Холбоогүй'} color={selected.user_id ? '#10b981' : '#ef4444'} />
                  <InfoCell label="QPay" value={selected.onboarding_completed ? '✓ Тохируулсан' : '✕ Тохируулаагүй'} color={selected.onboarding_completed ? '#10b981' : '#f59e0b'} />
                  {selected.approved_at && <InfoCell label="Зөвшөөрсөн" value={new Date(selected.approved_at).toLocaleDateString('mn-MN')} />}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid #2a2a2a' }}>
                  {!selected.is_approved && selected.subscription_status !== 'suspended' && (
                    <button onClick={() => handleApprove(selected.id)} disabled={busy === selected.id} style={{
                      background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
                      border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px',
                      padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%',
                    }}>
                      {busy === selected.id ? 'Түр хүлээнэ үү...' : '✓ Зөвшөөрөх — Идэвхжүүлэх'}
                    </button>
                  )}
                  {selected.is_approved && (
                    <button onClick={() => handleSuspend(selected.id)} disabled={busy === selected.id} style={{
                      background: 'rgba(239,68,68,0.1)', color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                      padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%',
                    }}>
                      {busy === selected.id ? 'Түр хүлээнэ үү...' : 'Түтгэлзүүлэх'}
                    </button>
                  )}
                  {selected.subscription_status === 'suspended' && (
                    <button onClick={() => handleApprove(selected.id)} disabled={busy === selected.id} style={{
                      background: 'rgba(0,181,173,0.1)', color: '#00B5AD',
                      border: '1px solid rgba(0,181,173,0.25)', borderRadius: '8px',
                      padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%',
                    }}>
                      {busy === selected.id ? 'Түр хүлээнэ үү...' : '↩ Дахин идэвхжүүлэх'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(selected.id, selected.name_mn)} disabled={busy === selected.id} style={{
                    background: 'none', color: '#6b7280',
                    border: '1px solid #2a2a2a', borderRadius: '8px',
                    padding: '8px', fontSize: '12px', cursor: 'pointer', width: '100%',
                  }}>
                    Бүртгэлийг устгах
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#111', borderRadius: '8px', padding: '8px 10px' }}>
      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: color || '#9ca3af', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function badge(color: string, bg: string): React.CSSProperties {
  return {
    background: bg, color, border: `1px solid ${color}40`,
    borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 700,
    whiteSpace: 'nowrap',
  };
}
