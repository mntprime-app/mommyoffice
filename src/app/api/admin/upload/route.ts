/**
 * POST /api/admin/upload?folder=ads
 *
 * Admin-only file upload to Supabase storage.
 * This is a plain Route Handler (not a Server Action) to avoid React 19
 * error #441, which is thrown when Server Actions are called from async
 * event handlers outside of startTransition.
 *
 * Body: multipart/form-data with field "file"
 * Query: ?folder=ads (default: "ads")
 * Returns: { error: string | null, url: string | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const BUCKET = 'mommyoffice-media';

async function checkAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const rawList = process.env.ADMIN_EMAILS || 'info.mommyoffice@gmail.com';
    const allowed = rawList.split(',').map((e) => e.trim().toLowerCase());
    return allowed.includes((user.email ?? '').toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized', url: null }, { status: 401 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data', url: null }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Файл олдсонгүй', url: null }, { status: 400 });
  }

  // 50 MB hard cap
  const MAX_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл хэт том байна (макс 50MB)', url: null }, { status: 400 });
  }

  const folder = req.nextUrl.searchParams.get('folder') || 'ads';

  try {
    const supabase = await createAdminClient();

    // Ensure bucket exists (service role; silently ignores "already exists")
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type === 'image/webp' ? 'webp'
              : file.type === 'video/mp4'   ? 'mp4'
              : file.type === 'video/webm'  ? 'webm'
              : (file.name.split('.').pop() || 'bin');

    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { upsert: false, contentType: file.type || 'application/octet-stream' });

    if (error) {
      return NextResponse.json({ error: error.message, url: null }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ error: null, url: publicUrl });

  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload алдаа гарлаа', url: null },
      { status: 500 }
    );
  }
}
