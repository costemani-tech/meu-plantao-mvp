import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signatureHeader = req.headers.get('x-signature');
    const requestIdHeader = req.headers.get('x-request-id');
    const mpWebhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!mpWebhookSecret) {
      console.error('[MercadoPago Webhook] ERRO: MERCADOPAGO_WEBHOOK_SECRET não configurado.');
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
    }

    if (!signatureHeader || !requestIdHeader) {
      return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 });
    }

    const signatureParts = signatureHeader.split(',');
    let ts = '';
    let hash = '';

    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      return NextResponse.json({ error: 'Formato de assinatura inválido' }, { status: 400 });
    }

    const url = new URL(req.url);
    const dataIdQuery = url.searchParams.get('data.id') || url.searchParams.get('id');

    let bodyText = '';
    try {
      bodyText = await req.text();
    } catch (e) {
      // Ignorar erro se o corpo estiver vazio
    }

    // A string manifest a ser assinada pelo HMAC-SHA256
    const manifest = `id:${dataIdQuery || ''};request-id:${requestIdHeader};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', mpWebhookSecret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    // Validação resistente a ataques de tempo
    let signatureIsValid = false;
    try {
      signatureIsValid = crypto.timingSafeEqual(
        Buffer.from(calculatedHash),
        Buffer.from(hash)
      );
    } catch (e) {
      signatureIsValid = false;
    }

    if (!signatureIsValid) {
      console.error('[MercadoPago Webhook] ERRO: Assinatura HMAC inválida.');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    let dataId;
    let type;

    // Tentar ler do body (Webhook normal)
    try {
      const body = JSON.parse(bodyText);
      dataId = body?.data?.id;
      type = body?.type;
    } catch {
      // Body não é JSON válido ou está vazio
    }


    // Se não veio no body, tentar ler das query params (IPN)
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
