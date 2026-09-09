import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'course-staging';

export async function POST(req: NextRequest) {
  try {
    const { storagePath } = await req.json();
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ error: 'storagePath required' }, { status: 400 });
    }
    // Safety: only allow paths inside course-staging (no path traversal)
    if (storagePath.includes('..') || storagePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
