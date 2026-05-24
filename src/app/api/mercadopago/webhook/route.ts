import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] Secret não configurada.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const signatureHeader = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signatureHeader || !requestId) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 400 });
    }

    const tsMatch = signatureHeader.match(/ts=(\d+)/);
    const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);

    if (!tsMatch || !v1Match) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
    }

    const ts = tsMatch[1];
    const receivedHash = v1Match[1];

    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    // Must read raw body to calculate HMAC correctly
    const rawBody = await req.text();

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');

    if (expectedHash.length !== receivedHash.length || !crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(receivedHash))) {
      console.error('[MercadoPago Webhook] Assinatura inválida.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let type = url.searchParams.get('type') || url.searchParams.get('topic');

    // Parse body only after reading it raw
    let body;
    try {
      if (rawBody) {
        body = JSON.parse(rawBody);
        type = type || body?.type;
      }
    } catch {
       // Body não é JSON válido ou está vazio
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
        console.error('[MercadoPago Webhook] Erro ao atualizar usuário para PRO.');
      } else {
        console.log(`[MercadoPago Webhook] Usuário ${userId} promovido para PRO com sucesso (Oferta Lançamento - 6 meses, expira em ${expiresAt.toISOString()}).`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[MercadoPago Webhook] Erro interno.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
