import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_TOKEN = 'ADMIN_SECRET_2026';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Usuário ${email} agora é PRO.` });
}
