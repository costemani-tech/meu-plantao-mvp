import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (token !== adminSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }

  // Como é uma API admin, idealmente usaria SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceKey
  );

  const { error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('email', email.toLowerCase());

  if (error) {
    return NextResponse.json({ error: 'Erro interno ao atualizar usuário' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO.` });
}
