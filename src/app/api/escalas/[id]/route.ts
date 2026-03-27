import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ─────────────────────────────────────────────
// DELETE /api/escalas/[id]
// Modo 'completo':    deleta escala + todos os plantões (cascade)
// Modo 'encerrar_em': deleta só plantões futuros a partir da data
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticar via Cookie SSR
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: escala_id } = await params;
    const body = await req.json() as { modo: 'completo' | 'encerrar_em'; data_encerramento?: string };
    const { modo, data_encerramento } = body;

    if (!modo || !['completo', 'encerrar_em'].includes(modo)) {
      return NextResponse.json({ error: 'modo deve ser "completo" ou "encerrar_em"' }, { status: 400 });
    }
    if (modo === 'encerrar_em' && !data_encerramento) {
      return NextResponse.json({ error: 'data_encerramento é obrigatória no modo encerrar_em' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Verificar que a escala pertence ao usuário autenticado
    const { data: escala, error: erroEscala } = await supabaseAdmin
      .from('escalas')
      .select('id, usuario_id')
      .eq('id', escala_id)
      .eq('usuario_id', user.id)   // RLS manual — segurança dupla
      .single();

    if (erroEscala || !escala) {
      return NextResponse.json({ error: 'Escala não encontrada ou acesso negado' }, { status: 404 });
    }

    if (modo === 'completo') {
      // 3a. MODO COMPLETO: deleta plantões vinculados + a escala
      await supabaseAdmin
        .from('plantoes')
        .delete()
        .eq('escala_id', escala_id)
        .eq('usuario_id', user.id);

      await supabaseAdmin
        .from('escalas')
        .delete()
        .eq('id', escala_id)
        .eq('usuario_id', user.id);

      return NextResponse.json({ success: true, modo: 'completo' });
    }

    // 3b. MODO ENCERRAR_EM: deleta só plantões futuros da escala
    const dataCorte = new Date(data_encerramento!).toISOString();

    const { count, error: erroDelete } = await supabaseAdmin
      .from('plantoes')
      .delete({ count: 'exact' })
      .eq('escala_id', escala_id)
      .eq('usuario_id', user.id)
      .gte('data_hora_inicio', dataCorte);

    if (erroDelete) {
      return NextResponse.json({ error: 'Erro ao encerrar escala: ' + erroDelete.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      modo: 'encerrar_em',
      plantoes_removidos: count ?? 0,
      data_corte: dataCorte,
    });

  } catch (err) {
    console.error('Erro em DELETE /api/escalas/[id]:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
