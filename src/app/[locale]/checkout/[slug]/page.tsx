import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { CheckoutView } from '@/components/ui/CheckoutView';

async function getCourse(slug: string) {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('mo_courses')
      .select('id, slug, title_mn, title_en, cover_image_url, price, original_price, category')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: 'Захиалга | Mommyoffice' };
  const title = locale === 'mn' ? course.title_mn : (course.title_en || course.title_mn);
  return {
    title: `${title} — Захиалга | Mommyoffice`,
    robots: { index: false },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <CheckoutView locale={locale} course={course} />
    </div>
  );
}
