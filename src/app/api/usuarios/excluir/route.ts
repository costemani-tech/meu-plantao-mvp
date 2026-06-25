import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          }
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Chave administrativa do Supabase não configurada' }, { status: 500 });
    }

    // Instancia o cliente admin (ignora RLS para exclusão administrativa)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Excluir registros nas tabelas vinculadas (Garantindo limpeza completa para conformidade LGPD)
    
    // Apaga feedbacks
    await supabaseAdmin.from('feedbacks').delete().eq('usuario_id', user.id);

    // Apaga notificações
    await supabaseAdmin.from('notificacoes').delete().eq('usuario_id', user.id);

    // Apaga trocas de plantões
    // Deleta trocas onde o plantão original pertencia ao usuário ou onde ele era o novo participante
    const { data: plantoesUsuario } = await supabaseAdmin
      .from('plantoes')
      .select('id')
      .eq('usuario_id', user.id);

    if (plantoesUsuario && plantoesUsuario.length > 0) {
      const plantaoIds = plantoesUsuario.map(p => p.id);
      await supabaseAdmin.from('trocas_plantao').delete().in('plantao_original_id', plantaoIds);
    }
    await supabaseAdmin.from('trocas_plantao').delete().eq('novo_usuario_id', user.id);

    // Apaga plantões
    await supabaseAdmin.from('plantoes').delete().eq('usuario_id', user.id);

    // Apaga escalas
    await supabaseAdmin.from('escalas').delete().eq('usuario_id', user.id);

    // Apaga locais de trabalho
    await supabaseAdmin.from('locais_trabalho').delete().eq('usuario_id', user.id);

    // Apaga registros de perfis
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // 2. Excluir credenciais de login no Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('[API Excluir Usuário] Erro ao excluir do Supabase Auth:', deleteAuthError.message);
      return NextResponse.json({ error: 'Erro ao excluir credenciais do usuário' }, { status: 500 });
    }

    // 3. Responder com sucesso e limpar cookies locais
    const response = NextResponse.json({ success: true, message: 'Sua conta foi excluída com sucesso.' });
    
    // Remove todos os cookies relacionados ao Supabase para invalidar a sessão no cliente
    const responseCookies = response.cookies;
    cookieStore.getAll().forEach(c => {
      responseCookies.delete(c.name);
    });

    return response;

  } catch (error: any) {
    console.error('[API Excluir Usuário] Erro interno:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
