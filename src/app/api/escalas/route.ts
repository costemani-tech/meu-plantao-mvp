import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Tipos
type Regra = '12x36' | '24x48' | '24x72' | string;

interface PlantaoSlot {
  inicio: Date;
  fim: Date;
}

// ─────────────────────────────────────────────
// Motor matemático de geração de plantões
// ─────────────────────────────────────────────
function parseRegra(regra: Regra): { trabalho: number; ciclo: number } {
  const parts = regra.split('x');
  const trabalho = parseInt(parts[0], 10);
  const descanso = parseInt(parts[1], 10);
  return { trabalho, ciclo: trabalho + descanso };
}

function gerarPlantoesAte(
  dataInicio: Date,
  regra: Regra,
  dataFim: Date
): PlantaoSlot[] {
  const { trabalho, ciclo } = parseRegra(regra);
  const slots: PlantaoSlot[] = [];
  let cursor = new Date(dataInicio);

  while (cursor < dataFim) {
    const inicio = new Date(cursor);
    const fim = new Date(cursor);
    fim.setHours(fim.getHours() + trabalho);
    if (inicio < dataFim) slots.push({ inicio, fim });
    cursor = new Date(cursor);
    cursor.setHours(cursor.getHours() + ciclo);
  }

  return slots;
}

// ─────────────────────────────────────────────
// POST /api/escalas
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
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

    const usuario_id = user.id;

    // ── 2. Validação do corpo da requisição ──────────────────────────────────
    let body: { data_inicio?: string; regra?: string; local_id?: string; forcar_conflito?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.' },
        { status: 400 }
      );
    }

    const { data_inicio, regra, local_id, forcar_conflito } = body;

    if (!data_inicio || !regra || !local_id) {
      return NextResponse.json(
        { error: true, message: 'Preencha todos os campos obrigatórios para gerar a escala.' },
        { status: 400 }
      );
    }

    if (!/^\d+x\d+$/.test(regra)) {
      return NextResponse.json(
        { error: true, message: 'Regra de escala inválida. Selecione uma opção válida.' },
        { status: 400 }
      );
    }

    // ── 3. Prevenção de IDOR: verificar posse do local_id com cliente autenticado do usuário ──
    // Usa o cliente SSR (token do usuário), NÃO a service key — impossível forjar
    const { data: localDoUsuario, error: erroLocal } = await supabaseSSR
      .from('locais_trabalho')
      .select('id')
      .eq('id', local_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    if (erroLocal || !localDoUsuario) {
      return NextResponse.json(
        { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // ── 4. Cliente admin — instanciado SOMENTE após autenticação e posse confirmadas ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 5. Geração dos slots ─────────────────────────────────────────────────
    const anoAtual = new Date().getFullYear();
    const dataFim = new Date(anoAtual, 11, 31, 23, 59, 59);
    const slots = gerarPlantoesAte(new Date(data_inicio), regra as Regra, dataFim);

    if (slots.length === 0) {
      return NextResponse.json(
        { error: true, message: 'Nenhum plantão foi gerado. Verifique a data de início da escala.' },
        { status: 400 }
      );
    }

    // ── 6. Detecção de conflito ──────────────────────────────────────────────
    if (!forcar_conflito) {
      const inicioJanela = slots[0].inicio.toISOString();
      const fimJanela = slots[slots.length - 1].fim.toISOString();

      const { data: plantoesExistentes } = await supabaseAdmin
        .from('plantoes')
        .select('id, data_hora_inicio, data_hora_fim')
        .eq('usuario_id', usuario_id)
        .neq('status', 'Cancelado')
        .gte('data_hora_fim', inicioJanela)
        .lte('data_hora_inicio', fimJanela);

      if (plantoesExistentes && plantoesExistentes.length > 0) {
        const conflitos: Array<{ inicio: string; fim: string }> = [];
        for (const slot of slots) {
          const choca = plantoesExistentes.some(p =>
            new Date(p.data_hora_inicio) < slot.fim &&
            new Date(p.data_hora_fim) > slot.inicio
          );
          if (choca) {
            conflitos.push({
              inicio: slot.inicio.toISOString(),
              fim: slot.fim.toISOString(),
            });
            if (conflitos.length >= 3) break;
          }
        }

        if (conflitos.length > 0) {
          return NextResponse.json(
            {
              conflito: true,
              exemplos: conflitos,
              error: true,
              message: 'Não foi possível gerar a escala. Conflito de horários detectado com plantões existentes.',
              code: 'CONFLICT',
            },
            { status: 409 }
          );
        }
      }
    }

    // ── 7. Criar registro da escala ──────────────────────────────────────────
    const { data: escala, error: erroEscala } = await supabaseAdmin
      .from('escalas')
      .insert({
        usuario_id,
        local_id,
        data_inicio: new Date(data_inicio).toISOString().split('T')[0],
        regra,
      })
      .select()
      .single();

    if (erroEscala || !escala) {
      console.error('[API Escala POST] Erro interno:', erroEscala?.message || 'Falha ao criar escala');
      return NextResponse.json(
        { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.' },
        { status: 500 }
      );
    }

    // ── 8. Bulk insert dos plantões ──────────────────────────────────────────
    const plantoes = slots.map(s => ({
      escala_id: escala.id,
      usuario_id,
      local_id,
      data_hora_inicio: s.inicio.toISOString(),
      data_hora_fim: s.fim.toISOString(),
      status: 'Agendado',
      status_conflito: forcar_conflito === true,
    }));

    const { error: erroInsert } = await supabaseAdmin
      .from('plantoes')
      .insert(plantoes);

    if (erroInsert) {
      console.error('[API Escala POST] Erro interno:', erroInsert?.message || 'Falha no bulk insert');
      await supabaseAdmin.from('escalas').delete().eq('id', escala.id);
      return NextResponse.json(
        { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.' },
        { status: 500 }
      );
    }

    // ── 9. Resposta de sucesso ───────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      escala_id: escala.id,
      total_plantoes: plantoes.length,
      periodo_ate: dataFim.toLocaleDateString('pt-BR'),
      primeiro_plantao: slots[0].inicio.toISOString(),
      ultimo_plantao: slots[slots.length - 1].inicio.toISOString(),
      com_conflito: forcar_conflito === true,
    });

  } catch (err) {
    console.error('[API Escala POST] Erro interno:', (err as Error)?.message || 'Falha na operação');
    return NextResponse.json(
      { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.' },
      { status: 500 }
    );
  }
}
