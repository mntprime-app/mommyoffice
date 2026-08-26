import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ ok: true, videos: [] });
  }

  const ids = idsParam.split(',').filter(Boolean).slice(0, 50); // max 50
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, videos: [] });
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('mo_videos')
      .select('id, title_mn, thumbnail_url, duration_text, category')
      .in('id', ids);

    if (error) {
      console.error('videos/by-ids error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, videos: data || [] });
  } catch (err) {
    console.error('videos/by-ids error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
