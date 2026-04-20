import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
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
          },
        },
      }
    );
    
    // Troca o código gerado pelo provedor por uma sessão real em Cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Se deu certo, redireciona para a página desejada ou para o início
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // ERRO PKCE / VERIFIER: Isso acontece muito em PWAs quando o login começa num Browser e termina em outro
      // Tentamos redirecionar para a home para ver se o cookie de sessão "pegou" mesmo com erro de verifier
      // ou mostramos uma mensagem instrutiva.
      if (error.message.includes('code verifier')) {
        console.error("PKCE Error detected. Redirecting to home to check session...");
        return NextResponse.redirect(`${origin}/?auth_error=pkce_mismatch`);
      }
      return new Response(`ERRO DE AUTENTICAÇÃO: ${error.message}`, { status: 400 });
    }
  }

  // Fallback para quando não há código na URL
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
