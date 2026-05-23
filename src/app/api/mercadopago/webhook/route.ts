import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] Webhook secret not configured.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signature || !requestId) {
      console.error('[MercadoPago Webhook] Missing x-signature or x-request-id headers.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // signature comes in format: "ts=1234567890,v1=hash123..."
    const parts = signature.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.error('[MercadoPago Webhook] Malformed signature header.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We must read the raw body for HMAC hashing before doing any JSON parsing
    const rawBody = await req.text();

    // According to MercadoPago docs, if body is empty or it's IPN, manifest logic might vary slightly
    // but the generic approach for standard MP Webhooks with x-signature is based on data.id

    let dataIdParam = null;
    let typeParam = null;

    let bodyData: any = {};
    if (rawBody) {
        try {
            bodyData = JSON.parse(rawBody);
            dataIdParam = bodyData?.data?.id;
            typeParam = bodyData?.type;
        } catch (e) {
            // body not valid JSON
        }
    }

    const url = new URL(req.url);
    if (!dataIdParam) dataIdParam = url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!typeParam) typeParam = url.searchParams.get('type') || url.searchParams.get('topic');

    // Let's use the correct dataId for manifest computation
    const manifestStr = `id:${dataIdParam};request-id:${requestId};ts:${ts};`;

    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifestStr)
      .digest('hex');

    const expectedHashBuffer = Buffer.from(expectedHash);
    const providedHashBuffer = Buffer.from(hash);

    if (expectedHashBuffer.length !== providedHashBuffer.length || !crypto.timingSafeEqual(expectedHashBuffer, providedHashBuffer)) {
      console.error('[MercadoPago Webhook] Invalid signature.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataId = dataIdParam;
    const type = typeParam;

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
