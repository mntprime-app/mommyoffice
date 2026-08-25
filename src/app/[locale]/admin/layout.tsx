export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#141414',
      minHeight: '100vh',
      color: '#e5e5e5',
    }}>
      {children}
    </div>
  );
}
