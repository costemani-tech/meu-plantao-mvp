import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Parâmetros da Oferta de Lançamento (devem bater com /api/mercadopago/oferta-status)
const OFERTA_MAX_ASSINANTES = 100;
const OFERTA_DATA_LIMITE = new Date('2026-08-31T23:59:59-03:00');

async function isOfertaAtiva(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);
    return (count ?? 0) < OFERTA_MAX_ASSINANTES && new Date() <= OFERTA_DATA_LIMITE;
  } catch {
    return false;
  }
}

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

    const oferta = await isOfertaAtiva();

    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: [
          {
            id: oferta ? 'oferta_lancamento' : 'plano_anual_pro',
            title: oferta
              ? 'Meu Plantão PRO - Oferta de Lançamento (6 Meses)'
              : 'Meu Plantão PRO - Plano Anual',
            quantity: Number(1),
            currency_id: 'BRL',
            unit_price: oferta ? Number(9.90) : Number(89.90),
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

