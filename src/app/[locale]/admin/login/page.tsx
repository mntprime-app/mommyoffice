'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('И-мэйл эсвэл нууц үг буруу байна.');
      setLoading(false);
    } else {
      router.push(`/${locale}/admin`);
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/squarelogo.png" alt="Mommyoffice" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 1rem', display: 'block' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin нэвтрэх</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '0.25rem' }}>Mommyoffice удирдлагын самбар</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              И-мэйл
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="admin@mommyoffice.com"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', fontSize: '14px',
                boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              Нууц үг
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', fontSize: '14px',
                boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? '#9ca3af' : 'var(--teal)',
              color: '#fff', padding: '12px', borderRadius: '10px',
              fontWeight: 700, fontSize: '15px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem'
            }}
          >
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>
        </form>
      </div>
    </div>
  );
}
