import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ADMIN_TOKEN = process.env.ADMIN_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!ADMIN_TOKEN) {
    console.error('CRITICAL: ADMIN_SECRET is not set in environment variables.');
    return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
  }

  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  // Usar service role key se disponível para ignorar RLS, ou a anon key se configurado corretamente
  // Como é uma API admin, idealmente usaria SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('email', email.toLowerCase());

  if (error) {
    console.error('Erro ao ativar PRO:', error);
    return NextResponse.json({ error: 'Erro interno ao ativar PRO' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO.` });
}
