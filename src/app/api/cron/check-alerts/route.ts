import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isUserPro } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Validação de segurança flexível (Header ou Query Parameter)
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: 'Internal Server Error: CRON_SECRET is not configured' }, { status: 500 });
  }

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` ||
    secretParam === expectedSecret;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  // Use Service Role Key — never exposed to the client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY!;

  const now = new Date();
  const windowStart = now.toISOString();
  // Busca plantões nas próximas 48 horas para cobrir qualquer antecedência configurada
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // 1. Fetch upcoming shifts where alert_sent is false/null
  const { data: plantoes, error } = await supabase
    .from('plantoes')
    .select('id, usuario_id, escala_id, data_hora_inicio, local:locais_trabalho(nome), escala:escalas(alerta_antecedencia_horas)')
    .gte('data_hora_inicio', windowStart)
    .lte('data_hora_inicio', windowEnd)
    .neq('status', 'Cancelado')
    .or('alert_sent.is.null,alert_sent.eq.false');

  if (error) {
    console.error('[cron/check-alerts] Supabase query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!plantoes || plantoes.length === 0) {
    return NextResponse.json({ message: 'No upcoming shifts to alert.', count: 0 });
  }

  let successCount = 0;
  const errors: string[] = [];

  for (const plantao of plantoes) {
    const antecedenciaHoras = (plantao.escala as any)?.alerta_antecedencia_horas ?? 2;
    const timeToAlert = new Date(plantao.data_hora_inicio).getTime() - (antecedenciaHoras * 60 * 60 * 1000);

    // Se o momento de disparar o alerta ainda não chegou (está no futuro), ignora neste ciclo
    if (timeToAlert > now.getTime()) {
      continue;
    }

    const localNome = (plantao.local as any)?.nome ?? 'seu local';
    const horaEntrada = new Date(plantao.data_hora_inicio).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    try {
      // 2. Send push notification via OneSignal
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [plantao.usuario_id] },
        target_channel: 'push',
        headings: { 'pt': 'Meu Plantão', 'en': 'Meu Plantão' },
        contents: {
          'pt': `🔔 O seu plantão em ${localNome} começa às ${horaEntrada}!`,
          'en': `🔔 O seu plantão em ${localNome} começa às ${horaEntrada}!`,
        },
        small_icon: 'ic_stat_onesignal_default',
        android_channel_id: 'shift-alerts',
      };

      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        errors.push(`plantao ${plantao.id}: OneSignal ${res.status} – ${body}`);
        continue;
      }

      // 3. Mark alert as sent to prevent duplicates and save in DB in real-time
      const { error: updateError } = await supabase
        .from('plantoes')
        .update({ alert_sent: true })
        .eq('id', plantao.id);

      if (updateError) {
        errors.push(`plantao ${plantao.id}: DB update failed – ${updateError.message}`);
      } else {
        // Insert notification record in DB in real-time
        const { error: notiError } = await supabase
          .from('notificacoes')
          .insert({
            usuario_id: plantao.usuario_id,
            escala_id: plantao.escala_id,
            data_hora_inicio: plantao.data_hora_inicio,
            publicar_em: now.toISOString(),
            titulo: `🏥 Plantão em ${antecedenciaHoras}h — ${localNome}`,
            mensagem: `Você tem plantão em ${localNome} às ${horaEntrada}. Bom trabalho!`,
            lida: false
          });

        if (notiError) {
          console.error(`[cron/check-alerts] Failed to insert notification in DB for plantao ${plantao.id}:`, notiError);
        }
        successCount++;
      }
    } catch (err: any) {
      errors.push(`plantao ${plantao.id}: ${err.message}`);
    }
  }

  console.log(`[cron/check-alerts] Processed ${plantoes.length} shifts. Sent: ${successCount}. Errors: ${errors.length}`);

  // 4. Verification of plan expirations in the next 7 days (once a day per user)
  try {
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch profiles where subscription is PRO and end_date is in the next 7 days
    const { data: expiringProfiles } = await supabase
      .from('profiles')
      .select('id, email, plan_type, end_date')
      .eq('plan_type', 'PRO')
      .gte('end_date', now.toISOString())
      .lte('end_date', sevenDaysFromNow);

    if (expiringProfiles && expiringProfiles.length > 0) {
      for (const profile of expiringProfiles) {
        // Skip whitelisted users who do not expire
        if (isUserPro(profile.email)) continue;

        // Check if we already sent a notification in the last 20 hours
        const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
        const { data: existingNoti } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('usuario_id', profile.id)
          .eq('titulo', 'Assinatura PRO expira em breve')
          .gte('created_at', twentyHoursAgo)
          .limit(1);

        if (!existingNoti || existingNoti.length === 0) {
          const diffTime = new Date(profile.end_date).getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (daysLeft >= 0 && daysLeft <= 7) {
            const msgPt = daysLeft === 1
              ? 'Sua assinatura PRO expira amanhã! Renove agora para não perder o acesso às suas escalas.'
              : `Sua assinatura PRO expira em ${daysLeft} dias. Renove agora para não perder o acesso às suas escalas.`;

            // Insert dynamic 24h notification
            await supabase
              .from('notificacoes')
              .insert({
                usuario_id: profile.id,
                titulo: 'Assinatura PRO expira em breve',
                mensagem: msgPt,
                publicar_em: now.toISOString(),
                lida: false
              });

            // Try sending push via OneSignal as well
            if (ONESIGNAL_APP_ID && ONESIGNAL_REST_KEY) {
              try {
                await fetch('https://onesignal.com/api/v1/notifications', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
                  },
                  body: JSON.stringify({
                    app_id: ONESIGNAL_APP_ID,
                    include_aliases: { external_id: [profile.id] },
                    target_channel: 'push',
                    headings: { 'pt': 'Renovação do Plano PRO' },
                    contents: { 'pt': msgPt },
                    small_icon: 'ic_stat_onesignal_default',
                    android_channel_id: 'plan-alerts',
                  }),
                });
              } catch (pushErr) {
                console.error(`[cron/check-alerts] Failed to send push for plan expiration to user ${profile.id}:`, pushErr);
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[cron/check-alerts] Error checking plan expirations:', err);
  }

  return NextResponse.json({
    processed: plantoes.length,
    sent: successCount,
    errors,
  });
}
