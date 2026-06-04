import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[MercadoPago Webhook] Missing MERCADOPAGO_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('[MercadoPago Webhook] Missing x-signature or x-request-id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair ts e v1 de x-signature
    const signatureParts = xSignature.split(',');
    let ts = '';
    let v1 = '';
    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      console.error('[MercadoPago Webhook] Invalid x-signature format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Precisamos do dataId para gerar o manifest
    // Vamos parsear a URL para ver se é data.id ou id
    const url = new URL(req.url);
    let webhookDataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Se não tiver na URL, tenta pegar do body temporariamente só para validar o HMAC
    let tempBody;
    try {
      const clonedReq = req.clone();
      tempBody = await clonedReq.json();
      if (!webhookDataId) webhookDataId = tempBody?.data?.id;
    } catch (e) {
      // Body não é JSON ou está vazio
    }

    if (webhookDataId) {
      const manifest = `id:${webhookDataId};request-id:${xRequestId};ts:${ts};`;
      const expectedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

      const v1Buffer = Buffer.from(v1);
      const expectedHashBuffer = Buffer.from(expectedHash);

      if (v1Buffer.length !== expectedHashBuffer.length || !crypto.timingSafeEqual(v1Buffer, expectedHashBuffer)) {
        console.error('[MercadoPago Webhook] Invalid HMAC signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
       console.error('[MercadoPago Webhook] dataId not found for signature verification');
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
