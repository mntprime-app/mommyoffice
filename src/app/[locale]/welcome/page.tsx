'use client';
/**
 * BUG-075: /welcome is no longer a password-setup page.
 * The platform is fully passwordless (OTP via Brevo, BUG-071).
 * This page simply redirects to /mn/access where users get their code.
 */
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // Strip any legacy Supabase hash tokens from the URL before redirecting
    router.replace(`/${locale}/access`);
  }, [locale, router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0d0d0d',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #1a1a1a',
          borderTopColor: '#00B5AD', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
        }} />
        <p style={{ color: '#6b7280', fontSize: 15 }}>Шилжиж байна...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
