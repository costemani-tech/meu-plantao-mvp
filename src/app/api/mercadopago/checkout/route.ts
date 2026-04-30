import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const { userId, userEmail, plan } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Faltando userId ou userEmail' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';
    let init_point = '';

    if (plan === 'mensal') {
      const preApproval = new PreApproval(client);
      const response = await preApproval.create({
        body: {
          reason: 'Meu Plantão Pro - Assinatura Mensal',
          external_reference: userId,
          payer_email: userEmail,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 9.90,
            currency_id: 'BRL',
          },
          back_url: `${baseUrl}/escalas`,
          status: 'pending'
        }
      });
      init_point = response.init_point!;
    } else {
      const preference = new Preference(client);
      const isAnual = plan === 'anual';
      
      const response = await preference.create({
        body: {
          items: [
            {
              id: plan,
              title: isAnual ? 'Meu Plantão Pro - Plano Anual' : 'Meu Plantão Pro - Avulso (1 Mês)',
              quantity: 1,
              unit_price: isAnual ? 89.90 : 9.90,
              currency_id: 'BRL',
            }
          ],
          payer: {
            email: userEmail
          },
          external_reference: userId,
          back_urls: {
            success: `${baseUrl}/escalas`,
            failure: `${baseUrl}/escalas`,
            pending: `${baseUrl}/escalas`,
          },
          auto_return: 'approved'
        }
      });
      init_point = response.init_point!;
    }

    return NextResponse.json({ init_point });
  } catch (error: any) {
    console.error('MercadoPago Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
