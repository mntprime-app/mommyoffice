import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import VideoPlayer from '@/components/ui/VideoPlayer';

async function validateToken(token: string) {
  try {
    const supabase = await createAdminClient();

    const { data: accessToken, error } = await supabase
      .from('mo_access_tokens')
      .select('id, email, course_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !accessToken) return null;
    if (new Date(accessToken.expires_at) < new Date()) return null;

    // Fetch full course + modules
    const { data: course } = await supabase
      .from('mo_courses')
      .select(`
        id, title_mn, title_en, description_mn,
        mo_modules(id, title_mn, title_en, video_id, video_provider, sort_order)
      `)
      .eq('id', accessToken.course_id)
      .single();

    return { accessToken, course };
  } catch {
    return null;
  }
}

export default async function AccessPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;

  const result = await validateToken(token);

  if (!result) {
    return (
      <div style={{ maxWidth: '560px', margin: '6rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Нэвтрэх холбоос хүчингүй
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Энэ холбоос хугацаа дууссан эсвэл буруу байна. Тусламж авахыг хүсвэл бидэнтэй холбоо барина уу.
        </p>
      </div>
    );
  }

  const { course } = result;
  if (!course) return notFound();

  const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  const modules = Array.isArray(course.mo_modules)
    ? [...course.mo_modules].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sort_order) - Number(b.sort_order))
    : [];

  const firstModule = modules[0] as Record<string, unknown> | undefined;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{title}</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '2rem' }}>
        Нэвтэрсэн и-мэйл: {result.accessToken.email}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
        {/* Video player */}
        <div>
          {firstModule ? (
            <VideoPlayer
              videoId={String(firstModule.video_id || '')}
              provider={(firstModule.video_provider as 'youtube' | 'cloudflare') || 'youtube'}
              title={locale === 'mn' ? String(firstModule.title_mn || '') : String(firstModule.title_en || firstModule.title_mn || '')}
            />
          ) : (
            <div style={{
              aspectRatio: '16/9', background: '#1a1a2e', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '380px'
            }}>
              <p style={{ color: '#9ca3af' }}>Хичээлийн видео бэлдэгдэж байна...</p>
            </div>
          )}
        </div>

        {/* Module list */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Хичээлийн агуулга
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {modules.map((mod: Record<string, unknown>, i: number) => (
              <div key={String(mod.id)} style={{
                padding: '0.75rem 1rem',
                background: i === 0 ? 'var(--teal-light)' : '#fff',
                border: `1px solid ${i === 0 ? 'var(--teal)' : 'var(--border)'}`,
                borderRadius: '8px', cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: i === 0 ? 'var(--teal)' : '#e5e7eb',
                    color: i === 0 ? '#fff' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0
                  }}>
                    {i === 0 ? '▶' : i + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: i === 0 ? 600 : 400 }}>
                    {locale === 'mn' ? String(mod.title_mn || '') : String(mod.title_en || mod.title_mn || '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
