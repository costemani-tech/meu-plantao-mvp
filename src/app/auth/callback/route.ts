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
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      return new Response(`ERRO GRAVE DO SUPABASE Y: O código de autorização foi enviado, mas o Supabase rejeitou a troca por Cookie. Motivo detalhado: ${error.message}`, { status: 400 });
    }
  }

  return new Response(`ERRO GRAVE DO SUPABASE X: O redirecionamento voltou para o Callback, mas a URL não possui a variável mágica ?code=. URL Real que chegou: ${request.url}`, { status: 400 });
}
