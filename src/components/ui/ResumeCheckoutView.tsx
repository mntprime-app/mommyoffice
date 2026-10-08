'use client';
/**
 * ResumeCheckoutView — shown on /checkout/resume
 * Skips the buyer info form entirely (data already in DB).
 * Shows QPay QR + polls for payment, then success screen.
 */
import { useState, useEffect, useRef } from 'react';

interface DeepLink {
  name: string;
  logo: string;
  link: string;
}

interface ResumeCheckoutViewProps {
  locale: string;
  orderId: string;
  courseTitle: string;
  courseSlug: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  qrImage: string;      // base64 PNG from QPay; empty string = creation failed
  deepLinks: DeepLink[];
}

export function ResumeCheckoutView({
  locale,
  orderId,
  courseTitle,
  amount,
  buyerName,
  buyerEmail,
  qrImage,
  deepLinks,
}: ResumeCheckoutViewProps) {
  const [paid, setPaid] = useState(false);
  const [accessUrl, setAccessUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mask email: ab***@gmail.com
  const maskedEmail = buyerEmail.replace(/(.{2}).+(@.+)/, '$1***$2');

  // Poll QPay every 3s
  useEffect(() => {
    if (qrImage && !paid) {
      pollRef.current = setInterval(async () => {
        if (checking) return;
        setChecking(true);
        try {
          const res = await fetch(`/api/qpay/check?orderId=${orderId}`);
          const data = await res.json() as { ok: boolean; paid: boolean; accessUrl?: string };
          if (data.ok && data.paid && data.accessUrl) {
            clearInterval(pollRef.current!);
            setAccessUrl(data.accessUrl);
            setPaid(true);
          }
        } catch { /* keep polling */ }
        finally { setChecking(false); }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [qrImage, orderId, paid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Success screen ─────────────────────────────────────────────────────────
  if (paid) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px' }}>
        <div style={{ maxWidth:'480px', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'56px', marginBottom:'16px' }}>🎉</div>
          <h1 style={{ color:'#ffffff', fontSize:'24px', fontWeight:800, margin:'0 0 12px' }}>
            Төлбөр амжилттай!
          </h1>
          <p style={{ color:'#9ca3af', fontSize:'15px', margin:'0 0 32px', lineHeight:1.7 }}>
            <strong style={{ color:'#ffffff' }}>{courseTitle}</strong> сургалтад тавтай морил.
          </p>
          <a
            href={accessUrl}
            style={{
              display:'inline-block',
              background:'linear-gradient(90deg,#00B5AD,#06d6cd)',
              color:'#ffffff',
              fontWeight:700,
              fontSize:'16px',
              textDecoration:'none',
              padding:'16px 40px',
              borderRadius:'12px',
            }}
          >
            Хичээлдээ нэвтрэх →
          </a>
        </div>
      </div>
    );
  }

  // ── QPay creation failed (network error, etc.) ─────────────────────────────
  if (!qrImage) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px' }}>
        <div style={{ maxWidth:'480px', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚠️</div>
          <h1 style={{ color:'#ffffff', fontSize:'20px', fontWeight:700, margin:'0 0 12px' }}>
            Холболт алдаа гарлаа
          </h1>
          <p style={{ color:'#9ca3af', fontSize:'14px', margin:'0 0 24px', lineHeight:1.7 }}>
            QPay холболт асуудал гарсан байна. Хуудсыг дахин ачааллана уу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background:'linear-gradient(90deg,#00B5AD,#06d6cd)',
              color:'#ffffff',
              fontWeight:700,
              fontSize:'15px',
              border:'none',
              cursor:'pointer',
              padding:'14px 32px',
              borderRadius:'12px',
            }}
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  // ── QR payment screen ──────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px 16px' }}>
      <div style={{ maxWidth:'440px', width:'100%' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <img
            src="https://mommyoffice.com/logo.png"
            alt="MommyOffice"
            style={{ height:'40px', width:'auto', marginBottom:'8px' }}
          />
          <p style={{ color:'#6b7280', fontSize:'13px', margin:0 }}>Таны хувийн сургалтын орчин</p>
        </div>

        {/* Card */}
        <div style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'20px', overflow:'hidden' }}>
          <div style={{ height:'4px', background:'linear-gradient(90deg,#00B5AD,#06d6cd)' }} />
          <div style={{ padding:'32px 28px' }}>

            {/* Order summary */}
            <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'16px 20px', marginBottom:'24px' }}>
              <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Захиалга</div>
              <div style={{ color:'#ffffff', fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>{courseTitle}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#9ca3af', fontSize:'13px' }}>{maskedEmail}</span>
                <span style={{ color:'#00B5AD', fontWeight:700, fontSize:'15px' }}>
                  {amount.toLocaleString('mn-MN')}₮
                </span>
              </div>
            </div>

            {/* QR */}
            <div style={{ textAlign:'center', marginBottom:'20px' }}>
              <p style={{ color:'#9ca3af', fontSize:'13px', margin:'0 0 12px' }}>
                QR кодыг уншуулж төлбөр хийнэ үү
              </p>
              <div style={{ background:'#ffffff', borderRadius:'12px', padding:'12px', display:'inline-block' }}>
                <img
                  src={`data:image/png;base64,${qrImage}`}
                  alt="QPay QR"
                  style={{ width:'200px', height:'200px', display:'block' }}
                />
              </div>
            </div>

            {/* Deep links */}
            {deepLinks.length > 0 && (
              <div style={{ marginBottom:'20px' }}>
                <p style={{ color:'#6b7280', fontSize:'12px', textAlign:'center', margin:'0 0 10px' }}>
                  Эсвэл банкны апп-аар төл
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
                  {deepLinks.map(dl => (
                    <a
                      key={dl.name}
                      href={dl.link}
                      style={{
                        display:'flex', alignItems:'center', gap:'6px',
                        background:'#111', border:'1px solid #2a2a2a',
                        borderRadius:'8px', padding:'8px 12px',
                        textDecoration:'none', color:'#d1d5db', fontSize:'12px',
                      }}
                    >
                      <img src={dl.logo} alt={dl.name} style={{ width:'20px', height:'20px', borderRadius:'4px' }} />
                      {dl.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Polling indicator */}
            <div style={{ textAlign:'center' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', color:'#6b7280', fontSize:'12px' }}>
                <span style={{
                  width:'8px', height:'8px', borderRadius:'50%',
                  background:'#00B5AD',
                  animation:'pulse 1.5s infinite',
                  display:'inline-block',
                }} />
                Төлбөр хүлээж байна...
              </div>
            </div>

          </div>
        </div>

        {/* Help */}
        <p style={{ textAlign:'center', color:'#4b5563', fontSize:'12px', marginTop:'20px', lineHeight:1.7 }}>
          Асуудал гарвал{' '}
          <a href="https://m.me/mommyoffice" style={{ color:'#00B5AD', textDecoration:'none' }}>
            Facebook Messenger
          </a>
          -ээр холбогдоно уу.
        </p>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
