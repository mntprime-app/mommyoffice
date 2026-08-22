import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#1a1a2e', color: '#9ca3af',
      padding: '3rem 1.5rem 2rem',
      marginTop: '4rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '32px', height: '32px', background: 'var(--teal)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '16px'
              }}>M</div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Mommyoffice</span>
            </div>
            <p style={{ fontSize: '14px', maxWidth: '260px', lineHeight: '1.6' }}>{t('tagline')}</p>
          </div>
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.75rem', fontSize: '14px' }}>Platform</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '14px' }}>
                <a href="/mn/courses" style={{ color: '#9ca3af', textDecoration: 'none' }}>Хичээлүүд</a>
                <a href="/mn/articles" style={{ color: '#9ca3af', textDecoration: 'none' }}>Нийтлэлүүд</a>
              </div>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.75rem', fontSize: '14px' }}>Social</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '14px' }}>
                <a href="https://www.facebook.com/MommyofficeMN" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>Facebook</a>
                <a href="https://www.instagram.com/mommyoffice_mo/" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>Instagram</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2d2d4e', paddingTop: '1.5rem', fontSize: '13px', textAlign: 'center' }}>
          © {year} Mommyoffice. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
