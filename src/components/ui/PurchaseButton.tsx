'use client';
import { useState } from 'react';

interface Props {
  courseId: string;
  price: number;
  locale: string;
}

export default function PurchaseButton({ courseId, price, locale }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handlePurchase() {
    if (!email || !email.includes('@')) {
      setError('И-мэйл хаяг оруулна уу');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, courseId }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch {
      setError('Сүлжээний алдаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1px solid #86efac',
        borderRadius: '10px', padding: '1rem', textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
        <p style={{ fontWeight: 600, color: '#166534', fontSize: '15px' }}>
          И-мэйл илгээгдлээ!
        </p>
        <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '0.25rem' }}>
          {email} хаягт нэвтрэх холбоос ирлээ. Шуудан хайрцгаа шалгана уу.
        </p>
      </div>
    );
  }

  return (
    <div>
      <input
        type="email"
        placeholder="И-мэйл хаяг"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '8px',
          border: '1px solid var(--border)', fontSize: '14px',
          marginBottom: '0.75rem', boxSizing: 'border-box',
          outline: 'none'
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '0.5rem' }}>{error}</p>}
      <button
        onClick={handlePurchase}
        disabled={loading}
        style={{
          width: '100%', background: loading ? '#9ca3af' : 'var(--teal)',
          color: '#fff', padding: '12px', borderRadius: '10px',
          fontWeight: 700, fontSize: '15px', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Илгээж байна...' : price === 0 ? 'Үнэгүй элсэх' : 'Худалдан авах'}
      </button>
    </div>
  );
}
