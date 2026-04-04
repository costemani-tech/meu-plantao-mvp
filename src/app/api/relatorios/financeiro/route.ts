import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/relatorios/financeiro?mes=3&ano=2026
// Retorna somatório financeiro de plantões extras do mês, agrupado por local.
// ─────────────────────────────────────────────────────────────────────────────

interface PlantaoExtra {
  id: string;
  valor_ganho: number | null;
  data_hora_inicio: string;
  data_hora_fim: string;
  local_id: string;
  local: {
    id: string;
    nome: string;
    cor_calendario: string;
  } | null;
}

interface LocalSummary {
  local_id: string;
  nome: string;
  cor_calendario: string;
  quantidade: number;
  total: number;
}

// Resposta de sucesso padronizada (mesmo para mês vazio)
interface FinanceiroResponse {
  mes: number;
  ano: number;
  total_geral: number;
  total_plantoes: number;
  por_local: LocalSummary[];
}

export async function GET(req: NextRequest) {
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

    // ── 2. Validação dos query params ────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const mesParam = searchParams.get('mes');
    const anoParam = searchParams.get('ano');

    const mes = mesParam ? parseInt(mesParam, 10) : null;
    const ano = anoParam ? parseInt(anoParam, 10) : null;

    if (
      mes === null || ano === null ||
      isNaN(mes) || isNaN(ano) ||
      mes < 1 || mes > 12 ||
      ano < 2020 || ano > 2100
    ) {
      return NextResponse.json(
        { error: true, message: 'Parâmetros inválidos. Informe mes (1-12) e ano válidos.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // ── 3. Janela temporal do mês (UTC-safe) ─────────────────────────────────
    // mes é 1-based (1=Janeiro), Date.UTC usa 0-based
    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0)).toISOString();
    const fimMes    = new Date(Date.UTC(ano, mes,     0, 23, 59, 59, 999)).toISOString();

    // ── 4. Cliente admin instanciado SOMENTE após auth confirmada ────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 5. Query — apenas extras do usuário, no mês solicitado ───────────────
    // Cruzamento com usuario_id previne IDOR mesmo com service key
    const { data, error: dbError } = await supabaseAdmin
      .from('plantoes')
      .select(`
        id,
        valor_ganho,
        data_hora_inicio,
        data_hora_fim,
        local_id,
        local:locais_trabalho(id, nome, cor_calendario)
      `)
      .eq('usuario_id', user.id)       // IDOR: vincula ao usuário logado
      .eq('is_extra', true)            // FILTRO EXCLUSIVO: apenas extras
      .neq('status', 'Cancelado')
      .gte('data_hora_inicio', inicioMes)
      .lte('data_hora_inicio', fimMes)
      .order('data_hora_inicio', { ascending: true });

    if (dbError) {
      console.error('[API Relatorio Financeiro] Erro interno:', dbError?.message || 'Falha na consulta');
      return NextResponse.json(
        { error: true, message: 'Não foi possível carregar o relatório no momento. Tente novamente.' },
        { status: 500 }
      );
    }

    // ── 6. Empty state: retorna zeros sem erro ───────────────────────────────
    if (!data || data.length === 0) {
      const resposta: FinanceiroResponse = {
        mes,
        ano,
        total_geral: 0,
        total_plantoes: 0,
        por_local: [],
      };
      return NextResponse.json(resposta);
    }

    // ── 7. Agrupamento por local e somatório ─────────────────────────────────
    const mapaLocais = new Map<string, LocalSummary>();

    for (const p of (data as unknown as PlantaoExtra[])) {
      const localId   = p.local_id;
      const nome      = p.local?.nome          ?? 'Local Desconhecido';
      const corCalend = p.local?.cor_calendario ?? '#4f8ef7';
      const valor     = typeof p.valor_ganho === 'number' ? p.valor_ganho : 0;

      if (mapaLocais.has(localId)) {
        const entry = mapaLocais.get(localId)!;
        entry.quantidade += 1;
        entry.total      += valor;
      } else {
        mapaLocais.set(localId, {
          local_id:      localId,
          nome,
          cor_calendario: corCalend,
          quantidade:    1,
          total:         valor,
        });
      }
    }

    const porLocal    = Array.from(mapaLocais.values());
    const totalGeral  = porLocal.reduce((acc, l) => acc + l.total, 0);
    const totalPlant  = porLocal.reduce((acc, l) => acc + l.quantidade, 0);

    const resposta: FinanceiroResponse = {
      mes,
      ano,
      total_geral:    Math.round(totalGeral   * 100) / 100,
      total_plantoes: totalPlant,
      por_local:      porLocal.map(l => ({
        ...l,
        total: Math.round(l.total * 100) / 100,
      })),
    };

    return NextResponse.json(resposta);

  } catch (err) {
    console.error('[API Relatorio Financeiro] Erro interno:', (err as Error)?.message || 'Falha na operação');
    return NextResponse.json(
      { error: true, message: 'Não foi possível carregar o relatório no momento. Tente novamente.' },
      { status: 500 }
    );
  }
}
