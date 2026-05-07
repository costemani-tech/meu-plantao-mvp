export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    let dataId;
    let type;

    // Tentar ler do body (Webhook normal)
    const url = new URL(req.url);
    const signatureHeader = req.headers.get('x-signature');
    const requestIdHeader = req.headers.get('x-request-id');
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signatureHeader || !requestIdHeader) {
        console.error('[MercadoPago Webhook] Headers de assinatura ausentes');
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }

      // Formato do x-signature: ts=123,v1=hash
      const parts = signatureHeader.split(',');
      let ts, v1;
      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') v1 = value;
      });

      if (!ts || !v1) {
        console.error('[MercadoPago Webhook] Formato de assinatura inválido');
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }

      // Tentar buscar data.id primeiro da URL, senão do body depois
      const dataIdFromUrl = url.searchParams.get('data.id') || url.searchParams.get('id');
      let dataIdFromBody = '';

      const rawBody = await req.text();
      try {
        const bodyJson = JSON.parse(rawBody);
        dataIdFromBody = bodyJson?.data?.id || '';
      } catch {}

      const finalDataId = dataIdFromUrl || dataIdFromBody;

      if (finalDataId) {
        const manifest = `id:${finalDataId};request-id:${requestIdHeader};ts:${ts};`;
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

        try {
          const expectedBuffer = Buffer.from(expectedSignature, 'hex');
          const receivedBuffer = Buffer.from(v1, 'hex');
          if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
            console.error('[MercadoPago Webhook] Assinatura inválida');
            return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
          }
        } catch {
          console.error('[MercadoPago Webhook] Assinatura inválida');
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
        }
      }

      // Re-parse the body now that we've read it as text
      try {
        const body = JSON.parse(rawBody);
        dataId = body?.data?.id;
        type = body?.type;
      } catch {}
    } else {
      // Fail closed: Sem a chave configurada, não processamos o webhook.
      console.error('[MercadoPago Webhook] ERRO CRÍTICO: MERCADOPAGO_WEBHOOK_SECRET não configurado.');
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    // Se não veio no body, tentar ler das query params (IPN)
    if (!dataId) dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!type) type = url.searchParams.get('type') || url.searchParams.get('topic');

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    let isApproved = false;
    let userId = null;
    let paymentId = null;

    if (type === 'payment') {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: dataId });
      
      if (payment.status === 'approved' && payment.external_reference) {
        isApproved = true;
        userId = payment.external_reference;
        paymentId = payment.id;
      }
    }

    if (isApproved && userId) {
      // Atualizar is_pro e pro_expires_at (6 meses) no Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Calcula expiração: 6 meses a partir de agora
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_pro: true, // Retrocompatibility
          pro_expires_at: expiresAt.toISOString(), // Retrocompatibility
          plan_type: 'PRO',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: expiresAt.toISOString(),
          auto_renew: false,
          mercadopago_id: paymentId ? String(paymentId) : null,
          launch_offer: true
        })
        .eq('id', userId);

      if (error) {
        console.error('[MercadoPago Webhook] Erro ao atualizar usuário para PRO:', error);
      } else {
        console.log(`[MercadoPago Webhook] Usuário ${userId} promovido para PRO com sucesso (Oferta Lançamento - 6 meses, expira em ${expiresAt.toISOString()}).`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[MercadoPago Webhook] Erro interno:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
