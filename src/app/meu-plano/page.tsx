import { Suspense } from 'react';
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

  // Se não for PRO e não tiver end_date futuro, não faz sentido ver essa tela,
  // mas para não dar block duro, deixamos ele ver que o plano é FREE.
  
  const isWhitelist = isUserPro(user.email);
  const planType = profile?.plan_type || 'FREE';
  const subStatus = profile?.status || 'active';
  const endDate = profile?.end_date;
  const launchOffer = profile?.launch_offer || false;
  const autoRenew = profile?.auto_renew || false;

  let isActive = false;
  if (endDate) {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    isActive = end > now;
  } else if (isWhitelist || profile?.is_pro === true) {
    isActive = true;
  }

  // Define o nome de exibição do plano
  let planName = 'Plano Gratuito';
  if (isActive) {
    if (launchOffer) {
      planName = 'Plano PRO — Oferta de Lançamento 💎';
    } else {
      planName = 'Plano PRO';
    }
  }

  return (
    <div style={{ padding: '0 16px 120px 16px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header" style={{ paddingTop: 16 }}>
        <h1>Meu Plano</h1>
        <p>Gerencie sua assinatura e configurações de pagamento.</p>
      </div>

      <MeuPlanoClient
        planName={planName}
        isActive={isActive}
        subStatus={subStatus}
        endDate={endDate}
        autoRenew={autoRenew}
      />
    </div>
  );
}
