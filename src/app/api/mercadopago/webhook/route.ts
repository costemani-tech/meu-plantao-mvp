
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 });
    }

    // Parse x-signature parts
    const parts = xSignature.split(',');
    let ts = '';
    let v1 = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        if (key.trim() === 'ts') ts = value.trim();
        if (key.trim() === 'v1') v1 = value.trim();
      }
    }

    if (!ts || !v1) {
      return NextResponse.json({ error: 'Invalid x-signature format' }, { status: 401 });
    }

    // Try parsing the body and fallback to IPN query parameters
    let bodyText = '';
    let dataId;
    let type;

    try {
      bodyText = await req.text();
      const body = JSON.parse(bodyText);
      dataId = body?.data?.id;
      type = body?.type;
    } catch {
      // Ignore text or parsing errors
    }

    const url = new URL(req.url);
    if (!dataId) dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!type) type = url.searchParams.get('type') || url.searchParams.get('topic');

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    // Validate signature
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    if (hmac.length !== v1.length || !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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
