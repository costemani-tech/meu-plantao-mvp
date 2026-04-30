import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const { userId, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Faltando userId ou userEmail' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    const preApproval = new PreApproval(client);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';

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

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error('MercadoPago Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
