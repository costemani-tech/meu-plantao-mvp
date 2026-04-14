import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { notifications } = await request.json();

    if (!notifications || !Array.isArray(notifications)) {
      return NextResponse.json({ success: false, error: 'A lista de notificações é obrigatória' }, { status: 400 });
    }

    const restKey = process.env.NEXT_PUBLIC_ONESIGNAL_REST_KEY || process.env.ONESIGNAL_REST_KEY || 'SUA_REST_API_KEY';
    
    const pushHeader = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${restKey}`
    };

    const promises = notifications.map(async (notif) => {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: pushHeader,
        body: JSON.stringify(notif)
      });
      return response.json();
    });

    const results = await Promise.all(promises);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Erro na rota de envio OneSignal:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
