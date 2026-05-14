import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Parâmetros da Oferta de Lançamento
const OFERTA_MAX_ASSINANTES = 100;
const OFERTA_DATA_LIMITE = new Date('2026-08-31T23:59:59-03:00');

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Conta quantos usuários têm o plano PRO ativo
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);

    if (error) {
      console.error('[OfertaStatus] Erro ao contar assinantes PRO:', error);
      return NextResponse.json({ ofertaAtiva: false, proCount: 0, error: 'Internal Server Error' }, { status: 500 });
    }

    const proCount = count ?? 0;
    const agora = new Date();

    const ofertaAtiva =
      proCount < OFERTA_MAX_ASSINANTES && agora <= OFERTA_DATA_LIMITE;

    return NextResponse.json({
      ofertaAtiva,
      proCount,
      maxAssinantes: OFERTA_MAX_ASSINANTES,
      dataLimite: OFERTA_DATA_LIMITE.toISOString(),
    });
  } catch (error: any) {
    console.error('[OfertaStatus] Erro interno:', error);
    return NextResponse.json({ ofertaAtiva: false, proCount: 0, error: 'Internal Server Error' }, { status: 500 });
  }
}
