import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[MercadoPago Webhook] Missing MERCADOPAGO_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const signatureHeader = req.headers.get('x-signature');
  const requestIdHeader = req.headers.get('x-request-id');

  if (!signatureHeader || !requestIdHeader) {
    console.warn('[MercadoPago Webhook] Missing x-signature or x-request-id headers');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse signature header (format: "ts=<timestamp>,v1=<hash>")
  const parts = signatureHeader.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) {
    console.warn('[MercadoPago Webhook] Invalid x-signature format');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Calculate HMAC-SHA256
  const url = new URL(req.url);
  const dataIdParam = url.searchParams.get('data.id') || url.searchParams.get('id') || '';
  const manifest = `id:${dataIdParam};request-id:${requestIdHeader};ts:${ts};`;

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(manifest);
  const digest = hmac.digest('hex');

  try {
    const expectedBuffer = Buffer.from(v1, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');

    if (expectedBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(expectedBuffer, digestBuffer)) {
      console.warn('[MercadoPago Webhook] Invalid signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (err) {
    console.warn('[MercadoPago Webhook] Invalid signature format', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
