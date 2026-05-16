import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[MercadoPago Webhook] MERCADOPAGO_WEBHOOK_SECRET is not defined. Failing securely.');
      return NextResponse.json({ error: 'Internal Configuration Error' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('[MercadoPago Webhook] Missing x-signature or x-request-id headers.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Processar os headers do Mercado Pago
    // x-signature tem formato: "ts=1234567890,v1=abcdef123456..."
    const signatureParts = xSignature.split(',');
    let ts = '';
    let v1 = '';

    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      console.error('[MercadoPago Webhook] Invalid x-signature format.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Para evitar ler req.json() antes de gerar o payload pra assinatura, pegamos o raw body
    const rawBody = await req.text();

    // Gerar manifest string: id;request-id;ts;url
    // O Mercado Pago documenta a string de manifest com a qual geraram o hash.
    // A documentação pede para validar o body todo (se for payload) ou urlSearchParams
    // Mercado Pago webhook HMAC format:
    const urlParams = new URL(req.url).search; // e.g. "?data.id=123&type=payment"
    let manifestData = '';

    // Se o webhook envia "data.id" na query, o manifest usa isso, senão usa o rawBody/id.
    // O guia oficial sugere:
    // const manifest = `id:${data.id};request-id:${xRequestId};ts:${ts};`; (Simplificado pelo MP)
    // Para simplificar e garantir a segurança sem quebrar IPN vs Webhook,
    // a recomendação da doc atual do MP para validação V1 (HMAC) no Webhook é assinar as chaves base:

    // Ler o JSON com segurança a partir do rawBody já em memória
    let body = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // Ignorar, pode ser IPN sem body
    }

    let dataId;
    let type;

    // Tentar ler do body (Webhook normal)
    try {
      dataId = (body as any)?.data?.id;
      type = (body as any)?.type;
    } catch {
      // Ignorado
    }

    // Se não veio no body, tentar ler das query params (IPN)
    const url = new URL(req.url);
    if (!dataId) dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    if (!type) type = url.searchParams.get('type') || url.searchParams.get('topic');

    if (!dataId) {
      return NextResponse.json({ received: true });
    }

    // Validar assinatura (https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#signature-validation)
    // manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const generatedSignature = hmac.digest('hex');

    // Usar timingSafeEqual para comparar e evitar ataques de tempo
    if (!crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(v1))) {
      console.error('[MercadoPago Webhook] HMAC Signature Validation Failed.');
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
