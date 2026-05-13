import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado.');
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const url = new URL(req.url);
    const dataIdParams = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!xSignature || !xRequestId || !dataIdParams) {
      return NextResponse.json({ error: 'Assinatura, Request ID ou ID inválidos' }, { status: 400 });
    }

    // x-signature: ts=...,v1=...
    const signatureParts = xSignature.split(',');
    let ts = '';
    let hash = '';

    for (const part of signatureParts) {
      if (part.startsWith('ts=')) ts = part.substring(3);
      if (part.startsWith('v1=')) hash = part.substring(3);
    }

    if (!ts || !hash) {
      return NextResponse.json({ error: 'Assinatura mal formatada' }, { status: 400 });
    }

    const manifest = `id:${dataIdParams};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const generatedHash = hmac.digest('hex');

    try {
      if (
        hash.length !== generatedHash.length ||
        !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(generatedHash))
      ) {
        console.error('[MercadoPago Webhook] Assinatura inválida');
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    } catch (err) {
      console.error('[MercadoPago Webhook] Erro na comparação da assinatura');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    let dataId = dataIdParams;
    let type = url.searchParams.get('type') || url.searchParams.get('topic');

    // Tentar ler do body (Webhook normal)
    try {
      const body = await req.json();
      if (body?.data?.id) dataId = body.data.id;
      if (body?.type) type = body.type;
    } catch {
      // Body não é JSON válido ou está vazio
    }

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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
