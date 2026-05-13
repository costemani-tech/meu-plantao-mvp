import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { 
  DashboardInteractive,
  EarningsPrivacyWrapper,
  UpcomingShiftsClient 
} from '../DashboardInteractive';
import { isUserPro, isSubscriptionActive } from '../../lib/supabase';
import { HandMetal } from 'lucide-react';

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
  if (!fullName || fullName.trim() === '' || fullName.toLowerCase().includes('médico')) {
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
async function StatsSection({ userId, isPro, greeting }: { userId: string, isPro: boolean, greeting: { isFallback: boolean, text: string } }) {
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

  if (locaisAtivos === 0) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
        padding: '60px 24px', minHeight: '60vh', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 24, animation: 'cardEntrance 0.8s ease', color: '#2563EB' }}>
          <HandMetal size={64} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Seja bem-vindo!
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
          Sua agenda está pronta para ser organizada. Comece cadastrando onde você trabalha.
        </p>
        <Link href="/locais" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: '1.5rem', background: '#2563EB', boxShadow: '0 0 15px rgba(37, 99, 235, 0.25)' }}>
            <Plus size={20} className="mr-2" /> Adicionar Primeiro Local
          </button>
        </Link>
      </div>
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
    <div className="card-premium" style={{ marginBottom: 32, position: "relative", overflow: "hidden" }}>
      {/* Background abstract */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)', opacity: 0.8, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', opacity: 0.8, zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <TrendingUp size={16} />
            Resumo do Mês
          </div>
          <div style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-cyan)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} />
            Em alta
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
          <div className="kpi-number" style={{ fontSize: 64, lineHeight: 1, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.05em' }}>
            {totalMes || 0}
          </div>
          <div style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600 }}>plantões este mês</div>
        </div>

        {/* Barra de progresso visual */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', borderRadius: '2px' }} />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, marginBottom: 16 }}>
          <EarningsPrivacyWrapper total={totalGanhos} isPro={isPro} />
        </div>

        <Link href="/locais" style={{ textDecoration: 'none' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.03)',
            cursor: 'pointer', transition: 'all 0.2s'
          }} className="hover-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>
                <Plus size={16} color="var(--accent-blue)" />
              </div>
              {locaisAtivos || 0} locais ativos
            </div>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} />
            </div>
          </div>
        </Link>
      </div>
    </div>
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
    <div className="card" style={{ padding: '24px', borderRadius: '1.5rem', background: '#0F172A', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'var(--shadow-md)', marginBottom: 32 }}>
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
    .select('*')
    .eq('id', user.id)
    .single();

  const rawName = profile?.nome || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const fallbackFromEmail = user.email ? user.email.split('@')[0].split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : '';
  const fullName = rawName || fallbackFromEmail || 'Usuário';
  
  const greeting = formatGreeting(fullName);
  const userName = greeting.isFallback ? 'Doutor(a)' : greeting.text.replace('Olá, ', '').replace('!', '');

  const isPro = isUserPro(user.email) || isSubscriptionActive(profile);

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
    <div className="page-container" style={{ paddingBottom: '120px', position: 'relative' }}>
      
      {/* Background Premium Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* HEADER PREMIUM */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '40px',
        position: 'relative',
        zIndex: 1,
        paddingTop: '20px'
      }} className="mobile-col">
        <div>
          <h1 className="header-title" style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px', color: '#FFFFFF' }}>
            {greeting.text}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
            Visão geral da sua escala e ganhos de {new Date().toLocaleDateString("pt-BR", { month: "long" })}.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL (Assíncrono) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<StatsSkeleton />}>
        <StatsSection userId={user.id} isPro={isPro} greeting={greeting} />
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
    </div>
  );
}
