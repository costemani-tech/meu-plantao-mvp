import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use Service Role Key — never exposed to the client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY!;

export async function GET(request: NextRequest) {
  // Vercel Cron security: validate the authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = now.toISOString();
  const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // now + 2h

  // 1. Fetch upcoming shifts within the next 2 hours where alert_sent is false/null
  const { data: plantoes, error } = await supabase
    .from('plantoes')
    .select('id, usuario_id, data_hora_inicio, local:locais_trabalho(nome)')
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
