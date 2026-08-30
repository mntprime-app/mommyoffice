'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Tab = 'student' | 'instructor';

export default function AccessIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const lp = (path: string) => `/${locale}${path}`;

  const [tab, setTab] = useState<Tab>('student');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = token.trim();
    if (!cleaned) { setError('Нэвтрэх кодоо оруулна уу'); return; }
    router.push(lp(`/access/${cleaned}`));
  }

  return (
    <div style={{ minHeight: '90vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      {/* Logo / Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          Mommy<span style={{ color: '#00B5AD' }}>Office</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '6px 0 0' }}>
          Таны хувийн сургалтын орчин
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '4px', marginBottom: '2rem', width: '100%', maxWidth: '480px' }}>
        <button onClick={() => setTab('student')} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px', transition: 'all 0.15s',
          background: tab === 'student' ? '#00B5AD' : 'transparent',
          color: tab === 'student' ? '#fff' : '#6b7280',
        }}>
          📚 Сурагч
        </button>
        <button onClick={() => setTab('instructor')} style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '14px', transition: 'all 0.15s',
          background: tab === 'instructor' ? '#6366f1' : 'transparent',
          color: tab === 'instructor' ? '#fff' : '#6b7280',
        }}>
          👩‍🏫 Багш
        </button>
      </div>

      {/* ── STUDENT TAB ── */}
      {tab === 'student' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Token entry */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '24px' }}>🔑</span>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Хичээлд нэвтрэх</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>И-мэйлээр ирсэн нэвтрэх кодоо оруулна уу</div>
              </div>
            </div>
            <form onSubmit={handleTokenSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(''); }}
                placeholder="Нэвтрэх код..."
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: '9px',
                  border: `1px solid ${error ? '#ef4444' : '#333'}`,
                  fontSize: '14px', background: '#111', color: '#e5e5e5',
                  fontFamily: 'monospace', outline: 'none',
                }}
              />
              <button type="submit" style={{
                background: '#00B5AD', color: '#fff', border: 'none',
                padding: '11px 20px', borderRadius: '9px', fontWeight: 700,
                fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                Нэвтрэх →
              </button>
            </form>
            {error && <p style={{ fontSize: '12px', color: '#f87171', margin: '6px 0 0' }}>{error}</p>}
          </div>

          {/* Browse / Buy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <ActionCard
              href={lp('/courses')}
              icon="🎓"
              title="Сургалтууд"
              desc="Бүх хичээлийг үзэх"
              color="#00B5AD"
            />
            <ActionCard
              href={lp('/videos')}
              icon="🎬"
              title="Видео"
              desc="Үнэгүй контент"
              color="#f59e0b"
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', paddingTop: '4px' }}>
            Код олдохгүй байна уу?{' '}
            <a href="mailto:hello@mommyoffice.com" style={{ color: '#00B5AD', textDecoration: 'none' }}>
              hello@mommyoffice.com
            </a>
          </div>
        </div>
      )}

      {/* ── INSTRUCTOR TAB ── */}
      {tab === 'instructor' && (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Already an instructor → login */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>Багш нэвтрэх</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Зөвшөөрөгдсөн багш нарт зориулав</div>
              </div>
            </div>
            <a href={lp('/instructor/login')} style={{
              display: 'block', textAlign: 'center',
              background: '#6366f1', color: '#fff',
              padding: '12px', borderRadius: '9px',
              fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>
              Нэвтрэх →
            </a>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
            <span style={{ fontSize: '12px', color: '#4b5563' }}>эсвэл</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
          </div>

          {/* Become instructor CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(0,181,173,0.08) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '0.75rem' }}>🎓</div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px', marginBottom: '0.5rem' }}>
              MommyOffice-д багш болох
            </div>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              Таны мэдлэгийг олон мянган ээжид хүргэ. QPay-р шууд орлого олж, хичээлээ бүтээгээрэй.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                '📤 Өргөдлөө 5 минутад бөглөнө',
                '🔍 1-3 хоногт бид хянана',
                '✅ Зөвшөөрлийн имэйл ирнэ',
                '💰 QPay холбоод борлуулна',
              ].map((item) => (
                <div key={item} style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'left' }}>{item}</div>
              ))}
            </div>
            <a href={lp('/become-instructor')} style={{
              display: 'block', marginTop: '1.25rem',
              background: '#6366f1', color: '#fff',
              padding: '13px', borderRadius: '10px',
              fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            }}>
              Багш болох →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color: string }) {
  return (
    <a href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#1a1a1a', border: `1px solid #2a2a2a`, borderRadius: '12px',
        padding: '1rem', cursor: 'pointer', transition: 'border-color 0.15s',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '14px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{desc}</div>
        <div style={{ fontSize: '12px', color, marginTop: '8px', fontWeight: 600 }}>Үзэх →</div>
      </div>
    </a>
  );
}
