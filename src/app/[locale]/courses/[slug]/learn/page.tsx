import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
    robots: { index: false },
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

  // Course-level CF Stream UID (trailer / fallback video)
  const courseStreamId: string = course.cloudflare_stream_id || '';

  // Parse course_outline_mn → sections with per-lesson stream_ids
  type RawLesson = { title: string; stream_id?: string };
  type RawModule = { title: string; lessons: RawLesson[] };
  let sections: { section: string; lessons: { title: string; stream_id?: string }[] }[] = [];
  try {
    const raw = course.course_outline_mn;
    if (raw) {
      const parsed: RawModule[] = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        sections = parsed
          .filter((m) => m && m.title)
          .map((m) => ({
            section: m.title,
            lessons: (m.lessons || [])
              .filter((l) => l && l.title)
              .map((l) => ({ title: l.title, stream_id: l.stream_id || undefined })),
          }));
      }
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
      courseStreamId={courseStreamId}
      sections={sections}
      instructorName={instructorName}
      instructorSlug={instructorSlug}
    />
  );
}
