import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DashboardInteractive from './DashboardInteractive';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
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

  // Verificar diretamente no banco se o usuário é PRO via SSR
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single();

  const isPro = profile?.is_pro === true;

  return <DashboardInteractive initialIsPro={isPro} userId={user.id} />;
}
