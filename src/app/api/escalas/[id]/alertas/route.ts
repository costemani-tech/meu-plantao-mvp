import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: escala_id } = await params;
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const alerta_ativo = body.alerta_ativo;
    const antecedencia_horas = body.antecedencia_horas;

    // Use admin client to bypass RLS for broad updates if needed, but safe here since we check ownership
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership
    const { data: escala, error: checkError } = await supabaseAdmin
      .from('escalas')
      .select('id')
      .eq('id', escala_id)
      .eq('usuario_id', user.id)
      .single();

    if (checkError || !escala) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the Escala
    const { error: escalaUpdateError } = await supabaseAdmin
      .from('escalas')
      .update({ alerta_ativo, antecedencia_horas })
      .eq('id', escala_id);

    if (escalaUpdateError) {
      return NextResponse.json({ error: 'Failed to update escala' }, { status: 500 });
    }

    // Update all related shifts that haven't happened yet
    // So the cron job picks them up correctly
    const nowISO = new Date().toISOString();
    const { error: plantoesUpdateError } = await supabaseAdmin
      .from('plantoes')
      .update({ alerta_ativo, antecedencia_horas })
      .eq('escala_id', escala_id)
      .gte('data_hora_inicio', nowISO);

    if (plantoesUpdateError) {
      return NextResponse.json({ error: 'Failed to update plantoes' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
