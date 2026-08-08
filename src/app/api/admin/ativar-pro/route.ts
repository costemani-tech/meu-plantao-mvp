import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    const authHeader = request.headers.get('authorization');

    const isAuthorized = authHeader === `Bearer ${expectedSecret}`;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Usar service role key se disponível para ignorar RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseServiceKey
    );

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 meses de acesso admin padrão

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_pro: true, // Retrocompatibilidade
        pro_expires_at: expiresAt.toISOString(), // Retrocompatibilidade
        plan_type: 'PRO',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: expiresAt.toISOString(),
        auto_renew: false
      })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('[Admin Ativar Pro] Erro ao atualizar usuário:', error.message);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO até ${expiresAt.toLocaleDateString('pt-BR')}.` });
  } catch (err: any) {
    console.error('[Admin Ativar Pro] Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
