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
  const [repassesAbertos, setRepassesAbertos] = useState<any[]>([]);
  const [meusRepasses, setMeusRepasses] = useState<any[]>([]);

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

    const [{ data: rps }, { data: meusRps }] = await Promise.all([
      supabase.rpc('listar_repasses_abertos'),
      supabase.from('repasses').select('*, plantao:plantoes(*, local:locais_trabalho(*))').eq('ofertante_id', user.id).order('created_at', { ascending: false }).limit(3)
    ]);
    
    setRepassesAbertos(rps ? rps.filter((r: any) => r.ofertante_id !== user.id) : []);
    setMeusRepasses(meusRps || []);

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
        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 32 }}>
            
            <div className="card" style={{ height: 'fit-content' }}>
              <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                <ArrowRightLeft size={20} />
                Meus Repasses (Histórico)
              </h2>
              {meusRepasses.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-primary)', padding: 16, borderRadius: 8 }}>
                  Você ainda não ofereceu nenhum plantão.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {meusRepasses.map((mr: any) => {
                    const statusColor = mr.status === 'aberto' ? '#f59e0b' : 'var(--accent-green)';
                    const plantao = mr.plantao;
                    return (
                      <div key={mr.id} style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, borderLeft: `3px solid ${statusColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{plantao?.local?.nome || 'Local Removido'}</span>
                          <span style={{ fontSize: 10, background: 'var(--bg-secondary)', color: statusColor, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {mr.status === 'aberto' ? 'AGUARDANDO COLEGA...' : 'ASSUMIDO! ✅'}
                          </span>
                        </div>
                        {plantao && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={12} /> {new Date(plantao.data_hora_inicio).toLocaleDateString('pt-BR')}  <Clock size={12} style={{ marginLeft: 4 }}/> {new Date(plantao.data_hora_inicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <a href="/repasses" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', textAlign: 'center', marginTop: 4, display: 'block', fontWeight: 600 }}>Abrir Oportunidades Totais →</a>
                </div>
              )}
            </div>

            <div className="card" style={{ height: 'fit-content', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-violet)' }}>
                <ArrowRightLeft size={20} />
                Mural da Clínica (Repasses em Aberto)
              </h2>
              {repassesAbertos.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-primary)', padding: 16, borderRadius: 8 }}>
                  Nenhum colega da rede oferecendo plantões hoje.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {repassesAbertos.slice(0, 3).map((r: any) => (
                    <div key={r.repasse_id} style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-violet)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.local_nome}</span>
                        <span style={{ fontSize: 10, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Da clínica: {r.ofertante_email.split('@')[0]}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Calendar size={12} /> {new Date(r.data_hora_inicio).toLocaleDateString('pt-BR')}  <Clock size={12} style={{ marginLeft: 4 }}/> {new Date(r.data_hora_inicio).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                      </div>
                      <a href="/repasses" className="btn" style={{ display: 'block', textAlign: 'center', background: 'var(--accent-violet)', color: 'white', padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        Ir para o Mural
                      </a>
                    </div>
                  ))}
                  {repassesAbertos.length > 3 && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      + {repassesAbertos.length - 3} plantão(ões) no Mural
                    </div>
                  )}
                </div>
              )}
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
