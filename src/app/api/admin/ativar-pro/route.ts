import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.ADMIN_SECRET;

    if (!expectedSecret) {
      console.error('[Admin] ADMIN_SECRET not configured');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Admin] Missing Supabase credentials');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.error('[Admin] Erro ao atualizar usuário para PRO:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO até ${expiresAt.toLocaleDateString('pt-BR')}.` });
  } catch (err: any) {
    console.error('[Admin] Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
