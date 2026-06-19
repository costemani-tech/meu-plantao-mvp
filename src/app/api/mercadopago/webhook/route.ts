export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[MercadoPago Webhook] Webhook secret not configured.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!xSignature || !xRequestId) {
      console.error('[MercadoPago Webhook] Missing signature headers.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const ts = xSignature.split(',').find(s => s.trim().startsWith('ts='))?.split('=')[1];
    const v1 = xSignature.split(',').find(s => s.trim().startsWith('v1='))?.split('=')[1];

    // Extrai data.id da query param pra manifest, mesmo se veio no body, mp assina com id
    // Mas a doc do mercado pago pro x-signature diz manifest = id:${dataId};request-id:${xRequestId};ts:${ts};
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    let bodyRaw = '';
    try {
      bodyRaw = await req.clone().text();
    } catch {}

    if (!dataId && bodyRaw) {
       try {
         const bodyObj = JSON.parse(bodyRaw);
         dataId = bodyObj?.data?.id;
       } catch {}
    }

    if (ts && v1 && dataId) {
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto.createHmac('sha256', secret);
      const hash = hmac.update(manifest).digest('hex');
      const expectedHash = Buffer.from(v1, 'hex');
      const calculatedHash = Buffer.from(hash, 'hex');
      if (expectedHash.length !== calculatedHash.length || !crypto.timingSafeEqual(expectedHash, calculatedHash)) {
         console.error('[MercadoPago Webhook] Invalid signature.');
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
       console.error('[MercadoPago Webhook] Could not validate signature.');
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let type = url.searchParams.get('type') || url.searchParams.get('topic');
    if (!type && bodyRaw) {
      try {
         const bodyObj = JSON.parse(bodyRaw);
         type = bodyObj?.type;
      } catch {}
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
