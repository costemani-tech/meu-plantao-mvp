import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, end_date, auto_renew')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Se já estiver cancelado, apenas retorna sucesso
    if (profile.status === 'canceled') {
      return NextResponse.json({ success: true, message: 'Já cancelado', end_date: profile.end_date });
    }

    // Atualiza o banco de dados:
    // status = canceled, auto_renew = false
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'canceled',
        auto_renew: false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[API Cancelamento] Erro ao atualizar Supabase:', updateError);
      return NextResponse.json({ error: 'Erro ao cancelar assinatura no banco' }, { status: 500 });
    }

    // A integração com a API de cancelamento do Mercado Pago (preapproval) 
    // entraria aqui no futuro caso a gente volte a usar assinaturas recorrentes lá.
    // Atualmente R$ 9,90 é pagamento único, então não precisa cancelar no MP.

    return NextResponse.json({ success: true, end_date: profile.end_date });

  } catch (error: any) {
    console.error('[API Cancelamento] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
