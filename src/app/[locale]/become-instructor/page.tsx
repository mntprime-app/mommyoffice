'use client';
import { useState } from 'react';
import { createInstructorApplication } from '@/app/actions/admin';

const STEPS = ['Танилцуулга', 'Профайл', 'Тухай', 'Илгээх'];

export default function BecomeInstructorPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name_mn: '',
    name_en: '',
    title_mn: '',
    title_en: '',
    bio_mn: '',
    bio_en: '',
    profile_image_url: '',
    email: '',
    social_url: '',
    agreed: false,
  });

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    setError('');
  }

  function validate(): string | null {
    if (step === 1) {
      if (!form.name_mn.trim()) return 'Нэрээ оруулна уу (Монгол)';
      if (!form.email.trim() || !form.email.includes('@')) return 'Имэйл хаяг буруу байна';
      if (!form.title_mn.trim()) return 'Мэргэжлийн чиглэлээ оруулна уу';
    }
    if (step === 2) {
      if (!form.bio_mn.trim() || form.bio_mn.trim().length < 50) return 'Тухай хэсэг хамгийн багадаа 50 тэмдэгт байна';
    }
    if (step === 3) {
      if (!form.agreed) return 'Үйлчилгээний нөхцөлийг зөвшөөрнө үү';
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    const result = await createInstructorApplication({
      name_mn: form.name_mn.trim(),
      name_en: form.name_en.trim() || null,
      title_mn: form.title_mn.trim() || null,
      title_en: form.title_en.trim() || null,
      bio_mn: form.bio_mn.trim() || null,
      bio_en: form.bio_en.trim() || null,
      profile_image_url: form.profile_image_url.trim() || null,
      email: form.email.trim(),
      social_url: form.social_url.trim() || null,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setDone(true);
  }

  if (done) return <SuccessScreen name={form.name_mn} />;

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#e5e5e5', fontFamily: 'inherit' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0d1f1f 0%, #111 60%)', borderBottom: '1px solid #1e3535', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#00B5AD', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Багш болох хүсэлт
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 0.75rem', lineHeight: 1.2 }}>
            MommyOffice-д багш болоорой
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            Таны мэдлэг, туршлага олон мянган ээжид хүрнэ. Бүртгэлээ илгээснээс хойш бид 1-3 хоногт хянаад хариу мэдэгдэнэ.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.75rem' }}>
            {[
              { num: '10,000+', label: 'Идэвхтэй ээж' },
              { num: '100%', label: 'Монгол контент' },
              { num: 'QPay', label: 'Шууд төлбөр' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00B5AD' }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2rem' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  background: i < step ? '#00B5AD' : i === step ? 'rgba(0,181,173,0.2)' : '#1e1e1e',
                  color: i <= step ? '#00B5AD' : '#4b5563',
                  border: i === step ? '2px solid #00B5AD' : i < step ? '2px solid #00B5AD' : '2px solid #2a2a2a',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '10px', color: i <= step ? '#00B5AD' : '#4b5563', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: i < step ? '#00B5AD' : '#2a2a2a', margin: '0 6px', marginBottom: '20px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2rem', marginBottom: '1rem' }}>

          {step === 0 && <StepIntro />}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>Таны мэдээлэл</h2>
              <div style={grid2}>
                <Field label="Нэр (Монгол) *">
                  <input value={form.name_mn} onChange={(e) => set('name_mn', e.target.value)} style={inp} placeholder="Болормаа Дорж" />
                </Field>
                <Field label="Нэр (English)">
                  <input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} style={inp} placeholder="Bolormaa Dorj" />
                </Field>
              </div>
              <Field label="Имэйл хаяг *" hint="Зөвшөөрлийн мэдэгдэл илгээх хаяг">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inp} placeholder="name@example.com" />
              </Field>
              <div style={grid2}>
                <Field label="Мэргэжил / Чиглэл (МН) *" hint="Жишээ: Хоол судлаач, Эх баригч">
                  <input value={form.title_mn} onChange={(e) => set('title_mn', e.target.value)} style={inp} placeholder="Хоол судлаач" />
                </Field>
                <Field label="Мэргэжил / Чиглэл (EN)">
                  <input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} style={inp} placeholder="Nutritionist" />
                </Field>
              </div>
              <Field label="Профайл зураг (URL)" hint="LinkedIn, Facebook эсвэл Google Drive public link">
                <input value={form.profile_image_url} onChange={(e) => set('profile_image_url', e.target.value)} style={inp} placeholder="https://..." />
                {form.profile_image_url && (
                  <img src={form.profile_image_url} alt="preview" onError={(e) => (e.currentTarget.style.display = 'none')}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginTop: '8px', border: '2px solid #00B5AD' }} />
                )}
              </Field>
              <Field label="Вэбсайт / Нийгмийн сүлжээ">
                <input value={form.social_url} onChange={(e) => set('social_url', e.target.value)} style={inp} placeholder="https://linkedin.com/in/..." />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>Танай тухай</h2>
              <Field label="Өөрийн тухай (Монгол) *" hint="Мин. 50 тэмдэгт — туршлага, чадвар, яагаад багш болохыг бичнэ үү">
                <textarea value={form.bio_mn} onChange={(e) => set('bio_mn', e.target.value)}
                  style={{ ...inp, height: '160px', resize: 'vertical', lineHeight: 1.7 }}
                  placeholder="Би 10 жил хоолны чиглэлээр ажиллаж ирсэн бөгөөд..." />
                <div style={{ fontSize: '11px', color: form.bio_mn.length < 50 ? '#ef4444' : '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                  {form.bio_mn.length} / 50+ тэмдэгт
                </div>
              </Field>
              <Field label="Өөрийн тухай (English)" hint="Заавал биш">
                <textarea value={form.bio_en} onChange={(e) => set('bio_en', e.target.value)}
                  style={{ ...inp, height: '120px', resize: 'vertical', lineHeight: 1.7 }}
                  placeholder="I have been working in nutrition for 10 years..." />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>Баталгаажуулах</h2>

              {/* Summary */}
              <div style={{ background: '#111', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {form.profile_image_url
                  ? <img src={form.profile_image_url} alt={form.name_mn} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#2a2a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#6b7280' }}>{form.name_mn[0]}</div>
                }
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px' }}>{form.name_mn}</div>
                  <div style={{ color: '#00B5AD', fontSize: '13px' }}>{form.title_mn}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{form.email}</div>
                </div>
              </div>

              {/* Process explanation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '📤', text: 'Таны хүсэлт MommyOffice-д илгээгдэнэ' },
                  { icon: '🔍', text: '1-3 хоногт бид таны профайлыг хянана' },
                  { icon: '✅', text: 'Зөвшөөрөгдсөн тохиолдолд имэйлээр мэдэгдэнэ' },
                  { icon: '🎓', text: 'Нэвтэрч QPay холбоод хичээл бүтээж эхэлнэ' },
                ].map((item) => (
                  <div key={item.text} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '1px' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Agreement */}
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', padding: '12px', borderRadius: '10px', border: `1px solid ${form.agreed ? 'rgba(0,181,173,0.4)' : '#2a2a2a'}`, background: form.agreed ? 'rgba(0,181,173,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={form.agreed} onChange={(e) => set('agreed', e.target.checked)}
                  style={{ accentColor: '#00B5AD', width: '16px', height: '16px', marginTop: '1px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                  MommyOffice-ийн{' '}
                  <a href="#" style={{ color: '#00B5AD' }}>үйлчилгээний нөхцөл</a>
                  {' '}болон{' '}
                  <a href="#" style={{ color: '#00B5AD' }}>контент бодлогыг</a>
                  {' '}зөвшөөрч байна.
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '3rem' }}>
          <button onClick={() => { setError(''); setStep((s) => s - 1); }} disabled={step === 0} style={{
            background: 'none', border: '1px solid #2a2a2a', color: step === 0 ? '#374151' : '#9ca3af',
            padding: '10px 20px', borderRadius: '10px', cursor: step === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 600,
          }}>
            ← Буцах
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={next} style={{
              background: '#00B5AD', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '14px', fontWeight: 700,
            }}>
              Үргэлжлүүлэх →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} style={{
              background: saving ? '#374151' : '#00B5AD', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 700,
            }}>
              {saving ? 'Илгээж байна...' : '📤 Хүсэлт илгээх'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIntro() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Яагаад MommyOffice-д заах вэ?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { icon: '💰', title: 'Шууд орлого', desc: 'QPay-р шууд дансандаа авна. Комисс бага.' },
          { icon: '🎯', title: 'Зорилтот үзэгчид', desc: 'Монголын идэвхтэй ээж нар — сонирхогч, худалдан авдаг.' },
          { icon: '🛠️', title: 'Бүх хэрэгсэл', desc: 'Хичээл оруулах, видео, агуулга — бүх хэрэгсэл бэлэн.' },
          { icon: '🤝', title: 'Хамтран ажиллана', desc: 'MommyOffice маркетинг хийнэ. Та зөвхөн заана.' },
        ].map((card) => (
          <div key={card.title} style={{ background: '#111', borderRadius: '12px', padding: '1rem', border: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ fontWeight: 700, color: '#e5e5e5', fontSize: '13px', marginBottom: '4px' }}>{card.title}</div>
            <div style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(0,181,173,0.08)', border: '1px solid rgba(0,181,173,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#9ca3af' }}>
        ⏱ Бөглөхөд ойролцоогоор <strong style={{ color: '#e5e5e5' }}>5 минут</strong> шаардагдана.
        Зөвшөөрлийн мэдэгдлийг <strong style={{ color: '#e5e5e5' }}>1-3 хоногт</strong> имэйлээр илгээнэ.
      </div>
    </div>
  );
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '64px', marginBottom: '1.5rem' }}>🎉</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
          Хүсэлт амжилттай илгээгдлээ!
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, marginBottom: '2rem' }}>
          <strong style={{ color: '#e5e5e5' }}>{name}</strong>, таны хүсэлтийг хүлээн авлаа.
          Бид 1-3 хоногт хянаад имэйлээр мэдэгдэнэ.
        </p>
        <a href="/mn" style={{
          display: 'inline-block', background: '#00B5AD', color: '#fff',
          padding: '12px 28px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '14px',
        }}>
          Нүүр хуудас руу буцах
        </a>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      {hint && <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 0.3rem' }}>{hint}</p>}
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #333', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', background: '#111', color: '#e5e5e5', fontFamily: 'inherit',
};
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
