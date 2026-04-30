import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    let dataId;
    let type;

    // Tentar ler do body (Webhook normal)
    try {
      const body = await req.json();
      dataId = body?.data?.id;
      type = body?.type;
    } catch {
      // Body não é JSON válido ou está vazio
    }

    // Se não veio no body, tentar ler das query params (IPN)
    const url = new URL(req.url);
    if (!dataId) dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!type) type = url.searchParams.get('type') || url.searchParams.get('topic');

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    // Se for aprovação de assinatura
    if (type === 'subscription_preapproval') {
      const preApproval = new PreApproval(client);
      const subscription = await preApproval.get({ id: dataId });
      
      if (subscription.status === 'authorized' && subscription.external_reference) {
        const userId = subscription.external_reference;
        
        // Atualizar is_pro no Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', userId);

        if (error) {
          console.error('[MercadoPago Webhook] Erro ao atualizar usuário para PRO:', error);
        } else {
          console.log(`[MercadoPago Webhook] Usuário ${userId} promovido para PRO com sucesso.`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[MercadoPago Webhook] Erro interno:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
