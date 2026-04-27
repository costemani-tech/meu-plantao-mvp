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
function gerarPlantoesAte(
  dataInicio: Date,
  regra: Regra,
  dataFim: Date,
  tipoJornada: string = 'Plantonista',
  horaFim: string = '18:00'
): PlantaoSlot[] {
  const slots: PlantaoSlot[] = [];
  const cursor = new Date(dataInicio);

  if (tipoJornada === 'Plantonista') {
    const parts = regra.split('x');
    const trabalho = parseInt(parts[0], 10) || 12;
    const descanso = parseInt(parts[1], 10) || 36;
    const ciclo = trabalho + descanso;

    while (cursor < dataFim) {
      const inicio = new Date(cursor);
      const fim = new Date(cursor);
      fim.setHours(fim.getHours() + trabalho);
      if (inicio < dataFim) slots.push({ inicio, fim });
      cursor.setHours(cursor.getHours() + ciclo);
    }
  } else if (tipoJornada === 'Diarista-Corridos') {
    const parts = regra.split('x');
    const dTrabalho = parseInt(parts[0], 10) || 5;
    const dDescanso = parseInt(parts[1], 10) || 2;
    const cicloDias = dTrabalho + dDescanso;
    const [hFim, mFim] = horaFim.split(':').map(Number);
    let idx = 0;

    while (cursor < dataFim) {
      if (idx < dTrabalho) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setHours(hFim, mFim, 0, 0);
        if (fim <= inicio) fim.setDate(fim.getDate() + 1);
        if (inicio < dataFim) slots.push({ inicio, fim });
      }
      cursor.setDate(cursor.getDate() + 1);
      idx = (idx + 1) % cicloDias;
    }
  } else if (tipoJornada === 'Diarista-Semanal') {
    const diasPermitidos = regra.split(',').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);

    while (cursor < dataFim) {
      if (diasPermitidos.includes(cursor.getDay())) {
        const inicio = new Date(cursor);
        const fim = new Date(cursor);
        fim.setHours(hFim, mFim, 0, 0);
        if (fim <= inicio) fim.setDate(fim.getDate() + 1);
        if (inicio < dataFim) slots.push({ inicio, fim });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
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
    let body: { 
      data_inicio?: string; 
      regra?: string; 
      local_id?: string; 
      forcar_conflito?: boolean;
      tipo_jornada?: string;
      hora_fim?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: true, message: 'Não foi possível gerar a escala no momento. Tente novamente.' },
        { status: 400 }
      );
    }

    const { data_inicio, regra, local_id, forcar_conflito, tipo_jornada, hora_fim } = body;

    if (!data_inicio || !regra || !local_id) {
      return NextResponse.json(
        { error: true, message: 'Preencha todos os campos obrigatórios para gerar a escala.' },
        { status: 400 }
      );
    }

    // Validação flexível: pode ser XxY ou X,Y,Z (dias da semana)
    if (!/^\d+x\d+$/.test(regra) && !/^(\d+,)*\d+$/.test(regra)) {
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
    const { data_fim: dataFimCorpo } = body;
    const anoAtual = new Date().getFullYear();
    const dataFim = dataFimCorpo ? new Date(dataFimCorpo) : new Date(anoAtual, 11, 31, 23, 59, 59);
    const slots = gerarPlantoesAte(new Date(data_inicio), regra as Regra, dataFim, tipo_jornada, hora_fim);

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

    // ── 9. Notificações (Opcional) ───────────────────────────────────────────
    const { antecedencia } = body;
    if (antecedencia && Number(antecedencia) > 0) {
      try {
        const { data: local } = await supabaseAdmin
          .from('locais_trabalho')
          .select('nome')
          .eq('id', local_id)
          .single();
          
        const nomeLocal = local?.nome || 'seu local de trabalho';
        const offsetMs = Number(antecedencia) * 60 * 60 * 1000;
        
        const pushNotifications = [];
        const dbNotificacoes = [];
        const now = new Date();

        for (const s of slots) {
          const publicarEm = new Date(s.inicio.getTime() - offsetMs);
          
          if (publicarEm > now) {
            const horaStr = s.inicio.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo' // Força fuso horário brasileiro para a mensagem
            });

            pushNotifications.push({
              app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
              include_aliases: { external_id: [usuario_id] },
              target_channel: 'push',
              collapse_id: `shift_${escala.id}_${s.inicio.toISOString()}`,
              headings: { "pt": `🩺 Plantão hoje às ${horaStr}` },
              contents: { "pt": `${nomeLocal}\nPrepare-se com antecedência. Bom plantão!` },
              send_after: publicarEm.toISOString()
            });

            dbNotificacoes.push({
              usuario_id,
              escala_id: escala.id,
              data_hora_inicio: s.inicio.toISOString(),
              publicar_em: publicarEm.toISOString(), // Requer que a coluna exista
              titulo: `🏥 Plantão em ${antecedencia}h — ${nomeLocal}`,
              mensagem: `Você tem plantão em ${nomeLocal} às ${horaStr}. Bom trabalho!`,
              lida: false
            });
          }
        }

        if (pushNotifications.length > 0) {
          // Envia em lotes para o OneSignal
          const restKey = process.env.ONESIGNAL_REST_KEY;
          const pushPromises = pushNotifications.map(payload => 
            fetch('https://onesignal.com/api/v1/notifications', {
              method: 'POST',
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Key ${restKey}`
              },
              body: JSON.stringify(payload)
            }).then(r => r.json())
          );
          await Promise.all(pushPromises);
        }

        if (dbNotificacoes.length > 0) {
          await supabaseAdmin.from('notificacoes').upsert(dbNotificacoes, {
            onConflict: 'usuario_id,escala_id,data_hora_inicio'
          });
        }
      } catch (err) {
        console.error('[API Escala POST] Erro ao agendar notificações:', err);
      }
    }

    // ── 10. Resposta de sucesso ──────────────────────────────────────────────
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
