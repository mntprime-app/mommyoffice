'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string | null;
  cover_image_url: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
}

interface CheckoutViewProps {
  locale: string;
  course: Course;
}

type Step = 'form' | 'qr' | 'success';

const CAT_GRADIENTS: Record<string, string> = {
  'Эрүүл мэнд':    'linear-gradient(135deg,#0d3720,#1a6b3a)',
  'Гоо сайхан':    'linear-gradient(135deg,#1a0d37,#4a1a6b)',
  'Хоол тэжээл':   'linear-gradient(135deg,#0d2137,#1a4a6b)',
  'Гэр бүл':       'linear-gradient(135deg,#0d2537,#1a5a6b)',
  'Бизнес':        'linear-gradient(135deg,#371a0d,#6b3a1a)',
  'Хувийн хөгжил': 'linear-gradient(135deg,#1a1a0d,#3d3d15)',
  'default':       'linear-gradient(135deg,#1a1a2e,#2d1b4e)',
};

export function CheckoutView({ locale, course }: CheckoutViewProps) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // QR state
  const [orderId, setOrderId] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [deepLinks, setDeepLinks] = useState<{ name: string; logo: string; link: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const [accessUrl, setAccessUrl] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll every 3s once QR is shown
  useEffect(() => {
    if (step === 'qr' && orderId) {
      pollRef.current = setInterval(async () => {
        if (checking) return;
        setChecking(true);
        try {
          const res = await fetch(`/api/qpay/check?orderId=${orderId}`);
          const data = await res.json() as { ok: boolean; paid: boolean; accessUrl?: string };
          if (data.ok && data.paid && data.accessUrl) {
            clearInterval(pollRef.current!);
            setAccessUrl(data.accessUrl);
            setStep('success');
          }
        } catch { /* keep polling */ }
        finally { setChecking(false); }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, orderId]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('И-мэйл хаяг буруу байна'); return; }
    if (phone.replace(/\D/g, '').length < 8) { setError('Утасны дугаар буруу байна'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/qpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: course.slug, buyerName: name, buyerEmail: email, buyerPhone: phone }),
      });
      const data = await res.json() as {
        ok: boolean; error?: string;
        orderId?: string; qrImage?: string; deepLinks?: { name: string; logo: string; link: string }[];
      };
      if (!data.ok) {
        setError(data.error || 'Алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }
      setOrderId(data.orderId!);
      setQrImage(data.qrImage!);
      setDeepLinks(data.deepLinks || []);
      // Remove from cart
      try {
        const cart: string[] = JSON.parse(localStorage.getItem('mo_cart') || '[]');
        localStorage.setItem('mo_cart', JSON.stringify(cart.filter(s => s !== course.slug)));
        window.dispatchEvent(new Event('storage'));
      } catch { /* ignore */ }
      setStep('qr');
    } catch {
      setError('Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  }

  const grad = CAT_GRADIENTS[course.category || ''] || CAT_GRADIENTS.default;
  const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  const discount = course.original_price && course.original_price > course.price
    ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
    : 0;

  // ── ORDER SUMMARY CARD ──────────────────────────────────────────────────────
  const OrderSummary = () => (
    <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Course thumb */}
      <div style={{ height: '160px', background: grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {course.cover_image_url
          ? <img src={course.cover_image_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '52px', opacity: 0.4 }}>🎓</span>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,26,0.8) 0%, transparent 60%)' }} />
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 16px', lineHeight: 1.4 }}>{title}</p>
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
          {course.original_price && course.original_price > course.price && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>Жагсаалтын үнэ</span>
              <span style={{ fontSize: '13px', color: '#555', textDecoration: 'line-through' }}>₮{course.original_price.toLocaleString()}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#22c55e' }}>Хөнгөлөлт ({discount}%)</span>
              <span style={{ fontSize: '13px', color: '#22c55e' }}>-₮{(course.original_price! - course.price).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #2a2a2a', marginTop: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5e5e5' }}>Нийт дүн</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#00B5AD' }}>₮{course.price.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,181,173,0.07)', borderRadius: '8px', border: '1px solid rgba(0,181,173,0.15)' }}>
          <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.6 }}>
            ✅ Нэг удаагийн төлбөр — насан туршийн эрх<br />
            ✅ Хандалтын холбоосыг и-мэйлээр илгээнэ<br />
            ✅ QPay аппаар хялбарчлан төлнө
          </p>
        </div>
      </div>
    </div>
  );

  // ── STEP: FORM ──────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <div className="mo-checkout-wrap" style={{ maxWidth: '920px', margin: '0 auto', padding: '3rem 2rem' }}>
      <Link href={`/${locale}/courses/${course.slug}`} style={{ fontSize: '13px', color: '#666', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '2rem' }}>
        ← Буцах
      </Link>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 2rem' }}>🛒 Захиалга өгөх</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'flex-start' }}>
        {/* Guest form */}
        <div>
          <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '14px', padding: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#e5e5e5', margin: '0 0 20px' }}>Мэдээллээ оруулна уу</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>Нэр (заавал биш)</span>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Таны нэр"
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '15px', outline: 'none' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>И-мэйл хаяг <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com" required
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '15px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#555' }}>Хандалтын холбоосыг энэ хаяг руу илгээнэ</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>Утасны дугаар <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="99xxxxxx" required
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#e5e5e5', fontSize: '15px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#555' }}>QPay нэхэмжлэл хүлээн авахад ашиглана</span>
              </label>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <button
                type="submit" disabled={submitting}
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
                {submitting ? (
                  <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> QPay QR үүсгэж байна...</>
                ) : (
                  <>QPay-р төлөх — ₮{course.price.toLocaleString()}</>
                )}
              </button>
            </form>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            {['🔒 Аюулгүй төлбөр', '📧 Нэн даруй хандалт', '♾️ Хугацаагүй эрх'].map(t => (
              <span key={t} style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Order summary */}
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
    <div className="mo-checkout-wrap" style={{ maxWidth: '920px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 2rem' }}>📱 QPay QR кодоор төлнө үү</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'flex-start' }}>
        <div>
          {/* QR box */}
          <div className="mo-qr-wrapper" style={{ marginBottom: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 8px 40px rgba(0,181,173,0.2)' }}>
            {qrImage ? (
              <img src={`data:image/png;base64,${qrImage}`} alt="QPay QR" style={{ width: '240px', height: '240px' }} />
            ) : (
              <div style={{ width: '240px', height: '240px', background: '#f5f5f5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '2rem' }}>⟳</span>
                <span style={{ fontSize: '13px', color: '#999' }}>QR ачааллаж байна...</span>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: '0 0 2px' }}>₮{course.price.toLocaleString()} төлнө үү</p>
              <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>QPay апп → QR скан</p>
            </div>
          </div>
          </div>{/* end mo-qr-wrapper */}

          {/* Steps */}
          <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', margin: '0 0 14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Төлбөр хийх алхамууд</p>
            {[
              ['1', 'QPay аппыг нээнэ үү'],
              ['2', 'QR код скан хийнэ үү'],
              ['3', 'Дүнг баталгаажуулна уу'],
              ['4', 'Төлбөр амжилттай — и-мэйл ирнэ'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: n !== '4' ? '1px solid #222' : 'none' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,181,173,0.15)', border: '1px solid rgba(0,181,173,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#00B5AD', flexShrink: 0 }}>{n}</span>
                <span style={{ fontSize: '14px', color: '#ccc' }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Deep links (QPay bank apps) */}
          {deepLinks.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', color: '#555', fontWeight: 600, margin: '0 0 10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Эсвэл банкны апп сонгох</p>
              <div className="mo-qr-deeplinks" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {deepLinks.slice(0, 6).map((dl) => (
                  <a key={dl.name} href={dl.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', textDecoration: 'none', fontSize: '12px', color: '#ccc', fontWeight: 600 }}>
                    {dl.logo && <img src={dl.logo} alt={dl.name} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />}
                    {dl.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Polling indicator */}
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '13px' }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00B5AD' }} />
            Төлбөрийг хүлээж байна... (автоматаар шалгаж байна)
          </div>
        </div>

        <OrderSummary />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );

  // ── STEP: SUCCESS ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '560px', margin: '5rem auto', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'bounce 0.6s ease' }}>🎉</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#e5e5e5', margin: '0 0 12px' }}>Төлбөр амжилттай!</h1>
      <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, marginBottom: '28px' }}>
        {email} хаяг руу хандалтын холбоосыг илгээлээ.<br />
        Хэдхэн минутын дотор ирнэ.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(0,181,173,0.12)', border: '1px solid rgba(0,181,173,0.4)',
          borderRadius: '12px', padding: '16px 20px', textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#ccc', lineHeight: 1.7 }}>
            📬 <strong style={{ color: '#fff' }}>И-мэйлээ шалгана уу.</strong><br />
            Хандалтын холбоос илгээгдлээ. И-мэйлийн товч дээр дарж нэвтрэн хичээлдээ хандана уу.
          </p>
        </div>
        <Link href={`/${locale}/my-courses`} style={{ display: 'block', padding: '12px 28px', background: 'transparent', color: '#aaa', borderRadius: '10px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          Миний хичээлүүд →
        </Link>
      </div>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>
    </div>
  );
}
