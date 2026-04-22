'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  CalendarDays, 
  Activity, 
  Calendar, 
  Clock, 
  Lock, 
  TrendingUp, 
  MapPin, 
  ChevronRight, 
  Star, 
  Plus,
  Bell
} from 'lucide-react';
import { supabase, Plantao, LocalTrabalho } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

export default function DashboardPage() {
  const [plantoesMaisProximos, setPlantoesMaisProximos] = useState<PlantaoComLocal[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [locaisAtivos, setLocaisAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const router = useRouter();

  // 1. Verificação de Status PRO e Inicialização
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      
      if (data != null) setIsPro(data.is_pro);
    };
    checkUser();
  }, [router]);

  // 2. Busca de Dados com Loading State Rigoroso
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date().toISOString();
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Busca próximos 2 plantões
      const { data: proximos } = await supabase
        .from('plantoes')
        .select('*, local:locais_trabalho(*)')
        .eq('usuario_id', user.id)
        .gte('data_hora_inicio', hoje)
        .neq('status', 'Cancelado')
        .order('data_hora_inicio', { ascending: true })
        .limit(2);
      
      setPlantoesMaisProximos((proximos as PlantaoComLocal[]) || []);

      // Contagem de plantões no mês
      const { count: countMes } = await supabase
        .from('plantoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado');
      
      setTotalMes(countMes || 0);

      // Cálculo de Ganhos (via Notas Regex)
      const { data: plantoesExtras } = await supabase
        .from('plantoes')
        .select('notas')
        .eq('usuario_id', user.id)
        .eq('is_extra', true)
        .neq('status', 'Cancelado')
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes);

      if (plantoesExtras) {
        let sum = 0;
        plantoesExtras.forEach(p => {
          if (p.notas) {
            const match = p.notas.match(/R\$\s*([\d.]+)/);
            if (match && match[1]) {
              sum += parseFloat(match[1]);
            }
          }
        });
        setTotalGanhos(sum);
      }

      // Locais Ativos
      const { count: countLocais } = await supabase
        .from('locais_trabalho')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .eq('ativo', true);
      
      setLocaisAtivos(countLocais || 0);

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      // Pequeno delay para evitar flickering visual
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 3. Renderização Condicional (Loading -> Empty -> Dashboard)
  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div className="skeleton" style={{ height: 28, width: '150px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 16, width: '220px' }} />
        </div>
        
        <div className="skeleton" style={{ height: 160, borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: 60, borderRadius: '16px' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: '24px' }} />
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, animate: 'pulse 2s infinite' }}>
            Carregando sua agenda organizada...
          </p>
        </div>
      </div>
    );
  }

  if (locaisAtivos === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center', 
        padding: '80px 24px',
        minHeight: '80vh',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 24, animation: 'cardEntrance 0.8s ease' }}>👋</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Seja bem-vindo!
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
          Sua agenda está pronta para ser organizada. Comece cadastrando onde você trabalha.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ padding: '16px 40px', fontSize: 16, borderRadius: 16, background: 'var(--accent-blue)' }}
          onClick={() => router.push('/locais')}
        >
          ➕ Adicionar Primeiro Local
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Meu Plantão 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Sua agenda organizada e produtiva.
          </p>
        </div>
        <button 
          onClick={() => router.push('/notificacoes')}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: '50%', cursor: 'pointer', position: 'relative' }}
        >
          <Bell size={20} color="var(--text-secondary)" />
        </button>
      </div>

      {/* CARD PRINCIPAL - GANHOS E PLANTÕES */}
      <div className="card" style={{ 
        padding: '24px', 
        borderRadius: '24px', 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, var(--accent-blue-light) 0%, transparent 70%)', opacity: 0.5, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            <TrendingUp size={14} color="var(--accent-blue)" />
            Resumo do Mês
          </div>
          
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
            📅 {totalMes} <span style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 600 }}>plantões agendados</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            {isPro ? (
              <div onClick={() => router.push('/relatorio')} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Total Estimado em Extras</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  💰 {totalGanhos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <ChevronRight size={20} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  💰 Ver meus ganhos reais
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowProModal('Ganhos')}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                    border: 'none', 
                    padding: '12px 24px', 
                    fontSize: 14,
                    fontWeight: 800,
                    borderRadius: 14,
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
                    width: 'fit-content'
                  }}
                >
                  [ Desbloquear ganhos 💰 ]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD DE LOCAIS - ACESSO RÁPIDO */}
      <div onClick={() => router.push('/locais')} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 20px', 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: '16px', 
        marginBottom: 24, 
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent-blue-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color="var(--accent-blue)" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            🏥 {locaisAtivos} locais ativos
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent-blue)', fontWeight: 700 }}>
          ver todos <ChevronRight size={16} />
        </div>
      </div>

      {/* SEÇÃO PRO - DESTAQUES (Paywall PLG) */}
      {!isPro && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', 
          border: '1px solid #FDE68A', 
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: 0 }}>Vantagens do Plano Pro</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Relatórios financeiros detalhados
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Exportação de escala em PDF oficial
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Edição ilimitada de ciclos customizados
            </li>
          </ul>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', background: '#d97706', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800 }}
            onClick={() => setShowProModal('Assinatura')}
          >
            Assinar Pro ⭐
          </button>
        </div>
      )}

      {/* PRÓXIMOS PLANTÕES */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Próximos Plantões
          </h3>
          <button 
            onClick={() => router.push('/calendario')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Ver agenda completa
          </button>
        </div>

        {plantoesMaisProximos.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Nenhum plantão agendado para os próximos dias.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plantoesMaisProximos.map(p => (
              <div key={p.id} className="shift-item" style={{ border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <div className="shift-color-bar" style={{ backgroundColor: p.local?.cor_calendario || 'var(--accent-blue)' }} />
                <div className="shift-info" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {p.local?.nome || 'Local de Trabalho'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Calendar size={13} />
                    <span style={{ textTransform: 'capitalize' }}>
                      {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </span>
                    <Clock size={13} style={{ marginLeft: 6 }} />
                    {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', borderRadius: '24px' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Desbloqueie recursos exclusivos como controle financeiro, exportação de escala em PDF e locais ilimitados.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }} onClick={() => setShowProModal('')}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', borderRadius: '12px', fontWeight: 700 }} onClick={() => setShowProModal('')}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
