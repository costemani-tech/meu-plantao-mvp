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
    // ── 1. Autenticação rigorosa via JWT/Cookie SSR ──────────────────────────
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: true, message: 'Sessão expirada. Faça login novamente.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // ── 2. Validação dos parâmetros ──────────────────────────────────────────
    const { id: escala_id } = await params;

    let body: { modo?: string; data_encerramento?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: true, message: 'Não foi possível processar a exclusão. Tente novamente.' },
        { status: 400 }
      );
    }

    const { modo, data_encerramento } = body;

    if (!modo || !['completo', 'encerrar_em'].includes(modo)) {
      return NextResponse.json(
        { error: true, message: 'Modo de exclusão inválido.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }
    if (modo === 'encerrar_em' && !data_encerramento) {
      return NextResponse.json(
        { error: true, message: 'Data de encerramento é obrigatória.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // ── 3. Cliente admin — instanciado SOMENTE após autenticação confirmada ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 4. Verificar que a escala pertence ao usuário autenticado ────────────
    const { data: escala, error: erroEscala } = await supabaseAdmin
      .from('escalas')
      .select('id, usuario_id')
      .eq('id', escala_id)
      .eq('usuario_id', user.id)   // RLS manual dupla
      .single();

    if (erroEscala || !escala) {
      return NextResponse.json(
        { error: true, message: 'Escala não encontrada.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // ── 5a. MODO COMPLETO ────────────────────────────────────────────────────
    if (modo === 'completo') {
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

    // ── 5b. MODO ENCERRAR_EM ─────────────────────────────────────────────────
    const dataCorte = new Date(data_encerramento!).toISOString();

    const { count, error: erroDelete } = await supabaseAdmin
      .from('plantoes')
      .delete({ count: 'exact' })
      .eq('escala_id', escala_id)
      .eq('usuario_id', user.id)
      .gte('data_hora_inicio', dataCorte);

    if (erroDelete) {
      console.error('[API Escala DELETE] Erro interno:', erroDelete?.message || 'Falha ao encerrar escala');
      return NextResponse.json(
        { error: true, message: 'Não foi possível processar a exclusão. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modo: 'encerrar_em',
      plantoes_removidos: count ?? 0,
      data_corte: dataCorte,
    });

  } catch (err) {
    console.error('[API Escala DELETE] Erro interno:', (err as Error)?.message || 'Falha na operação');
    return NextResponse.json(
      { error: true, message: 'Não foi possível processar a exclusão. Tente novamente.' },
      { status: 500 }
    );
  }
}
