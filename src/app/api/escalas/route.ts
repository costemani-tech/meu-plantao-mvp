import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Tipos
type Regra = '12x36' | '24x48' | '24x72';

interface PlantaoSlot {
  inicio: Date;
  fim: Date;
}

// ─────────────────────────────────────────────
// Skill @calcular-proximos-plantoes
// Motor matemático executado server-side
// ─────────────────────────────────────────────
const CICLO_HORAS: Record<Regra, { trabalho: number; ciclo: number }> = {
  '12x36': { trabalho: 12, ciclo: 48 },
  '24x48': { trabalho: 24, ciclo: 72 },
  '24x72': { trabalho: 24, ciclo: 96 },
};

function gerarPlantoesAte(
  dataInicio: Date,
  regra: Regra,
  dataFim: Date
): PlantaoSlot[] {
  const { trabalho, ciclo } = CICLO_HORAS[regra];
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
    const { data_inicio, regra, local_id } = body as {
      data_inicio: string;
      regra: Regra;
      local_id: string;
    };

    // Validação básica
    if (!data_inicio || !regra || !local_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: data_inicio, regra, local_id, usuario_id' },
        { status: 400 }
      );
    }

    if (!['12x36', '24x48', '24x72'].includes(regra)) {
      return NextResponse.json(
        { error: 'Regra inválida. Use: 12x36, 24x48 ou 24x72' },
        { status: 400 }
      );
    }

    // Cliente Supabase server-side com Service Role Key
    // (nunca exposta ao browser — sem prefixo NEXT_PUBLIC_)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Cria o registro da escala (template/regra)
    const { data: escala, error: erroEscala } = await supabaseAdmin
      .from('escalas')
      .insert({
        usuario_id,
        local_id,
        data_inicio: new Date(data_inicio).toISOString().split('T')[0], // só a data
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

    // 2️⃣ Determina o horizonte: 31/12 do ano corrente às 23:59:59
    const anoAtual = new Date().getFullYear();
    const dataFim = new Date(anoAtual, 11, 31, 23, 59, 59); // mês 11 = Dezembro

    // 3️⃣ Executa o motor matemático da skill @calcular-proximos-plantoes
    const slots = gerarPlantoesAte(new Date(data_inicio), regra, dataFim);

    if (slots.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum plantão gerado. Verifique se a data de início está antes de 31/12/' + anoAtual },
        { status: 400 }
      );
    }

    // 4️⃣ Monta o array para bulk insert
    const plantoes = slots.map((s) => ({
      escala_id: escala.id,
      usuario_id,
      local_id,
      data_hora_inicio: s.inicio.toISOString(),
      data_hora_fim: s.fim.toISOString(),
      status: 'Agendado',
    }));

    // 5️⃣ Bulk insert na tabela plantoes
    const { error: erroInsert } = await supabaseAdmin
      .from('plantoes')
      .insert(plantoes);

    if (erroInsert) {
      // Rollback manual: remove a escala criada antes de retornar erro
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
    });
  } catch (err) {
    console.error('Erro interno em /api/escalas:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
