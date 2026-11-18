'use client';

import { useState, FormEvent } from 'react';

export default function AdvertiseContactForm() {
  const [form, setForm]       = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus]   = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  function set(field: string, val: string) {
    setForm((p) => ({ ...p, [field]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/advertise/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #2a2a2a', background: '#0d0d0d',
    color: '#e5e5e5', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: '#6b7280', marginBottom: '6px',
    letterSpacing: '0.8px', textTransform: 'uppercase',
  };

  if (status === 'ok') {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem 2rem',
        background: '#0f0f0f', border: '1px solid rgba(0,181,173,0.2)',
        borderRadius: '16px',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
          Амжилттай илгээгдлээ!
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Бид тантай ойрын ажлын өдрүүдэд холбогдох болно.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={lbl}>Нэр *</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Таны нэр" style={inp}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={lbl}>Утасны дугаар</label>
          <input
            type="tel" value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+976 9900 0000" style={inp}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={lbl}>Имэйл хаяг *</label>
        <input
          type="email" required value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="email@company.mn" style={inp}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={lbl}>Мессеж *</label>
        <textarea
          required value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Ямар байршуулалт сонирхож байна вэ? Компанийнхаа нэр, бүтээгдэхүүн, зорилгоо товч тайлбарлана уу."
          rows={4} maxLength={2000}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px', textAlign: 'right' }}>
          {form.message.length}/2000
        </p>
      </div>

      {status === 'err' && (
        <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '1rem' }}>
          Илгээхэд алдаа гарлаа. Дахин оролдох эсвэл{' '}
          <a href="mailto:info.mommyoffice@gmail.com" style={{ color: '#00B5AD' }}>
            имэйл бичнэ үү
          </a>.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          width: '100%', padding: '14px',
          background: status === 'sending' ? '#1a1a1a' : '#00B5AD',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontWeight: 800, fontSize: '15px', cursor: status === 'sending' ? 'default' : 'pointer',
          fontFamily: 'inherit', transition: 'background 0.2s',
        }}
      >
        {status === 'sending' ? 'Илгээж байна...' : 'Асуулга илгээх →'}
      </button>
    </form>
  );
}
