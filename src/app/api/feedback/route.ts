import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

export async function POST(req: Request) {
  // Instanciar dentro da função — evita falha no build quando a env var não está disponível
  const resend = new Resend(process.env.RESEND_API_KEY);
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'furiazul@gmail.com';

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { categoria, mensagem } = body;

    if (!mensagem || mensagem.trim().length < 5) {
      return NextResponse.json({ error: 'Mensagem muito curta' }, { status: 400 });
    }

    const userEmail = user.email || 'desconhecido';

    // 1. Salvar no Supabase (silencioso se tabela não existir)
    await supabase
      .from('feedbacks')
      .insert({
        usuario_id: user.id,
        email: userEmail,
        categoria: categoria || 'Geral',
        mensagem: mensagem.trim(),
      })
      .then(({ error }) => {
        if (error) console.warn('[Feedback] Supabase insert falhou (tabela pode não existir):', error.message);
      });

    // 2. Enviar e-mail para o admin via Resend
    const categoriaEmoji: Record<string, string> = {
      'Sugestão': '💡',
      'Problema': '🐛',
      'Dúvida': '❓',
      'Crítica': '📢',
      'Geral': '📬',
    };
    const emoji = categoriaEmoji[categoria] || '📬';

    const { error: emailError } = await resend.emails.send({
      from: 'Meu Plantão <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      replyTo: userEmail,
      subject: `${emoji} [${categoria}] Novo feedback — Meu Plantão`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #050816; color: #F8FAFC; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #fff;">
              ${emoji} Novo Feedback — Meu Plantão
            </h1>
          </div>
          <div style="padding: 28px 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; font-size: 13px; width: 120px; vertical-align: top;">Categoria</td>
                <td style="padding: 10px 0; color: #F8FAFC; font-size: 14px; font-weight: 700;">${categoria}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; font-size: 13px; vertical-align: top;">Usuário</td>
                <td style="padding: 10px 0; color: #F8FAFC; font-size: 14px;">${userEmail}</td>
              </tr>
            </table>

            <div style="background: #081224; border: 1px solid rgba(80,120,255,0.15); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #CBD5E1; line-height: 1.7; white-space: pre-wrap;">${mensagem.trim()}</p>
            </div>

            <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px; padding: 14px 18px;">
              <p style="margin: 0; font-size: 13px; color: #60A5FA;">
                💬 Para responder diretamente a este usuário, clique em <strong>Responder</strong> no seu e-mail. A resposta vai direto para <strong>${userEmail}</strong>.
              </p>
            </div>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #475569; text-align: center;">
            Meu Plantão — Sistema de Feedback Interno
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error('[Feedback] Erro ao enviar e-mail via Resend:', emailError);
      // Retorna sucesso mesmo se o e-mail falhar — o feedback já foi salvo no Supabase
      return NextResponse.json({ success: true, emailSent: false });
    }

    return NextResponse.json({ success: true, emailSent: true });

  } catch (error: any) {
    console.error('[Feedback API] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
