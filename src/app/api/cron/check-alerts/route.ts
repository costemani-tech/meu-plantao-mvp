import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron/check-alerts] CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // Vercel Cron security: validate the authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  // Use Service Role Key — never exposed to the client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Missing OneSignal credentials' }, { status: 500 });
  }

  const now = new Date();
  const windowStart = now.toISOString();
  // Fetch a wider window to accommodate custom alert times (e.g. up to 24h)
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // now + 24h

  // 1. Fetch upcoming shifts within the next 24 hours where alert_sent is false/null
  const { data: plantoes, error } = await supabase
    .from('plantoes')
    .select('id, usuario_id, data_hora_inicio, alerta_ativo, antecedencia_horas, local:locais_trabalho(nome)')
    .gte('data_hora_inicio', windowStart)
    .lte('data_hora_inicio', windowEnd)
    .neq('status', 'Cancelado')
    .or('alert_sent.is.null,alert_sent.eq.false');

  if (error) {
    console.error('[cron/check-alerts] Supabase query error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  if (!plantoes || plantoes.length === 0) {
    return NextResponse.json({ message: 'No upcoming shifts to alert.', count: 0 });
  }

  let successCount = 0;
  const errors: string[] = [];
  let processedCount = 0;

  for (const plantao of plantoes) {
    // In-memory filter for custom alert timings
    const isAlertaAtivo = plantao.alerta_ativo !== false; // defaults to true
    if (!isAlertaAtivo) continue;

    const antecedenciaHoras = typeof plantao.antecedencia_horas === 'number' ? plantao.antecedencia_horas : 2;
    const shiftStartTime = new Date(plantao.data_hora_inicio).getTime();
    const alertTriggerTime = shiftStartTime - (antecedenciaHoras * 60 * 60 * 1000);

    // Only alert if the current time is past the trigger time
    if (now.getTime() < alertTriggerTime) {
      continue;
    }

    processedCount++;

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
