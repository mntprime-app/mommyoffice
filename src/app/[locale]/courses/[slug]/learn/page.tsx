import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { CoursePlayer } from '@/components/ui/CoursePlayer';

async function getCourse(slug: string) {
  try {
    const supabase = await createAdminClient();
    const { data: course, error } = await supabase
      .from('mo_courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !course) return null;
    let instructor = null;
    if (course.mo_instructor_id) {
      const { data: inst } = await supabase
        .from('mo_instructors')
        .select('id, name_mn, slug')
        .eq('id', course.mo_instructor_id)
        .single();
      instructor = inst;
    }
    return { ...course, instructor };
  } catch { return null; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: 'Сургалт олдсонгүй' };
  return {
    title: `${course.title_mn} — Үзэх | Mommyoffice`,
    robots: { index: false }, // Player pages should not be indexed
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  // If no video — redirect to course detail (nothing to play)
  if (!course.video_url) {
    redirect(`/${locale}/courses/${slug}`);
  }

  // Parse curriculum outline
  let sections: { section: string; lessons: string[] }[] = [];
  try {
    if (course.outline) {
      const parsed = typeof course.outline === 'string'
        ? JSON.parse(course.outline)
        : course.outline;
      if (Array.isArray(parsed)) sections = parsed;
    }
  } catch { /* keep empty */ }

  const title = locale === 'mn'
    ? (course.title_mn || '')
    : (course.title_en || course.title_mn || '');

  const instructorName = course.instructor?.name_mn || '';
  const instructorSlug = course.instructor?.slug || '';

  return (
    <CoursePlayer
      locale={locale}
      slug={slug}
      title={title}
      videoId={course.video_url}
      sections={sections}
      instructorName={instructorName}
      instructorSlug={instructorSlug}
    />
  );
}
