export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signature || !requestId) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
    }

    // signature format: ts=123,v1=hash
    let ts = '';
    let hash = '';
    const parts = signature.split(',');
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
    }

    // We need to parse URL or body to get data.id before validating the signature
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

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');

    if (expectedHash.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(hash))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
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
