import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export default async function AdminCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/admin/login`);

  const adminClient = await createAdminClient();
  const { data: courses } = await adminClient
    .from('mo_courses')
    .select('id, title_mn, price, is_published, category, slug, created_at')
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.25rem' }}>
            <Link href={`/${locale}/admin`} style={{ color: '#00B5AD', textDecoration: 'none' }}>Admin</Link> / Хичээлүүд
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Хичээлүүд ({courses?.length || 0})</h1>
        </div>
        <Link href={`/${locale}/admin/courses/new`} style={{
          background: '#00B5AD', color: '#fff',
          padding: '10px 20px', borderRadius: '10px',
          fontWeight: 600, textDecoration: 'none', fontSize: '14px'
        }}>
          + Шинэ хичээл
        </Link>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#222', borderBottom: '1px solid #2a2a2a' }}>
              {['Хичээлийн нэр', 'Ангилал', 'Үнэ', 'Статус', 'Үйлдэл'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(courses || []).map((course, i) => (
              <tr key={course.id} style={{ borderBottom: i < (courses?.length || 1) - 1 ? '1px solid #2a2a2a' : 'none' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '14px', color: '#e5e5e5' }}>{course.title_mn}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                  <span style={{ background: 'rgba(0,181,173,0.15)', color: '#00B5AD', padding: '2px 10px', borderRadius: '10px', fontWeight: 600, fontSize: '12px' }}>
                    {course.category}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
                  {Number(course.price) === 0 ? 'Үнэгүй' : `${Number(course.price).toLocaleString()}₮`}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                    background: course.is_published ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: course.is_published ? '#10b981' : '#f59e0b'
                  }}>
                    {course.is_published ? 'Нийтлэгдсэн' : 'Ноорог'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Link href={`/${locale}/admin/courses/${course.id}/edit`} style={{
                    color: '#00B5AD', textDecoration: 'none', fontSize: '13px', fontWeight: 600
                  }}>
                    Засах →
                  </Link>
                </td>
              </tr>
            ))}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  Хичээл байхгүй байна. Шинэ хичээл нэмнэ үү.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
