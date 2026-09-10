import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { BulkCheckoutView } from '@/components/ui/BulkCheckoutView';

async function getCoursesBySlugs(slugs: string[]) {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('mo_courses')
      .select('id, slug, title_mn, title_en, cover_image_url, price, original_price, category')
      .in('slug', slugs)
      .eq('is_published', true);
    return data || [];
  } catch { return []; }
}

export const metadata: Metadata = {
  title: 'Захиалга | Mommyoffice',
  robots: { index: false },
};

export default async function BulkCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { locale } = await params;
  const { slugs: slugsParam } = await searchParams;

  const slugs = slugsParam ? slugsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!slugs.length) notFound();

  const courses = await getCoursesBySlugs(slugs);
  if (!courses.length) notFound();

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <BulkCheckoutView locale={locale} courses={courses} />
    </div>
  );
}
