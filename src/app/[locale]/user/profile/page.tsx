import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserProfileClient } from '@/components/ui/UserProfileClient';

export const metadata = { title: 'Миний профайл | Mommyoffice', robots: { index: false } };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/${locale}`);
  }

  const user = session.user;
  const meta = (user.user_metadata ?? {}) as Record<string, string>;

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>
      <UserProfileClient
        locale={locale}
        userId={user.id}
        email={user.email ?? ''}
        initialFirstName={meta.first_name ?? ''}
        initialLastName={meta.last_name ?? ''}
        initialPhone={meta.phone ?? ''}
        initialAvatarUrl={meta.avatar_url ?? ''}
      />
    </div>
  );
}
