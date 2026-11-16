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

    // Fetch ALL active, in-schedule ads for this slot so we can rotate fairly.
    const { data, error } = await supabase
      .from('mo_ads')
      .select('id, slot, title, target_url, media_url, media_type, mobile_image_url')
      .eq('slot', slot)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Fair random rotation — pick one ad per request so each advertiser
    // gets equal exposure regardless of upload order or creation date.
    const ad = data[Math.floor(Math.random() * data.length)];

    // no-store: each request picks a fresh random ad.
    // If you ever want CDN caching, switch to private/no-cache so only the
    // browser caches (tab-scoped) while CDN edge doesn't lock one ad in.
    return NextResponse.json({ ad }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ ad: null });
  }
}
