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
// Skill @calcular-proximos-plantoes
// Motor matemático executado server-side
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

    if (inicio < dataFim) {
      slots.push({ inicio, fim });
    }

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
    // 1. Extrair ID do usuário direto do Cookie SSR (Impossível fraudar)
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
        },
      }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const usuario_id = user.id;

    const body = await req.json();
    const { data_inicio, regra, local_id, forcar_conflito } = body as {
      data_inicio: string;
      regra: Regra;
      local_id: string;
      forcar_conflito?: boolean;
    };

    // Validação básica
    if (!data_inicio || !regra || !local_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: data_inicio, regra, local_id' },
        { status: 400 }
      );
    }

    if (!/^\d+x\d+$/.test(regra)) {
      return NextResponse.json(
        { error: 'Regra inválida. Formato esperado: {trabalho}x{descanso} (ex: 12x36)' },
        { status: 400 }
      );
    }

    // Cliente Supabase server-side com Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Determina o horizonte e gera os slots antecipadamente para checar conflito
    const anoAtual = new Date().getFullYear();
    const dataFim = new Date(anoAtual, 11, 31, 23, 59, 59);
    const slots = gerarPlantoesAte(new Date(data_inicio), regra, dataFim);

    if (slots.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum plantão gerado. Verifique se a data de início está antes de 31/12/' + anoAtual },
        { status: 400 }
      );
    }

    // 2️⃣ Detecção de conflito — verifica sobreposição com plantões existentes do usuário
    if (!forcar_conflito) {
      const inicioJanela = slots[0].inicio.toISOString();
      const fimJanela = slots[slots.length - 1].fim.toISOString();

      // Busca plantões existentes do usuário no mesmo período
      const { data: plantoesExistentes } = await supabaseAdmin
        .from('plantoes')
        .select('id, data_hora_inicio, data_hora_fim')
        .eq('usuario_id', usuario_id)
        .neq('status', 'Cancelado')
        .gte('data_hora_fim', inicioJanela)
        .lte('data_hora_inicio', fimJanela);

      if (plantoesExistentes && plantoesExistentes.length > 0) {
        // Verifica sobreposição real slot a slot
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
            if (conflitos.length >= 3) break; // mostra no máximo 3 exemplos
          }
        }

        if (conflitos.length > 0) {
          return NextResponse.json(
            {
              conflito: true,
              total_conflitos: conflitos.length,
              exemplos: conflitos,
              message: `Você já tem plantões neste período. Encontramos ${conflitos.length} sobreposição(ões).`,
            },
            { status: 409 }
          );
        }
      }
    }

    // 3️⃣ Cria o registro da escala (template/regra)
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
      return NextResponse.json(
        { error: 'Erro ao criar escala: ' + erroEscala?.message },
        { status: 500 }
      );
    }

    // 4️⃣ Monta o array para bulk insert (com status_conflito se forçado)
    const plantoes = slots.map((s) => ({
      escala_id: escala.id,
      usuario_id,
      local_id,
      data_hora_inicio: s.inicio.toISOString(),
      data_hora_fim: s.fim.toISOString(),
      status: 'Agendado',
      status_conflito: forcar_conflito === true,
    }));

    // 5️⃣ Bulk insert na tabela plantoes
    const { error: erroInsert } = await supabaseAdmin
      .from('plantoes')
      .insert(plantoes);

    if (erroInsert) {
      await supabaseAdmin.from('escalas').delete().eq('id', escala.id);
      return NextResponse.json(
        { error: 'Erro ao inserir plantões: ' + erroInsert.message },
        { status: 500 }
      );
    }

    // 6️⃣ Retorna resultado
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
    console.error('Erro interno em /api/escalas:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
