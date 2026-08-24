'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'set-password' | 'done'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Set up listener FIRST to avoid race condition where SIGNED_IN fires
    // before getSession() resolves (common with magic link hash flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStep('set-password');
      }
    });

    // Also check immediately — covers case where session already exists
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStep('set-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.');
      return;
    }
    if (password !== confirm) {
      setError('Нууц үг таарахгүй байна.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    setStep('done');
    setTimeout(() => router.push('/mn/my-courses'), 1500);
  }

  async function handleSkip() {
    router.push('/mn/my-courses');
  }

  if (step === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #e5e7eb',
            borderTopColor: '#00B5AD', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: 15 }}>Нэвтэрч байна...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Нууц үг тохируулагдлаа!</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Хичээлүүд рүү шилжиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f9fafb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '2.5rem 2rem', maxWidth: 420, width: '100%'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-block', background: '#00B5AD', color: '#fff',
            fontWeight: 800, fontSize: 20, padding: '8px 20px', borderRadius: 8,
            letterSpacing: '-0.5px', marginBottom: '1rem'
          }}>
            MommyOFFICE
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>
            Тавтай морил! 🎉
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Аюулгүй нэвтрэхийн тулд нууц үгээ тохируулна уу.
          </p>
        </div>

        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Шинэ нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Хамгийн багадаа 8 тэмдэгт"
              required
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db',
                borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => (e.target.style.borderColor = '#00B5AD')}
              onBlur={e => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Нууц үг давтах
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Нууц үгийг дахин оруулах"
              required
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db',
                borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => (e.target.style.borderColor = '#00B5AD')}
              onBlur={e => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#9ca3af' : '#00B5AD', color: '#fff',
              border: 'none', borderRadius: 10, padding: '14px',
              fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', marginTop: 4
            }}
          >
            {saving ? 'Хадгалж байна...' : 'Нууц үг тохируулах →'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent', border: 'none', color: '#9ca3af',
              fontSize: 13, cursor: 'pointer', padding: '4px', textDecoration: 'underline'
            }}
          >
            Одоохондоо алгасах
          </button>
        </form>
      </div>
    </div>
  );
}
