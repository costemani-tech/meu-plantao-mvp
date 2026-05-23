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

  // Validação do HMAC-SHA256 (x-signature e x-request-id)
  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }

  // Extrair 'ts' e 'v1' do cabeçalho x-signature
  // x-signature: ts=...,v1=...
  const signatureParts = xSignature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const { ts, v1: receivedHash } = signatureParts;

  if (!ts || !receivedHash) {
    return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
  }

  // Re-gerar o hash:
  // Manifest = "id:<x-request-id>;request-id:<x-request-id>;ts:<ts>;"
  const urlParams = new URL(req.url).searchParams;
  const dataId = urlParams.get('data.id') || urlParams.get('id');

  if (!dataId) {
    return NextResponse.json({ received: true });
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(manifest);
  const expectedHash = hmac.digest('hex');

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );

    if (!isSignatureValid) {
       console.error('[MercadoPago Webhook] Invalid signature');
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch(e) {
      console.error('[MercadoPago Webhook] Invalid signature lengths or format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    let payloadDataId = dataId;
    let type;

    // Tentar ler do body (Webhook normal)
    try {
      const body = await req.json();
      payloadDataId = body?.data?.id || payloadDataId;
      type = body?.type;
    } catch {
      // Body não é JSON válido ou está vazio
    }

    if (!type) {
      type = urlParams.get('type') || urlParams.get('topic');
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    let isApproved = false;
    let userId = null;
    let paymentId = null;

    if (type === 'payment') {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: payloadDataId });
      
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
