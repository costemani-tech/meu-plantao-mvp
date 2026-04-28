import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import { 
  DashboardInteractive,
  ShareAgendaButton,
  EarningsPrivacyWrapper,
  UpcomingShiftsClient 
} from './DashboardInteractive';
import { isUserPro } from '../lib/supabase';
import { formatRelativeShiftDate } from '../lib/date-utils';

// Utilitário para pegar o cliente Supabase Server-Side
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}

// Lógica de Saudação Premium e Inclusiva
function formatGreeting(fullName: string | null | undefined) {
  if (!fullName || fullName.trim() === '') {
    return { isFallback: true, text: "Olá, bem-vindo(a) ao Meu Plantão!" };
  }
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { isFallback: false, text: `Olá, ${parts[0]}!` };
  }
  
  // Primeiro + Último Nome
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return { isFallback: false, text: `Olá, ${firstName} ${lastName}!` };
}

// Sub-componente: Resumo de Ganhos e Plantões
async function StatsSection({ userId, isPro }: { userId: string, isPro: boolean }) {
  const supabase = await getSupabase();
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Executar requests em paralelo
  const [
    { count: totalMes },
    { data: plantoesComValor },
    { count: locaisAtivos }
  ] = await Promise.all([
    supabase.from('plantoes').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).gte('data_hora_inicio', inicioMes).lte('data_hora_inicio', fimMes).neq('status', 'Cancelado'),
    supabase.from('plantoes').select('notas').eq('usuario_id', userId).neq('status', 'Cancelado').gte('data_hora_inicio', inicioMes).lte('data_hora_inicio', fimMes),
    supabase.from('locais_trabalho').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).eq('ativo', true)
  ]);

  const { data: profile } = await supabase.from('profiles').select('nome').eq('id', userId).single();
  const greeting = formatGreeting(profile?.nome);

  if (locaisAtivos === 0) {
    return (
    <>
      <div className="page-header">
        <h1>{greeting.text}</h1>
        <p>Acompanhe sua escala e ganhos para o mês de {new Date().toLocaleDateString("pt-BR", { month: "long" })}.</p>
      </div>
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
        padding: '80px 24px', minHeight: '80vh', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 24, animation: 'cardEntrance 0.8s ease' }}>👋</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Seja bem-vindo!
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
          Sua agenda está pronta para ser organizada. Comece cadastrando onde você trabalha.
        </p>
        <Link href="/locais" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 16, background: 'var(--accent-blue)' }}>
            ➕ Adicionar Primeiro Local
          </button>
        </Link>
      </div>
    </>
    );
  }

  let totalGanhos = 0;
  if (plantoesComValor) {
    totalGanhos = plantoesComValor.reduce((acc, p) => {
      if (!p.notas) return acc;
      const match = p.notas.match(/R\$\s*([\d.,]+)/);
      if (match) {
        let valStr = match[1];
        if (valStr.includes(',')) {
          valStr = valStr.replace(/\./g, '').replace(',', '.');
        } else if (valStr.includes('.') && valStr.split('.').pop()?.length === 2) {
          // OK
        } else {
          valStr = valStr.replace(/\./g, '');
        }
        return acc + parseFloat(valStr || '0');
      }
      return acc;
    }, 0);
  }

  return (
    <>
      <div className="page-header">
        <h1>{greeting.text}</h1>
        <p>Acompanhe sua escala e ganhos para o mês de {new Date().toLocaleDateString("pt-BR", { month: "long" })}.</p>
      </div>
      <div className="card" style={{ marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, var(--accent-blue-light) 0%, transparent 70%)', opacity: 0.5, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            <TrendingUp size={14} color="var(--accent-blue)" />
            Resumo do Mês
          </div>
          
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{totalMes || 0} <span style={{ fontSize: 18, color: "var(--text-secondary)", fontWeight: 600 }}>plantões este mês</span></div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 36, marginBottom: 20 }}>
            <EarningsPrivacyWrapper total={totalGanhos} isPro={isPro} />
          </div>

          <Link href="/locais" style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              borderTop: '1px solid var(--border-subtle)', paddingTop: 20,
              cursor: 'pointer', transition: 'opacity 0.2s'
            }} className="hover-opacity">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                <span style={{ fontSize: 16 }}><Plus size={16} color="var(--accent-blue)" /></span>
                {locaisAtivos || 0} locais ativos
              </div>
              <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

// Sub-componente: Próximos Plantões
async function UpcomingShiftsWrapper({ userId, userName, totalGanhos, isPro }: { userId: string, userName: string, totalGanhos: number, isPro: boolean }) {
  const supabase = await getSupabase();

  const { data: proximos } = await supabase
    .from('plantoes')
    .select('id, data_hora_inicio, data_hora_fim, local:locais_trabalho(nome, cor_calendario)')
    .eq('usuario_id', userId)
    .gte('data_hora_inicio', new Date().toISOString())
    .neq('status', 'Cancelado')
    .order('data_hora_inicio', { ascending: true })
    .limit(5);

  return (
    <UpcomingShiftsClient 
      proximos={proximos || []} 
      isPro={isPro} 
      userName={userName} 
      totalGanhos={totalGanhos} 
    />
  );
}

// Skeletons
function StatsSkeleton() {
  return (
    <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', marginBottom: 32 }}>
      <div className="skeleton" style={{ height: 40, width: '80%', borderRadius: 8, marginBottom: 20 }} />
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 20 }}>
        <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8 }} />
      </div>
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
        <div className="skeleton" style={{ height: 24, width: '50%', borderRadius: 8 }} />
      </div>
    </div>
  );
}

function ShiftsSkeleton() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Próximos Plantões
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 72, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 72, borderRadius: 16 }} />
      </div>
    </div>
  );
}

// Componente Principal
export default async function DashboardPage() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, nome')
    .eq('id', user.id)
    .single();

  const fullName = profile?.nome || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const greeting = formatGreeting(fullName);
  const userName = greeting.isFallback ? 'Usuário' : greeting.text.replace('Olá, ', '').replace('!', '');

  const isPro = isUserPro(user.email) || (profile?.is_pro === true);

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
  const { data: plantoesComValor } = await supabase
    .from('plantoes')
    .select('notas')
    .eq('usuario_id', user.id)
    .neq('status', 'Cancelado')
    .gte('data_hora_inicio', inicioMes)
    .lte('data_hora_inicio', fimMes);

  let totalGanhosGlobal = 0;
  if (plantoesComValor) {
    totalGanhosGlobal = plantoesComValor.reduce((acc, p) => {
      if (!p.notas) return acc;
      const match = p.notas.match(/R\$\s*([\d.,]+)/);
      if (match) {
        let valStr = match[1];
        if (valStr.includes(',')) {
          valStr = valStr.replace(/\./g, '').replace(',', '.');
        } else if (valStr.includes('.') && valStr.split('.').pop()?.length === 2) {
          // OK
        } else {
          valStr = valStr.replace(/\./g, '');
        }
        return acc + parseFloat(valStr || '0');
      }
      return acc;
    }, 0);
  }

  const { count: locaisCount } = await supabase
    .from('locais_trabalho')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('ativo', true);

  const hasLocations = (locaisCount || 0) > 0;

  return (
    <div style={{ padding: "16px 16px 120px 16px", maxWidth: "600px", margin: "0 auto" }}>
      
      {/* HEADER (Carrega Instantaneamente) */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Meu Plantão
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Organize seus plantões. Tenha tudo sob controle.
        </p>
      </div>

      {/* CARD PRINCIPAL (Assíncrono) */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection userId={user.id} isPro={isPro} />
      </Suspense>

      {/* PRÓXIMOS PLANTÕES (Assíncrono) */}
      <Suspense fallback={<ShiftsSkeleton />}>
        <UpcomingShiftsWrapper
          userId={user.id}
          userName={userName}
          totalGanhos={totalGanhosGlobal}
          isPro={isPro}
        />
      </Suspense>

      {/* INTERATIVIDADE DO CLIENTE (FAB + Paywall) */}
      <DashboardInteractive isPro={isPro} hasLocations={hasLocations} />
    </div>
  );
}
