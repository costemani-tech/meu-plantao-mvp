'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, Plantao, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { Clock, MoreVertical, ChevronLeft, ChevronRight, Info, Edit2, Trash2, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ShareAgendaModal } from '../../components/ShareAgendaModal';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
  escala?: { regra: string };
  status_conflito?: boolean;
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
  
  const [menuAberto, setMenuAberto] = useState(false);
  const [edicaoCiclo, setEdicaoCiclo] = useState<{p: PlantaoComLocal, regra: string, dataInicio: string, horaInicio: string, horaFim: string} | null>(null);
  const [salvandoCiclo, setSalvandoCiclo] = useState(false);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const router = useRouter();
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('Médico');
  const [totalGanhos, setTotalGanhos] = useState(0);

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('is_pro, nome').eq('id', user.id).single();
      setIsPro(isUserPro(user.email) || (profile?.is_pro === true));

      const getShortName = (fullName: string) => {
        const parts = fullName?.trim().split(/\s+/) || [];
        if (parts.length <= 1) return parts[0] || 'Médico';
        return `${parts[0]} ${parts[parts.length - 1]}`;
      };
      setUserName(getShortName(profile?.nome || user.user_metadata?.full_name || user.user_metadata?.name || 'Médico'));
    };
    checkPro();
  }, []);

  const fetchPlantoes = useCallback(async () => {
    const cachedKey = `calendario_cache_${ano}_${mes}`;
    const cachedData = localStorage.getItem(cachedKey);
    if (cachedData) {
      setPlantoes(JSON.parse(cachedData));
    }
    setLoading(true);

    try {
      const inicioMes = new Date(ano, mes, 1).toISOString();
      const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('plantoes')
        .select('*, local:locais_trabalho(*), escala:escalas(regra)')
        .eq('usuario_id', user.id)
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado')
        .order('data_hora_inicio', { ascending: true });
        
      const freshData = (data as PlantaoComLocal[]) ?? [];
      setPlantoes(freshData);
      localStorage.setItem(cachedKey, JSON.stringify(freshData));
    } catch (e) {
      console.warn("Modo offline ou erro ao buscar plantões", e);
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => { fetchPlantoes(); }, [fetchPlantoes]);

  useEffect(() => {
    const handleUpdate = () => fetchPlantoes();
    window.addEventListener('plantoes-atualizados', handleUpdate);
    return () => window.removeEventListener('plantoes-atualizados', handleUpdate);
  }, [fetchPlantoes]);

  const removerSomenteEste = async () => {
    if (!modalExclusao) return;
    setExcluindo(true);
    const id = modalExclusao.id;
    setPlantoes(prev => prev.filter(p => p.id !== id));
    setModalExclusao(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('plantoes').delete().eq('usuario_id', user.id).eq('id', id);
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
      const dInicio = new Date(p.data_hora_inicio);
      const dFim = new Date(p.data_hora_fim);
      const isStartDay = dInicio.getDate() === dia && dInicio.getMonth() === mes && dInicio.getFullYear() === ano;
      const isEndDay = dFim.getDate() === dia && dFim.getMonth() === mes && dFim.getFullYear() === ano && 
                       (dInicio.getDate() !== dFim.getDate() || dInicio.getMonth() !== dFim.getMonth() || dInicio.getFullYear() !== dFim.getFullYear());
      return isStartDay || isEndDay;
    });

  // ── Lógica da Legenda Dinâmica
  const hospitaisNoMes = useMemo(() => {
    const unique = new Map<string, { nome: string, cor: string, tipo?: string }>();
    plantoes.forEach(p => {
      if (p.local) {
        unique.set(p.local.id, { 
          nome: p.local.nome, 
          cor: p.local.cor_calendario || '#4f8ef7',
          tipo: p.local.is_home_care ? 'Home Care' : 'Hospital'
        });
      } else if (p.is_extra) {
        unique.set('extra', { nome: 'Plantão Extra', cor: '#8b5cf6', tipo: 'Ocasional' });
      }
    });
    return Array.from(unique.values());
  }, [plantoes]);

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasAnterior = new Date(ano, mes, 0).getDate();
  const hoje = new Date();
  const isHoje = (dia: number) => dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  const mesAnterior = () => { if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1); };
  const proximoMes = () => { if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1); };

  const cells: Array<{ dia: number; mesAtual: boolean }> = [];
  for (let i = primeiroDiaMes; i > 0; i--) cells.push({ dia: diasAnterior - i + 1, mesAtual: false });
  for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, mesAtual: true });
  while (cells.length % 7 !== 0) cells.push({ dia: cells.length - diasNoMes - primeiroDiaMes + 1, mesAtual: false });

  const renderCellBackground = (ps: PlantaoComLocal[], dia: number) => {
    if (ps.length === 0) return null;
    const getCor = (p: PlantaoComLocal) => p.is_extra ? '#8b5cf6' : (p.local?.cor_calendario ?? '#4f8ef7');
    
    // Filtrar para mostrar primeiro os plantões que COMEÇAM no dia (regra de cross-day visual)
    const starts = ps.filter(p => new Date(p.data_hora_inicio).getDate() === dia);
    const ends = ps.filter(p => new Date(p.data_hora_inicio).getDate() !== dia);
    
    const displayPs = [...starts, ...ends].slice(0, 4);
    
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {displayPs.map((p, i) => (
          <div key={i} style={{ flex: 1, background: getCor(p) }} />
        ))}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ background: '#020617', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header Premium 2.0 */}
      <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Calendário</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Visualize seus plantões — {loading && 'carregando...'}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
        <button onClick={mesAnterior} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', minWidth: 140, textAlign: 'center' }}>{MESES[mes]} {ano}</span>
        <button onClick={proximoMes} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuAberto(!menuAberto)} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}><MoreVertical size={20} /></button>
          {menuAberto && (
            <div style={{ position: 'absolute', top: 50, right: 0, background: "#0f172a", border: '1px solid #1e293b', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: 16, overflow: 'hidden', minWidth: 200, zIndex: 100 }}>
              <button onClick={() => { setMenuAberto(false); setShowExportModal(true); }} style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 700, color:'#fff', cursor: 'pointer' }}>Compartilhar Escala</button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="card" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            const hojeCell = cell.mesAtual && isHoje(cell.dia);
            
            return (
              <div 
                key={idx} 
                onClick={() => { if (!cell.mesAtual) return; setDiaSelecionado(cell.dia); }}
                className={`aspect-square rounded-2xl overflow-hidden ${hojeCell ? 'border-neon-blue' : ''}`}
                style={{ 
                  position: 'relative',
                  background: cell.mesAtual ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
                  cursor: cell.mesAtual ? 'pointer' : 'default',
                  border: !hojeCell && cell.mesAtual ? '1px solid #1e293b' : 'none'
                }}
              >
                {/* Background do dia (Divisões) */}
                {renderCellBackground(ps, cell.dia)}

                {/* Camada de conteúdo */}
                <div style={{ position: 'relative', zIndex: 5, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 800, 
                    color: ps.length > 0 ? '#fff' : (cell.mesAtual ? '#64748b' : '#334155'),
                    textShadow: ps.length > 0 ? '0 1px 4px rgba(0,0,0,0.4)' : 'none'
                  }}>
                    {cell.dia}
                  </span>
                </div>

                {/* Badges */}
                {hojeCell && (
                  <div style={{ position: 'absolute', top: 4, right: 4, background: '#3b82f6', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 4px', borderRadius: 4, zIndex: 10 }}>HOJE</div>
                )}
                {ps.length > 4 && (
                  <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 4px', borderRadius: 4, zIndex: 10 }}>+{ps.length - 4}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda Dinâmica */}
      {hospitaisNoMes.length > 0 && (
        <div className="card" style={{ marginTop: 24, background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #1e293b', borderRadius: 24, padding: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 16 }}>Legenda</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
            {hospitaisNoMes.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: h.cor }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{h.nome}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{h.tipo}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
            <Info size={16} color="#64748b" />
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              As cores representam os locais de trabalho. Toque em um dia para ver os detalhes.
            </p>
          </div>
        </div>
      )}

      {/* Modais */}
      {diaSelecionado !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setDiaSelecionado(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 400, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{diaSelecionado} de {MESES[mes]}</h2>
              <button onClick={() => setDiaSelecionado(null)} style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 8, borderRadius: '50%', cursor: 'pointer' }}>X</button>
            </div>
            {plantoesNoDia(diaSelecionado).length === 0 ? (<p style={{ color: '#94a3b8', fontSize: 14 }}>Dia de folga livre!</p>) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantoesNoDia(diaSelecionado).map(p => {
                  const dInicio = new Date(p.data_hora_inicio);
                  const isExitOnly = dInicio.getDate() !== diaSelecionado || dInicio.getMonth() !== mes || dInicio.getFullYear() !== ano;
                  
                  return (
                    <div key={p.id} style={{ padding: 16, background: 'rgba(30, 41, 59, 0.3)', border: '1px solid #1e293b', borderRadius: 16, borderLeft: `4px solid ${p.local?.cor_calendario ?? '#4f8ef7'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>{p.local?.nome ?? 'Local Indefinido'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}><Clock size={14} /> {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        
                        {/* CRUD Actions */}
                        {!isExitOnly && (
                          <div style={{ display: 'flex', gap: 8 }}>
                             <button 
                               onClick={() => {
                                 if (!isPro) { setShowUpgradeModal(true); return; }
                                 setEdicaoCiclo({p, regra: p.escala?.regra || '12x36', dataInicio: p.data_hora_inicio.substring(0, 10), horaInicio: new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), horaFim: new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })});
                               }} 
                               style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                               title="Editar"
                             >
                               <Edit2 size={16} />
                             </button>
                             <button 
                               onClick={() => setModalExclusao(p)} 
                               style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                               title="Excluir"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        )}
                      </div>
                      
                      {isExitOnly && (
                        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Info size={14} color="#60a5fa" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>Plantão iniciado no dia anterior. Edição apenas no dia de início.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {modalExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalExclusao(null)}>
          <div className="card" style={{ maxWidth: 380, width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Remover Plantão</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}><strong>{modalExclusao.local?.nome}</strong><br />{new Date(modalExclusao.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={removerSomenteEste} disabled={excluindo} style={{ padding: 14, background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Remover só este</button>
              {!modalExclusao.is_extra && modalExclusao.escala_id && (
                <button onClick={removerEstEFuturos} disabled={excluindo} style={{ padding: 14, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Remover este e futuros</button>
              )}
              <button onClick={() => setModalExclusao(null)} style={{ padding: 14, background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {edicaoCiclo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24 }}>
             <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Editar Ciclo</h2>
             <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Data de Início</label>
             <input type="date" value={edicaoCiclo.dataInicio} onChange={e => setEdicaoCiclo({...edicaoCiclo, dataInicio: e.target.value})} className="form-input" style={{ marginBottom: 24, background: 'rgba(30, 41, 59, 0.3)', border: '1px solid #1e293b', color: '#fff' }} />
             <div style={{ display: 'flex', gap: 12 }}>
                 <button onClick={() => setEdicaoCiclo(null)} style={{ flex: 1, padding: 14, background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                 <button 
                   onClick={async () => {
                     setSalvandoCiclo(true);
                     try {
                       const dataNovaFormatada = edicaoCiclo.dataInicio + 'T' + edicaoCiclo.horaInicio + ':00';
                       await fetch(`/api/escalas/${edicaoCiclo.p.escala_id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modo: 'encerrar_em', data_encerramento: dataNovaFormatada }) });
                       await fetch('/api/escalas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ local_id: edicaoCiclo.p.local_id, regra: edicaoCiclo.regra, data_inicio: dataNovaFormatada, hora_fim: edicaoCiclo.horaFim }) });
                       localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
                       fetchPlantoes();
                       setEdicaoCiclo(null);
                       setDiaSelecionado(null);
                     } catch (e) { alert('Erro ao recalcular ciclo.'); }
                     setSalvandoCiclo(false);
                   }} 
                   style={{ flex: 1, padding: 14, background: 'var(--accent-blue)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                 >
                   {salvandoCiclo ? '...' : 'Aplicar'}
                 </button>
             </div>
          </div>
        </div>
      )}

      <ShareAgendaModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} initialShifts={plantoes} userName={userName} initialTotalGanhos={totalGanhos} isPro={!!isPro} />
    </div>
  );
}
