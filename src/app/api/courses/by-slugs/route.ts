import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { slugs } = await req.json() as { slugs: string[] };
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ courses: [] });
    }
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('mo_courses')
      .select('id, slug, title_mn, title_en, cover_image_url, price, original_price, is_bestseller')
      .in('slug', slugs)
      .eq('is_published', true);
    if (error) return NextResponse.json({ courses: [] });
    return NextResponse.json({ courses: data || [] });
  } catch {
    return NextResponse.json({ courses: [] }, { status: 500 });
  }
}
