import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const { userId, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Faltando userId ou userEmail' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';
    
    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'oferta_lancamento',
            title: 'Meu Plantão PRO - Oferta de Lançamento (1 Ano)',
            quantity: Number(1),
            currency_id: 'BRL',
            unit_price: Number(9.90)
          }
        ],
        payer: {
          email: userEmail
        },
        back_urls: {
          success: `${baseUrl}/escalas`,
          failure: `${baseUrl}/escalas`,
          pending: `${baseUrl}/escalas`
        },
        auto_return: 'approved',
        external_reference: String(userId)
      }
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error('MercadoPago Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
