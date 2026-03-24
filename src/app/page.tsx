'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Building2, Activity, Bell, ArrowRightLeft, Calendar, Clock } from 'lucide-react';
import { supabase, Plantao, LocalTrabalho } from '../lib/supabase';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

export default function DashboardPage() {
  const [plantoesMaisProximosPorLocal, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [locaisAtivos, setLocaisAtivos] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const agora = new Date();
    const isoAgora = agora.toISOString();
    
    // 1. Buscar todos os plantões futuros para agrupar 1 por local
    const { data: plantoesFuturos } = await supabase
      .from('plantoes')
      .select('*, local:locais_trabalho(*)')
      .eq('status', 'Agendado')
      .gte('data_hora_fim', isoAgora)
      .order('data_hora_inicio', { ascending: true });      
      
    const arrayPlantoes = (plantoesFuturos as PlantaoComLocal[]) || [];
    
    // Agrupar: manter apenas o plantão mais próximo para cada local diferente
    const locaisVistos = new Set<string>();
    const plantoesFiltrados: PlantaoComLocal[] = [];
    
    for (const p of arrayPlantoes) {
      if (!locaisVistos.has(p.local_id)) {
        locaisVistos.add(p.local_id);
        plantoesFiltrados.push(p);
      }
    }
    
    setPlantoes(plantoesFiltrados.slice(0, 6)); // Mostrar no máximo 6 locais diferentes

    // 2. Calcular Plantões no Mês
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
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

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <button onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('notificacoes').insert({ usuario_id: user.id, titulo: 'Alerta Teste 🚨', mensagem: 'O disparo WebSockets funcionou perfeitamente!' });
          }} 
          className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          🔔 Simular Alerta Realtime
        </button>
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

          <div className="card" style={{ marginTop: 32 }}>
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
                    <div className="shift-info" style={{ flex: 1 }}>
                      <div className="shift-local" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.local?.nome ?? 'Local não informado'}
                        {p.local?.is_home_care && (
                          <span style={{ fontSize: 10, background: 'rgba(34,211,181,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 4 }}>🏠 Home Care</span>
                        )}
                      </div>
                      <div className="shift-time" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {formatDate(p.data_hora_inicio)} — {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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

                    {p.local?.endereco && !p.local?.is_home_care && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.local.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12, marginRight: 12, backgroundColor: 'rgba(79, 142, 247, 0.1)', color: 'var(--accent-blue)', border: 'none' }}
                      >
                        📍 Mapa
                      </a>
                    )}
                    <div className={`shift-status ${p.status.toLowerCase()}`}>{p.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
