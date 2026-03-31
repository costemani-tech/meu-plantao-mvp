'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Building2, Activity, Calendar, Clock } from 'lucide-react';
import { supabase, Plantao, LocalTrabalho } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

export default function DashboardPage() {
  const [plantoesMaisProximosPorLocal, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [locaisAtivos, setLocaisAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProModal, setShowProModal] = useState('');
  const [isPro, setIsPro] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      if (data != null) setIsPro(data.is_pro);
    };
    checkPro();
  }, []);

  const fetchPlantoes = useCallback(async () => {
    // 1. OFFLINE FIRST: Carrega o cache armazenado no disco local
    const cachedData = localStorage.getItem('plantoes_cache');
    if (cachedData) {
      setPlantoes(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Middleware lidará na raiz, mas para evitar erros silenciamos aqui

      const hoje = new Date().toISOString();
      
      const plantoesQuery = supabase
        .from('plantoes')
        .select(`
          *,
          local:locais_trabalho(*)
        `)
        .gte('data_hora_inicio', hoje)
        .order('data_hora_inicio', { ascending: true })
        .limit(20);

      const { data: plantoesData } = await plantoesQuery;

      if (plantoesData) {
        // Agrupar por local (apenas o mais próximo de cada)
        const porLocal = new Map<string, any>();
        plantoesData.forEach(p => {
          if (p.local?.id && !porLocal.has(p.local.id)) {
            porLocal.set(p.local.id, p);
          }
        });
        
        const freshData = Array.from(porLocal.values());
        
        // 2. OFFLINE FIRST: Salva dado fresco no disco
        setPlantoes(freshData);
        localStorage.setItem('plantoes_cache', JSON.stringify(freshData));
      }
      
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const { count: countMes } = await supabase
        .from('plantoes')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado');
        
      setTotalMes(countMes || 0);
  
      // 3. Locais Ativos
      const { count: countLocais } = await supabase
        .from('locais_trabalho')
        .select('*', { count: 'exact', head: true });
        
      setLocaisAtivos(countLocais || 0);
    } catch (err) {
      console.warn("Retornando dados do Cache (Modo Offline / Sem Conexão).", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlantoes();
  }, [fetchPlantoes]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity size={32} color="var(--accent-blue)" /> 
            Mission Control
          </h1>
          <p>Visão estratégica das suas escalas — {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>⟳ Atualizando...</span>}</p>
        </div>
      </div>

      {loading ? (
        <div className="stats-grid mobile-stack" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: 84, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon blue"><CalendarDays size={28} /></div>
              <div className="stat-content">
                <div className="stat-label">Plantões no Mês</div>
                <div className="stat-value">{totalMes}</div>
                <div className="stat-sub">Agendados/Realizados</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><Building2 size={28} /></div>
              <div className="stat-content">
                <div className="stat-label">Locais Ativos</div>
                <div className="stat-value">{locaisAtivos}</div>
                <div className="stat-sub">Hospitais / Home Care</div>
              </div>
            </div>
          </div>

          {/* CENTRAL PRO */}
          <div className="card" style={{ marginTop: 24, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f59e0b' }}>⭐</span> Central Pro
              </h2>
              <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: 12, fontWeight: 700 }}>
                RECURSOS PREMIUM
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 16 }} onClick={() => isPro ? router.push('/dashboard') : setShowProModal('Dashboard & PDF')}>
                🔒 Dashboard de Produtividade
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 16 }} onClick={() => setShowProModal('Compartilhamento de Agenda')}>
                🔒 Compartilhar Agenda
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
              Próximos Plantões por Local
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              O plantão mais próximo agendado em cada local de trabalho. Para a agenda completa, consulte o Calendário.
            </p>
            {plantoesMaisProximosPorLocal.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗓️</div>
                <p>Nenhum plantão agendado.</p>
              </div>
            ) : (
              <div className="shift-list">
                {plantoesMaisProximosPorLocal.map(p => (
                  <div key={p.id} className="shift-item" style={{ alignItems: 'center' }}>
                    <div
                      className="shift-color-bar"
                      style={{ backgroundColor: p.local?.cor_calendario ?? '#4f8ef7' }}
                    />
                    <div className="shift-info" style={{ flex: 1, padding: '4px 0' }}>
                      <div className="shift-local" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.local?.nome ?? 'Local não informado'}
                        {p.local?.is_home_care && (
                          <span style={{ fontSize: 10, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>
                        )}
                      </div>
                      <div className="shift-time" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <Calendar size={13} /> 
                        <span style={{ textTransform: 'capitalize' }}>
                          {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}
                        </span>
                        <Clock size={13} style={{ marginLeft: 6 }} /> 
                        {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <a 
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Plantão - ${p.local?.nome || 'Médico'}`)}&dates=${new Date(p.data_hora_inicio).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(p.data_hora_fim).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent('Plantão gerado via Meu Plantão App')}&location=${encodeURIComponent(p.local?.endereco || p.local?.nome || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12, marginRight: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange, #f59e0b)', border: 'none' }}
                    >
                      📆 Salvar na Agenda
                    </a>

                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              O recurso de <strong>{showProModal}</strong> é exclusivo para assinantes do Meu Plantão Pro.<br/>
              Desbloqueie todo o poder da sua carreira médica agora!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProModal('')}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => setShowProModal('')}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
