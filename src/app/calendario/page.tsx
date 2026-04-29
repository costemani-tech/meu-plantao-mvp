import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CalendarioInteractive from './CalendarioInteractive';
import { redirect } from 'next/navigation';

export default async function CalendarioPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch initial profile state on server
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, nome')
    .eq('id', user.id)
    .single();

  const isPro = profile?.is_pro === true;
  const userName = profile?.nome || 'Usuário';

  return <CalendarioInteractive initialIsPro={isPro} userName={userName} userId={user.id} />;
}
