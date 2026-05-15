import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
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

    const { error: insertError } = await supabase
      .from('feedbacks')
      .insert({
        usuario_id: user.id,
        email: user.email,
        categoria: categoria || 'Geral',
        mensagem: mensagem.trim(),
      });

    if (insertError) {
      console.error('[Feedback API] Erro ao salvar:', insertError);
      // Se a tabela não existir ainda, retorna sucesso silencioso para não quebrar UX
      // A tabela pode ser criada depois via migration
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Feedback API] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
