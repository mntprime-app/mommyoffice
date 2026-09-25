'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root 404 — fires when no route matches at all (e.g. /courses without locale prefix).
 * Redirect to the Mongolian homepage rather than dead-ending the user.
 */
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mn');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p style={{ color: '#9ca3af', fontSize: '15px' }}>Хуудас олдсонгүй. Нүүр хуудас руу буцаж байна...</p>
    </div>
  );
}
