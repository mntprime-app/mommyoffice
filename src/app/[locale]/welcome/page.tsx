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
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // 1. Check if already have a session (returning user)
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        setStep('set-password');
        return;
      }

      // 2. Parse hash fragment manually — @supabase/ssr uses PKCE by default
      //    and won't auto-process hash-based magic link tokens (#access_token=...)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (data.session) {
            // Clean the hash from URL without reload
            window.history.replaceState(null, '', window.location.pathname);
            setStep('set-password');
          } else {
            console.error('setSession error:', error);
            setError('Холбоос хүчингүй болсон байна. И-мэйлийг дахин шалгана уу.');
            setStep('set-password'); // still show form
          }
          return;
        }
      }

      // 3. Fallback: listen for auth state change (PKCE code flow via ?code=)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setStep('set-password');
        }
      });

      // Timeout fallback — if nothing fires in 5s, show the form anyway
      const timeout = setTimeout(() => {
        setStep('set-password');
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    init();
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

  const darkPage: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#141414', padding: '2rem 1rem'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: '#333', border: '1px solid #444', borderRadius: 6,
    fontSize: 16, outline: 'none', boxSizing: 'border-box',
    color: '#fff', transition: 'border-color 0.15s'
  };

  if (step === 'loading') {
    return (
      <div style={darkPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #333',
            borderTopColor: '#00B5AD', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#888', fontSize: 15 }}>Нэвтэрч байна...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={darkPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Нууц үг тохируулагдлаа!</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Хичээлүүд рүү шилжиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={darkPage}>
      <div style={{
        background: '#1f1f1f', borderRadius: 8,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        padding: '48px 40px', maxWidth: 440, width: '100%'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-block', background: '#00B5AD', color: '#fff',
            fontWeight: 800, fontSize: 20, padding: '8px 20px', borderRadius: 8,
            letterSpacing: '-0.5px', marginBottom: '1.25rem'
          }}>
            MommyOFFICE
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
            Тавтай морил! 🎉
          </h1>
          <p style={{ color: '#aaa', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Аюулгүй нэвтрэхийн тулд нууц үгээ тохируулна уу.
          </p>
        </div>

        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>
              Шинэ нууц үг
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Хамгийн багадаа 8 тэмдэгт"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => (e.target.style.borderColor = '#00B5AD')}
              onBlur={e => (e.target.style.borderColor = '#444')}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#888',
              fontSize: 18, lineHeight: 1, padding: 0
            }}>{showPw ? '🙈' : '👁'}</button>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>
              Нууц үг давтах
            </label>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Нууц үгийг дахин оруулах"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => (e.target.style.borderColor = '#00B5AD')}
              onBlur={e => (e.target.style.borderColor = '#444')}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#888',
              fontSize: 18, lineHeight: 1, padding: 0
            }}>{showConfirm ? '🙈' : '👁'}</button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 6, padding: '10px 14px', color: '#fca5a5', fontSize: 13
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#555' : '#00B5AD', color: '#fff',
              border: 'none', borderRadius: 6, padding: '15px',
              fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', marginTop: 4, width: '100%'
            }}
          >
            {saving ? 'Хадгалж байна...' : 'Нууц үг тохируулах →'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent', border: 'none', color: '#666',
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
