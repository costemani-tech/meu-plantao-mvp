export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY?.trim());
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'furiazul@gmail.com';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Ler motivo do downgrade se houver
    let motivo = '';
    try {
      const body = await req.json();
      motivo = body?.motivo || '';
    } catch {
      // Ignora erro se corpo estiver vazio
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, end_date, auto_renew')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Se já estiver cancelado, apenas retorna sucesso
    if (profile.status === 'canceled') {
      return NextResponse.json({ success: true, message: 'Já cancelado', end_date: profile.end_date });
    }

    // Atualiza o banco de dados:
    // status = canceled, auto_renew = false
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'canceled',
        auto_renew: false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[API Cancelamento] Erro ao atualizar Supabase:', updateError);
      return NextResponse.json({ error: 'Erro ao cancelar assinatura no banco' }, { status: 500 });
    }

    // Enviar e-mail de notificação de cancelamento para o administrador via Resend
    const userEmail = user.email || 'desconhecido';
    try {
      console.log('[API Cancelamento] Enviando e-mail de downgrade para:', ADMIN_EMAIL, '| userEmail:', userEmail);
      await resend.emails.send({
        from: 'Meu Plantão <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        replyTo: userEmail,
        subject: `💔 [Cancelamento] Usuário voltou para o plano Free — Meu Plantão`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #050816; color: #F8FAFC; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #fff;">
                💔 Cancelamento de Plano PRO
              </h1>
            </div>
            <div style="padding: 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1; line-height: 1.6;">
                O usuário <strong>${userEmail}</strong> acabou de realizar o downgrade de sua assinatura PRO de volta para o plano gratuito.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; color: #94A3B8; font-size: 13px; width: 120px; vertical-align: top;">Data final do acesso</td>
                  <td style="padding: 10px 0; color: #F8FAFC; font-size: 14px; font-weight: 700;">
                    ${profile.end_date ? new Date(profile.end_date).toLocaleDateString('pt-BR') : 'Imediato'}
                  </td>
                </tr>
              </table>
              <div style="background: #081224; border: 1px solid rgba(239,68,68,0.15); border-radius: 12px; padding: 18px 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Feedback de Cancelamento</p>
                <p style="margin: 0; font-size: 14px; color: #CBD5E1; line-height: 1.7; white-space: pre-wrap;">${motivo ? motivo.trim() : 'Nenhum motivo foi informado pelo usuário.'}</p>
              </div>
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #475569; text-align: center;">
              Meu Plantão — Notificação de Faturamento
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[API Cancelamento] Falha ao disparar e-mail via Resend:', emailErr);
    }

    return NextResponse.json({ success: true, end_date: profile.end_date });

  } catch (error: any) {
    console.error('[API Cancelamento] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
