import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Configuração interna do servidor ausente.' }, { status: 500 });
  }

  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Configuração interna do servidor ausente.' }, { status: 500 });
  }

  // Usar service role key se disponível para ignorar RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceKey
  );

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('email', email.toLowerCase());

  if (error) {
    return NextResponse.json({ error: 'Ocorreu um erro ao atualizar o usuário.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO.` });
}
