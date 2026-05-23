import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] Missing MERCADOPAGO_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dataId;
    let type;

    // Ler url search params
    const url = new URL(req.url);
    dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    type = url.searchParams.get('type') || url.searchParams.get('topic');

    if (!dataId) {
    }

    let clonedReq = req.clone();
    try {
        const body = await clonedReq.json();
        if (!dataId) dataId = body?.data?.id;
        if (!type) type = body?.type;
    } catch (e) {
    }

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    // x-signature format: ts=123456,v1=abcdef...
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      else if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');

    try {
      if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch (e) {
      // Catch length mismatch error in timingSafeEqual
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
