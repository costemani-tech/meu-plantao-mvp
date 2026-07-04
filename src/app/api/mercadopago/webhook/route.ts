export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const signatureHeader = req.headers.get('x-signature');
    const requestIdHeader = req.headers.get('x-request-id');

    if (!signatureHeader || !requestIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse signature header: ts=...;v1=...
    const parts = signatureHeader.split(',');
    let ts = '';
    let v1 = '';
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dataId;
    let type;
    let rawBody = '';

    // Tentar ler do body (Webhook normal)
    try {
      rawBody = await req.text();
      const body = JSON.parse(rawBody);
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

    // Validate signature
    const manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    const expectedHashBuffer = Buffer.from(hmac);
    const receivedHashBuffer = Buffer.from(v1);

    if (expectedHashBuffer.length !== receivedHashBuffer.length || !crypto.timingSafeEqual(expectedHashBuffer, receivedHashBuffer)) {
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

      if (!supabaseUrl || !supabaseKey) {
          return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }

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
