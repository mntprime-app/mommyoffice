import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slot: string }> },
) {
  const { slot } = await params;
  try {
    const supabase = await createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('mo_ads')
      .select('id, slot, title, target_url, media_url, media_type, mobile_image_url')
      .eq('slot', slot)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ ad: null });
    }

    return NextResponse.json({ ad: data }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({ ad: null });
  }
}
