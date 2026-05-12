import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel Cron security: validate the authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  // Use Service Role Key — never exposed to the client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'b6bb955e-2f5a-4ef8-a832-6ee160ca18b0';
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY!;

  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Fetch upcoming shifts that are active for alerts and haven't been sent yet.
  // We fetch a wide window (e.g. next 24h) and then filter in memory to allow variable `antecedencia_horas` logic.
  const maxWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: plantoes, error } = await supabase
    .from('plantoes')
    .select('id, usuario_id, data_hora_inicio, antecedencia_horas, alerta_ativo, local:locais_trabalho(nome)')
    .gte('data_hora_inicio', nowISO)
    .lte('data_hora_inicio', maxWindow)
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
    if (plantao.alerta_ativo === false) continue; // Skip if alerts are explicitly disabled for this shift

    const antecedenciaMs = (plantao.antecedencia_horas || 2) * 60 * 60 * 1000;
    const shiftStartTime = new Date(plantao.data_hora_inicio).getTime();

    // Check if it's time to send the alert (now is within or past the antecedencia threshold)
    if (now.getTime() < shiftStartTime - antecedenciaMs) {
      continue; // Not time yet
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

      // 3. Mark alert as sent to prevent duplicates
      const { error: updateError } = await supabase
        .from('plantoes')
        .update({ alert_sent: true })
        .eq('id', plantao.id);

      if (updateError) {
        errors.push(`plantao ${plantao.id}: DB update failed – ${updateError.message}`);
      } else {
        successCount++;
      }
    } catch (err: any) {
      errors.push(`plantao ${plantao.id}: ${err.message}`);
    }
  }

  console.log(`[cron/check-alerts] Processed ${plantoes.length} shifts. Sent: ${successCount}. Errors: ${errors.length}`);

  return NextResponse.json({
    processed: plantoes.length,
    sent: successCount,
    errors,
  });
}
