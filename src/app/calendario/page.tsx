'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../../lib/supabase';
import { Calendar, Clock } from 'lucide-react';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarioPage() {
  const [plantoes, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [modalExclusao, setModalExclusao] = useState<PlantaoComLocal | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const fetchPlantoes = useCallback(async () => {
    const cachedData = localStorage.getItem(`calendario_cache_${ano}_${mes}`);
    if (cachedData) {
      setPlantoes(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const inicioMes = new Date(ano, mes, 1).toISOString();
      const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
      const { data } = await supabase
        .from('plantoes')
        .select('*, local:locais_trabalho(*)')
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado')
        .order('data_hora_inicio', { ascending: true });
        
      const freshData = (data as PlantaoComLocal[]) ?? [];
      setPlantoes(freshData);
      localStorage.setItem(`calendario_cache_${ano}_${mes}`, JSON.stringify(freshData));
    } catch (e) {
      console.warn("Offline mode - mantendo dados antigos do cache.");
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  // Fetch ao montar e quando o mês/ano muda
  useEffect(() => { fetchPlantoes(); }, [fetchPlantoes]);

  // Escuta o evento customizado disparado pela página de Escalas após criação bem-sucedida
  useEffect(() => {
    const handlePlantaoAtualizado = () => {
      fetchPlantoes();
    };
    window.addEventListener('plantoes-atualizados', handlePlantaoAtualizado);
    return () => {
      window.removeEventListener('plantoes-atualizados', handlePlantaoAtualizado);
    };
  }, [fetchPlantoes]);

  const abrirModalExclusao = (p: PlantaoComLocal) => {
    setModalExclusao(p);
  };

  const removerSomenteEste = async () => {
    if (!modalExclusao) return;
    setExcluindo(true);
    const id = modalExclusao.id;
    setPlantoes(prev => prev.filter(p => p.id !== id));
    setModalExclusao(null);
    const { error } = await supabase.from('plantoes').delete().eq('id', id);
    if (error) {
      fetchPlantoes();
    } else {
      localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
      window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
    }
    setExcluindo(false);
  };

  const removerEstEFuturos = async () => {
    if (!modalExclusao) return;
    const p = modalExclusao;
    if (!p.escala_id) {
      // Plantão extra sem escala — só remove este
      await removerSomenteEste();
      return;
    }
    setExcluindo(true);
    setModalExclusao(null);
    try {
      const response = await fetch(`/api/escalas/${p.escala_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'encerrar_em',
          data_encerramento: p.data_hora_inicio,
        }),
      });
      if (response.ok) {
        localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
        fetchPlantoes();
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
      }
    } catch { /* silencioso */ }
    setExcluindo(false);
  };

  const plantoesNoDia = (dia: number): PlantaoComLocal[] =>
    plantoes.filter(p => {
      const d = new Date(p.data_hora_inicio);
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    });

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasAnterior = new Date(ano, mes, 0).getDate();
  const hoje = new Date();
  const isHoje = (dia: number) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1);
  };
  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1);
  };

  const cells: Array<{ dia: number; mesAtual: boolean }> = [];
  for (let i = primeiroDiaMes - 1; i >= 0; i--) cells.push({ dia: diasAnterior - i, mesAtual: false });
  for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, mesAtual: true });
  while (cells.length % 7 !== 0) cells.push({ dia: cells.length - diasNoMes - primeiroDiaMes + 2, mesAtual: false });

  return (
    <>
      <div className="page-header mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Calendário 📅</h1>
          <p>
            Visualize seus plantões — {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>⟳ Atualizando...</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={mesAnterior}>←</button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
            {MESES[mes]} {ano}
          </span>
          <button className="btn btn-secondary" onClick={proximoMes}>→</button>
        </div>
      </div>

      <div className="card">
        <div className="cal-header">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
        </div>
        <div className="calendar-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            return (
              <div
                key={idx}
                onClick={() => cell.mesAtual && setDiaSelecionado(cell.dia)}
                style={{ cursor: cell.mesAtual ? 'pointer' : 'default' }}
                className={`cal-day ${cell.mesAtual ? '' : 'other-month'} ${cell.mesAtual && isHoje(cell.dia) ? 'today' : ''}`}
              >
                <div className="cal-day-num">{cell.dia}</div>
                {ps.length > 0 && (
                  <div className="cal-indicators">
                    {ps.slice(0, 3).map(p => (
                      <div
                        key={p.id}
                        className="cal-dot"
                        style={{
                          backgroundColor: (p as unknown as { status_conflito?: boolean }).status_conflito
                            ? '#f59e0b'
                            : (p.local?.cor_calendario ?? '#4f8ef7')
                        }}
                        title={`${p.local?.nome}${ (p as unknown as { status_conflito?: boolean }).status_conflito ? ' ⚠️ Conflito' : ''}`}
                      />
                    ))}
                    {ps.length > 3 && (
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>+{ps.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini-lista da semana/mês inteligente */}
      <div style={{ marginTop: 24, marginBottom: 80 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Próximos Plantões ({MESES[mes]})
        </h2>
        {plantoes.filter(p => new Date(p.data_hora_inicio).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5).length === 0 ? (
          <div className="card">
             <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Nenhum plantão futuro para este mês.</p>
          </div>
        ) : (
          <div className="shift-list">
            {plantoes.filter(p => new Date(p.data_hora_inicio).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5).map(p => (
              <div key={p.id} className="shift-item" onClick={() => setDiaSelecionado(new Date(p.data_hora_inicio).getDate())} style={{ cursor: 'pointer' }}>
                <div className="shift-color-bar" style={{ backgroundColor: (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7') }} />
                <div className="shift-info" style={{ flex: 1, padding: '4px 0' }}>
                  <div className="shift-local" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {p.local?.nome ?? 'Local não informado'}
                  </div>
                  <div className="shift-time" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Calendar size={13} /> 
                    <span style={{ textTransform: 'capitalize' }}>
                      {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}
                    </span>
                    <Clock size={13} style={{ marginLeft: 6 }} /> 
                    {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup de Detalhes do Dia Selecionado */}
      {diaSelecionado !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setDiaSelecionado(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {diaSelecionado} de {MESES[mes]}
              </h2>
              <button className="btn btn-secondary" onClick={() => setDiaSelecionado(null)} style={{ padding: '6px 12px', fontSize: 12 }}>X</button>
            </div>
            
            {plantoesNoDia(diaSelecionado).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>🎉 Dia de folga livre! Nenhum plantão agendado para esta data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantoesNoDia(diaSelecionado).map(p => (
                  <div key={p.id} style={{ padding: 16, background: (p as unknown as { status_conflito?: boolean }).status_conflito ? 'rgba(245,158,11,0.06)' : 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 12, borderLeft: `4px solid ${ (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7')}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {p.local?.nome ?? 'Local Indefinido'}
                        { (p as unknown as { status_conflito?: boolean }).status_conflito && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4 }}>⚠️ Conflito</span>
                        )}
                      </div>
                      <button 
                        onClick={() => abrirModalExclusao(p)}
                        title="Remover Plantão"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.7, fontSize: 14 }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Clock size={14} /> {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {p.local?.endereco && !p.local?.is_home_care && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.local.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Abrir Rota no Mapa ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Exclusão com 3 opções */}
      {modalExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalExclusao(null)}>
          <div className="card" style={{ maxWidth: 380, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Remover Plantão 🗑️</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              <strong>{modalExclusao.local?.nome}</strong><br />
              {new Date(modalExclusao.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · {new Date(modalExclusao.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}
                onClick={removerSomenteEste}
                disabled={excluindo}
              >
                🗑️ Remover só este plantão
              </button>
              {!modalExclusao.is_extra && modalExclusao.escala_id && (
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={removerEstEFuturos}
                  disabled={excluindo}
                >
                  ✂️ Remover este e todos os futuros desta escala
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ padding: '10px 16px', fontSize: 13 }}
                onClick={() => setModalExclusao(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
