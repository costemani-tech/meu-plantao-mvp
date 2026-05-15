import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import MeuPlanoClient from './MeuPlanoClient';
import { isUserPro } from '../../lib/supabase';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}

export default async function MeuPlanoPage() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type, status, start_date, end_date, auto_renew, launch_offer, is_pro')
    .eq('id', user.id)
    .single();

  // Buscar count de locais ativos do usuário
  const { count: locaisCount } = await supabase
    .from('locais_trabalho')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('ativo', true);

  const isWhitelist = isUserPro(user.email);
  const endDate = profile?.end_date;
  const launchOffer = profile?.launch_offer || false;
  const autoRenew = profile?.auto_renew || false;
  const subStatus = profile?.status || 'active';

  let isPro = false;
  if (endDate) {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    isPro = end > now;
  } else if (isWhitelist || profile?.is_pro === true) {
    isPro = true;
  }

  // Calcular dias restantes se PRO
  let diasRestantes: number | null = null;
  if (isPro && endDate) {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    diasRestantes = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <MeuPlanoClient
      isPro={isPro}
      subStatus={subStatus}
      endDate={endDate || null}
      autoRenew={autoRenew}
      launchOffer={launchOffer}
      locaisUsados={locaisCount ?? 0}
      locaisMax={2}
      diasRestantes={diasRestantes}
    />
  );
}
