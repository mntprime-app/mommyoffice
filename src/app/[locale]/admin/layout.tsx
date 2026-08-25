export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#f3f4f6',
      minHeight: '100vh',
      color: '#111827',
    }}>
      {children}
    </div>
  );
}
