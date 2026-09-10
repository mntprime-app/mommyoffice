'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface BulkCourse {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string | null;
  cover_image_url: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
}

interface BulkCheckoutViewProps {
  locale: string;
  courses: BulkCourse[];
}

type Step = 'form' | 'qr' | 'success';

export function BulkCheckoutView({ locale, courses }: BulkCheckoutViewProps) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailLocked, setEmailLocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [orderId, setOrderId] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [deepLinks, setDeepLinks] = useState<{ name: string; logo: string; link: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = courses.reduce((sum, c) => sum + (c.price || 0), 0);

  // Pre-fill from active session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
        setEmailLocked(true);
        setUserId(data.session.user.id);
        const meta = data.session.user.user_metadata as Record<string, string> | undefined;
        if (meta?.first_name || meta?.last_name) {
          setName([meta.first_name, meta.last_name].filter(Boolean).join(' '));
        }
      }
    });
  }, []);

  // Poll for payment confirmation
  useEffect(() => {
    if (step === 'qr' && orderId) {
      pollRef.current = setInterval(async () => {
        if (checking) return;
        setChecking(true);
        try {
          const res = await fetch(`/api/qpay/check?orderId=${orderId}`);
          const data = await res.json() as { ok: boolean; paid: boolean; accessUrl?: string };
          if (data.ok && data.paid) {
            clearInterval(pollRef.current!);
            setStep('success');
          }
        } catch { /* keep polling */ }
        finally { setChecking(false); }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('И-мэйл хаяг буруу байна'); return; }
    if (phone.replace(/\D/g, '').length < 8) { setError('Утасны дугаар буруу байна'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/qpay/create-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slugs: courses.map(c => c.slug),
          buyerName: name,
          buyerEmail: email,
          buyerPhone: phone,
          userId,
        }),
      });
      const data = await res.json() as {
        ok: boolean; error?: string;
        orderId?: string; qrImage?: string;
        deepLinks?: { name: string; logo: string; link: string }[];
      };
      if (!data.ok) {
        setError(data.error || 'Алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }
      setOrderId(data.orderId!);
      setQrImage(data.qrImage!);
      setDeepLinks(data.deepLinks || []);
      // Clear cart after creating invoice
      try {
        localStorage.setItem('mo_cart', JSON.stringify([]));
        window.dispatchEvent(new Event('storage'));
      } catch { /* ignore */ }
      setStep('qr');
    } catch {
      setError('Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  }

  // Order summary card
  const OrderSummary = () => (
    <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#aaa', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Захиалгын дэлгэрэнгүй
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {courses.map(c => {
            const t = locale === 'mn' ? c.title_mn : (c.title_en || c.title_mn);
            const orig = c.original_price ?? 0;
            const disc = orig > c.price ? Math.round(((orig - c.price) / orig) * 100) : 0;
            return (
              <div key={c.slug} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {c.cover_image_url ? (
                  <img src={c.cover_image_url} alt={t}
                    style={{ width: '56px', height: '38px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '56px', height: '38px', background: '#2a2a2a', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📚</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#ccc', margin: '0 0 3px', lineHeight: 1.3,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {t}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#00B5AD' }}>
                      {c.price === 0 ? 'Үнэгүй' : `${c.price.toLocaleString()}₮`}
                    </span>
                    {disc > 0 && (
                      <>
                        <span style={{ fontSize: '11px', color: '#555', textDecoration: 'line-through' }}>{orig.toLocaleString()}₮</span>
                        <span style={{ fontSize: '10px', background: '#e53e3e', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>-{disc}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5' }}>Нийт дүн</span>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#00B5AD' }}>₮{total.toLocaleString()}</span>
        </div>
        <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(0,181,173,0.07)', borderRadius: '8px', border: '1px solid rgba(0,181,173,0.15)' }}>
          <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.6 }}>
            ✅ Нэг QR — {courses.length} сургалт<br />
            ✅ Нэг удаагийн төлбөр — насан туршийн эрх<br />
            ✅ QPay аппаар хялбарчлан төлнө
          </p>
        </div>
      </div>
    </div>
  );

  // ── STEP: FORM ───────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <div className="mo-checkout-wrap" style={{ maxWidth: '920px', margin: '0 auto', padding: '3rem 2rem' }}>
      <Link href={`/${locale}/cart`} style={{ fontSize: '13px', color: '#666', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '2rem' }}>
        ← Сагс руу буцах
      </Link>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 0.5rem' }}>
        🛒 Захиалга өгөх
      </h1>
      <p style={{ fontSize: '14px', color: '#666', margin: '0 0 2rem' }}>
        {courses.length} сургалтыг нэг QPay QR-аар худалдаж авна
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'flex-start' }}>
        <div>
          <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '14px', padding: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 20px' }}>Мэдээллээ оруулна уу</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>Нэр (заавал биш)</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Таны нэр"
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '15px', outline: 'none' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>И-мэйл хаяг <span style={{ color: '#ef4444' }}>*</span></span>
                <input type="email" value={email} onChange={e => !emailLocked && setEmail(e.target.value)}
                  placeholder="example@gmail.com" required readOnly={emailLocked}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: emailLocked ? '1px solid #1a3a39' : '1px solid #2a2a2a', background: emailLocked ? '#0a1f1f' : '#111', color: emailLocked ? '#4dd0c8' : '#e5e5e5', fontSize: '15px', outline: 'none', cursor: emailLocked ? 'default' : 'text' }} />
                <span style={{ fontSize: '11px', color: '#555' }}>
                  {emailLocked ? '🔒 Нэвтэрсэн хаягаар автоматаар дүүргэгдлээ' : 'Хандалтын холбоосыг энэ хаяг руу илгээнэ'}
                </span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>Утасны дугаар <span style={{ color: '#ef4444' }}>*</span></span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="99xxxxxx" required
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '15px', outline: 'none' }} />
                <span style={{ fontSize: '11px', color: '#555' }}>QPay нэхэмжлэл хүлээн авахад ашиглана</span>
              </label>
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>⚠️ {error}</p>
                </div>
              )}
              <button type="submit" disabled={submitting}
                style={{
                  marginTop: '8px', padding: '14px', borderRadius: '8px',
                  background: submitting ? '#0a6b68' : '#00B5AD',
                  border: 'none', color: '#fff', fontWeight: 800, fontSize: '16px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: submitting ? 'none' : '0 4px 20px rgba(0,181,173,0.3)',
                  transition: 'background 0.2s',
                }}
              >
                {submitting
                  ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> QPay QR үүсгэж байна...</>
                  : <>QPay-р төлөх — ₮{total.toLocaleString()}</>
                }
              </button>
            </form>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            {['🔒 Аюулгүй төлбөр', '📧 Нэн даруй хандалт', '♾️ Хугацаагүй эрх'].map(t => (
              <span key={t} style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
        <OrderSummary />
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #00B5AD !important; box-shadow: 0 0 0 3px rgba(0,181,173,0.15); }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );

  // ── STEP: QR ─────────────────────────────────────────────────────────────────
  if (step === 'qr') return (
    <div className="mo-checkout-wrap" style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 0.4rem' }}>Төлбөр хийх</h1>
      <p style={{ fontSize: '15px', color: '#00B5AD', fontWeight: 700, margin: '0 0 1.8rem' }}>
        Нэг QR — {courses.length} сургалт — ₮{total.toLocaleString()}
      </p>

      {/* ── DESKTOP layout: QR hero left, OrderSummary right ── */}
      <div className="mo-qr-desktop-wrap">
        <div className="mo-qr-desktop-left">
          {/* QR hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '32px 24px 24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', margin: '0 0 20px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Утасны аппаараа скан хийнэ үү</p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 48px rgba(0,181,173,0.3)' }}>
              {qrImage ? (
                <img src={`data:image/png;base64,${qrImage}`} alt="QPay QR" style={{ width: '260px', height: '260px', display: 'block' }} />
              ) : (
                <div style={{ width: '260px', height: '260px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '2rem' }}>⟳</span>
                  <span style={{ fontSize: '13px', color: '#999' }}>QR ачааллаж байна...</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '16px 0 4px', background: '#fff', padding: '8px 20px', borderRadius: '8px' }}>₮{total.toLocaleString()} төлнө үү</p>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>1. QPay апп нээх → 2. QR скан → 3. Баталгаажуулах</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#555', fontSize: '13px', marginTop: '16px' }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00B5AD', flexShrink: 0 }} />
            Төлбөрийг хүлээж байна... (автоматаар шалгаж байна)
          </div>
          {deepLinks.length > 0 && (
            <div className="mo-desktop-bank-hint" style={{ marginTop: '16px', background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#555', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Банкны аппаас нэвтрэх (гар утас)</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {deepLinks.map((dl) => (
                  <a key={dl.name} href={dl.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #2a2a2a', textDecoration: 'none', fontSize: '11px', color: '#777', fontWeight: 500 }}>
                    {dl.logo && <img src={dl.logo} alt={dl.name} style={{ width: '18px', height: '18px', borderRadius: '4px' }} />}
                    {dl.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <OrderSummary />
      </div>

      {/* ── MOBILE layout: bank apps first, QR below ── */}
      <div className="mo-qr-mobile-wrap">
        {deepLinks.length > 0 && (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '18px 14px 14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 4px', textAlign: 'center' }}>Банкны аппликейшнээр</p>
            <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', margin: '0 0 14px' }}>Аппаа нээгээд нэхэмжлэлийг баталгаажуулна уу</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {deepLinks.map((dl) => (
                <a key={dl.name} href={dl.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '12px 6px', borderRadius: '12px', background: '#242424', border: '1px solid #333', textDecoration: 'none', fontSize: '11px', color: '#ccc', fontWeight: 600, textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B5AD'; e.currentTarget.style.background = 'rgba(0,181,173,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#242424'; }}
                >
                  {dl.logo
                    ? <img src={dl.logo} alt={dl.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏦</div>
                  }
                  <span style={{ lineHeight: 1.3, wordBreak: 'break-word' }}>{dl.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 24px rgba(0,181,173,0.15)' }}>
            {qrImage ? (
              <img src={`data:image/png;base64,${qrImage}`} alt="QPay QR" style={{ width: '200px', height: '200px', display: 'block' }} />
            ) : (
              <div style={{ width: '200px', height: '200px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '2rem' }}>⟳</span>
                <span style={{ fontSize: '12px', color: '#999' }}>QR ачааллаж байна...</span>
              </div>
            )}
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#222', margin: 0, textAlign: 'center' }}>₮{total.toLocaleString()} · {courses.length} сургалт · QR скан</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#555', fontSize: '13px', marginBottom: '16px' }}>
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00B5AD', flexShrink: 0 }} />
          Төлбөрийг хүлээж байна...
        </div>
        <OrderSummary />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .mo-qr-desktop-wrap { display: grid; grid-template-columns: 1fr 320px; gap: 2.5rem; align-items: flex-start; }
        .mo-qr-desktop-left { display: flex; flex-direction: column; gap: 0; }
        .mo-desktop-bank-hint { display: block; }
        .mo-qr-mobile-wrap { display: none; }
        @media (max-width: 700px) {
          .mo-qr-desktop-wrap { display: none; }
          .mo-qr-mobile-wrap { display: block; }
        }
      `}</style>
    </div>
  );

  // ── STEP: SUCCESS ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '560px', margin: '5rem auto', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'bounce 0.6s ease' }}>🎉</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 12px' }}>Төлбөр амжилттай!</h1>
      <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, marginBottom: '8px' }}>
        {courses.length} сургалт худалдан авагдлаа.
      </p>
      <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginBottom: '28px' }}>
        <strong style={{ color: '#e5e5e5' }}>{email}</strong> хаяг руу<br />
        нэвтрэх заавар бүхий и-мэйл илгээгдлээ.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
        <Link href={`/${locale}/my-courses`} style={{ display: 'block', padding: '14px 28px', background: '#00B5AD', color: '#fff', borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,181,173,0.35)' }}>
          Миний хичээлүүд →
        </Link>
        <Link href={`/${locale}/access?email=${encodeURIComponent(email)}`} style={{ display: 'block', padding: '12px 28px', background: 'transparent', color: '#6b7280', borderRadius: '10px', fontWeight: 500, fontSize: '13px', textDecoration: 'none', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          Нэвтрэх код авах →
        </Link>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
    </div>
  );
}
