import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { notifications } = await request.json();

    if (!notifications || !Array.isArray(notifications)) {
      return NextResponse.json({ success: false, error: 'A lista de notificações é obrigatória' }, { status: 400 });
    }

    const restKey = process.env.ONESIGNAL_REST_KEY || 'SUA_REST_API_KEY';
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'SUA_APP_ID';
    
    const pushHeader = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Key ${restKey}`
    };

    const promises = notifications.map(async (notif: any) => {
      // Garante app_id e utiliza obrigatoriamente a sintaxe v2 (include_aliases)
      const payload: Record<string, unknown> = { 
        app_id: appId, 
        target_channel: 'push',
        ...notif 
      };

      // Força o mapeamento para include_aliases se ainda estiver usando o modo antigo
      if (payload.include_external_user_ids) {
        payload.include_aliases = { external_id: payload.include_external_user_ids };
        delete payload.include_external_user_ids;
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: pushHeader,
        body: JSON.stringify(payload)
      });
      return response.json();
    });

    const results = await Promise.all(promises);

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na rota de envio OneSignal:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
