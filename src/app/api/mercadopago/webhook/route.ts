import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] ERRO CRÍTICO: MERCADOPAGO_WEBHOOK_SECRET não configurado. Adote estratégia fail-closed.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('[MercadoPago Webhook] Cabeçalhos de segurança ausentes.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const dataIdParams = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Parse do cabeçalho x-signature (formato: ts=12345,v1=hash_hmac)
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        const k = key.trim();
        const v = value.trim();
        if (k === 'ts') ts = v;
        if (k === 'v1') hash = v;
      }
    });

    if (!ts || !hash) {
      console.error('[MercadoPago Webhook] x-signature inválido.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tentar ler do body
    let rawBody = '';
    let dataId = dataIdParams;
    let type = url.searchParams.get('type') || url.searchParams.get('topic');
    try {
      rawBody = await req.text();
      const body = JSON.parse(rawBody);
      if (!dataId) dataId = body?.data?.id;
      if (!type) type = body?.type;
    } catch {
      // Ignorar
    }

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    // Gerar manifest para validação HMAC (apenas id, request-id e ts)
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');

    // Comparar hashes de forma segura
    const expectedBuffer = Buffer.from(expectedHash);
    const hashBuffer = Buffer.from(hash);

    if (expectedBuffer.length !== hashBuffer.length || !crypto.timingSafeEqual(expectedBuffer, hashBuffer)) {
      console.error(`[MercadoPago Webhook] Assinatura inválida.`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
