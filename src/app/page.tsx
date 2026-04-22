import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  ChevronRight,
} from 'lucide-react';
import { DashboardInteractive, DesbloquearGanhosBtn } from './DashboardInteractive';
import { isUserPro } from '../lib/supabase';

// Utilitário para pegar o cliente Supabase Server-Side
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}

// Sub-componente: Resumo de Ganhos e Plantões
async function StatsSection({ userId, isPro }: { userId: string, isPro: boolean }) {
  const supabase = await getSupabase();
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Executar requests em paralelo (Promise.all) para zero payload / máximo desempenho
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
    );
  }

  let totalGanhos = 0;
  if (plantoesComValor) {
    totalGanhos = plantoesComValor.reduce((acc, p) => {
      let valor = 0;
      if (p.notas) {
        const match = p.notas.match(/R\$\s*([\d.]+)/);
        if (match && match[1]) {
          valor = parseFloat(match[1]);
        }
      }
      return acc + valor;
    }, 0);
  }

  return (
    <div className="card" style={{ 
      padding: '24px', borderRadius: '24px', background: 'var(--bg-secondary)', 
      border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)',
      marginBottom: 32, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, var(--accent-blue-light) 0%, transparent 70%)', opacity: 0.5, zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          <TrendingUp size={14} color="var(--accent-blue)" />
          Resumo do Mês
        </div>
        
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
          📅 {totalMes || 0} <span style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 600 }}>plantões este mês</span>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 20 }}>
          {isPro ? (
            <Link href="/relatorio" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Extras do mês</div>
                {totalGanhos > 0 ? (
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    💰 {totalGanhos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para receber extra
                    <ChevronRight size={18} />
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      💰 Nenhum extra registrado
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Adicione plantões extras para acompanhar seus ganhos.
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                💰 Ver meus ganhos reais
              </div>
              <DesbloquearGanhosBtn />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
          <Link href="/locais" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <span style={{ fontSize: 16 }}>🏥</span>
              {locaisAtivos || 0} locais ativos
            </div>
          </Link>
          <Link href="/locais" style={{ textDecoration: 'none' }}>
            <button style={{ 
              background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', 
              border: 'none', padding: '8px 16px', borderRadius: '10px', 
              fontSize: 13, fontWeight: 700, cursor: 'pointer' 
            }}>
              [ Gerenciar locais ]
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Sub-componente: Próximos Plantões
async function UpcomingShifts({ userId }: { userId: string }) {
  const supabase = await getSupabase();
  const hoje = new Date().toISOString();

  const { data: proximos } = await supabase
    .from('plantoes')
    .select('id, data_hora_inicio, local:locais_trabalho(nome, cor_calendario)')
    .eq('usuario_id', userId)
    .gte('data_hora_inicio', hoje)
    .neq('status', 'Cancelado')
    .order('data_hora_inicio', { ascending: true })
    .limit(2);

  const plantoesMaisProximos = (proximos || []) as any[];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Próximos Plantões
        </h3>
        <Link href="/calendario" style={{ textDecoration: 'none' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Ver agenda completa
          </button>
        </Link>
      </div>

      {plantoesMaisProximos.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Nenhum plantão agendado. Aproveite o descanso ou adicione novos plantões.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plantoesMaisProximos.map(p => {
            const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
            return (
            <div key={p.id} className="shift-item" style={{ border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
              <div className="shift-color-bar" style={{ backgroundColor: localObj?.cor_calendario || 'var(--accent-blue)' }} />
              <div className="shift-info" style={{ padding: '16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {localObj?.nome || 'Local de Trabalho'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Calendar size={13} />
                  <span style={{ textTransform: 'capitalize' }}>
                    {(() => {
                      const data = new Date(p.data_hora_inicio);
                      const dtHoje = new Date();
                      const amanha = new Date();
                      amanha.setDate(dtHoje.getDate() + 1);
                      
                      const isMesmoDia = (d1: Date, d2: Date) => 
                        d1.getDate() === d2.getDate() && 
                        d1.getMonth() === d2.getMonth() && 
                        d1.getFullYear() === d2.getFullYear();

                      if (isMesmoDia(data, dtHoje)) return 'Hoje';
                      if (isMesmoDia(data, amanha)) return 'Amanhã';

                      return data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                    })()}
                  </span>
                  <Clock size={13} style={{ marginLeft: 6 }} />
                  {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
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
    <div style={{ marginBottom: 24 }}>
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
    .select('is_pro')
    .eq('id', user.id)
    .single();

  const isPro = isUserPro(user.email) || (profile?.is_pro === true);

  const { count: locaisCount } = await supabase
    .from('locais_trabalho')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('ativo', true);

  const hasLocations = (locaisCount || 0) > 0;

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER (Carrega Instantaneamente) */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Meu Plantão 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Controle total dos seus plantões
        </p>
      </div>

      {/* CARD PRINCIPAL (Assíncrono) */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection userId={user.id} isPro={isPro} />
      </Suspense>

      {/* PRÓXIMOS PLANTÕES (Assíncrono) */}
      <Suspense fallback={<ShiftsSkeleton />}>
        <UpcomingShifts userId={user.id} />
      </Suspense>

      {/* INTERATIVIDADE DO CLIENTE (FAB + Paywall) */}
      <DashboardInteractive isPro={isPro} hasLocations={hasLocations} />
    </div>
  );
}
