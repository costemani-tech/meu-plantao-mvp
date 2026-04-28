'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Plantao, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { Calendar, Clock, MoreVertical, Link, Check, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isCustomCicloRule, setIsCustomCicloRule] = useState(false);
  const [cicloHorasTrabalho, setCicloHorasTrabalho] = useState('');
  const [cicloHorasDescanso, setCicloHorasDescanso] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // ── Estados do Modal de Exportação PRO
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
      localStorage.setItem(`calendario_cache_${ano}_${mes}`, JSON.stringify(freshData));
    } catch (e) {
      console.warn("Offline mode - mantendo dados antigos do cache.", e);
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    const total = plantoes.reduce((acc, p) => {
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
    setTotalGanhos(total);
  }, [plantoes]);

  /\/\/ Fetch ao montar e quando o mês\/ano muda/
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
      const dInicio = new Date(p.data_hora_inicio);
      const dFim = new Date(p.data_hora_fim);
      
      const isStartDay = dInicio.getDate() === dia && dInicio.getMonth() === mes && dInicio.getFullYear() === ano;
      const isEndDay = dFim.getDate() === dia && dFim.getMonth() === mes && dFim.getFullYear() === ano && 
                       (dInicio.getDate() !== dFim.getDate() || dInicio.getMonth() !== dFim.getMonth() || dInicio.getFullYear() !== dFim.getFullYear());
      
      return isStartDay || isEndDay;
    });

  const getCellBackground = (ps: PlantaoComLocal[], dia: number) => {
    if (ps.length === 0) return 'transparent';
    const getCor = (p: PlantaoComLocal) => p.is_extra ? '#8b5cf6' : (p.local?.cor_calendario ?? '#4f8ef7');

    const locaisUnicos = new Set(ps.map(p => p.local_id || p.local?.nome || p.is_extra));

    if (locaisUnicos.size === 1) {
      return getCor(ps[0]);
    }

    if (ps.length >= 2) {
      const cor1 = getCor(ps[0]);
      const pDiferente = ps.find(p => getCor(p) !== cor1);
      const cor2 = pDiferente ? getCor(pDiferente) : cor1;
      return `linear-gradient(to bottom right, ${cor1} 50%, ${cor2} 50%)`;
    }
    return 'transparent';
  };

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
          <h1>Calendário</h1>
          <p>
            Visualize seus plantões — {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>Atualizando...</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={mesAnterior} style={{ padding: "8px 12px" }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
            {MESES[mes]} {ano}
          </span>
          <button className="btn btn-secondary" onClick={proximoMes} style={{ padding: "8px 12px" }}>
            <ChevronRight size={20} />
          </button>
          
          <div style={{ position: 'relative' }}>
             <button onClick={() => setMenuAberto(!menuAberto)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                <MoreVertical size={20} />
             </button>
             {menuAberto && (
                 <div style={{ position: 'absolute', top: 45, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderRadius: 12, overflow: 'hidden', minWidth: 220, zIndex: 50 }}>
                     <button
                       onClick={() => { setMenuAberto(false); setShowExportModal(true); }}
                       style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}
                     >
                       Compartilhar Escala
                     </button>
                 </div>
             )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cal-header">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
        </div>
        <div id="calendar-grid-export" className="calendar-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', padding: '10px', background: 'var(--bg-primary)' }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            return (
              <div
                key={idx}
                onClick={() => {
                  if (!cell.mesAtual) return;
                  setDiaSelecionado(cell.dia);
                }}
                style={{ 
                  cursor: cell.mesAtual ? 'pointer' : 'default',
                  background: cell.mesAtual ? getCellBackground(ps, cell.dia) : 'transparent',
                  border: ps.some(p => p.status_conflito) ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className={`cal-day ${cell.mesAtual ? '' : 'other-month'} ${cell.mesAtual && isHoje(cell.dia) ? 'today' : ''}`}
              >
                <div 
                  className="cal-day-num" 
                  style={{ 
                    position: 'relative', zIndex: 2,
                    color: ps.some(p => p.status_conflito) ? '#ef4444' : (ps.length > 0 ? '#ffffff' : '#94a3b8'),
                    textShadow: ps.length > 0 && !ps.some(p => p.status_conflito) ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    fontWeight: 'bold'
                  }}
                >
                  {cell.dia}
                </div>
                {ps.length > 2 && (
                  <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '9px', fontWeight: 800, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)', zIndex: 2 }}>
                    +{ps.length - 2}
                  </span>
                )}
              </div>
            );
          })}
        </div>
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
              <p style={{ color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}> Dia de folga livre! Nenhum plantão agendado para esta data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantoesNoDia(diaSelecionado).map(p => {
                  const dInicio = new Date(p.data_hora_inicio);
                  const isSaida = dInicio.getDate() !== diaSelecionado || dInicio.getMonth() !== mes || dInicio.getFullYear() !== ano;

                  return (
                  <div key={p.id} style={{ padding: 16, background: (p as unknown as { status_conflito?: boolean }).status_conflito ? 'rgba(245,158,11,0.06)' : 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 12, borderLeft: `4px solid ${ (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7')}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {p.local?.nome ?? 'Local Indefinido'}
                        {(p as unknown as { is_extra?: boolean }).is_extra && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}> Extra</span>
                        )}
                        { (p as unknown as { status_conflito?: boolean }).status_conflito && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4 }}>  Conflito</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isSaida ? (
                          <span className="text-sm text-gray-500 italic" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Edição e exclusão permitidas apenas no dia de início do plantão.
                          </span>
                        ) : (
                          <>
                            {p.escala_id && (
                              <button 
                                onClick={() => {
                                  if (!isPro) { setShowUpgradeModal(true); return; }
                                  const r = p.escala?.regra || '12x36';
                                  const standardRules = ['12x36', '24x48', '24x72', '5x2', '6x1'];
                                  const isCustom = !standardRules.includes(r);
                                  
                                  setEdicaoCiclo({
                                    p, 
                                    regra: r, 
                                    dataInicio: p.data_hora_inicio.substring(0, 10),
                                    horaInicio: new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                    horaFim: new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                  });
                                  setIsCustomCicloRule(isCustom);
                                  if (isCustom) {
                                    const parts = r.split('x');
                                    setCicloHorasTrabalho(parts[0] || '');
                                    setCicloHorasDescanso(parts[1] || '');
                                  }
                                }}
                                title="Editar Ciclo da Escala"
                                style={{ padding: '6px 12px', fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Editar
                              </button>
                            )}
                            <button 
                              onClick={() => abrirModalExclusao(p)}
                              title="Remover Plantão"
                              style={{ padding: '6px 12px', fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
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
                        Abrir Rota no Mapa 
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Exclusão com 3 opções */}
      {modalExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalExclusao(null)}>
          <div className="card" style={{ maxWidth: 380, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Remover Plantão  </h2>
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
                  {modalExclusao.is_extra ? 'Remover Plantão' : 'Remover só este plantão'}
              </button>
              {!modalExclusao.is_extra && modalExclusao.escala_id && (
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={removerEstEFuturos}
                  disabled={excluindo}
                >
                    Remover este e todos os futuros desta escala
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

      {/* Modal Editar Ciclo */}
      {edicaoCiclo !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
             <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Editar Ciclo da Escala</h2>
             <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
               A regra antiga será <strong>preservada no histórico</strong>. 
               O novo ciclo entrará em vigor e recalculará os plantões da nova data em diante.
             </p>

             <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Data de Início da Nova Regra:</label>
             <input 
               type="date"
               value={edicaoCiclo.dataInicio}
               onChange={e => setEdicaoCiclo({...edicaoCiclo, dataInicio: e.target.value})}
               className="input-field"
               style={{ width: '100%', marginBottom: 16, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
             />

             <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Nova Regra de Escala:</label>
             <select
                 value={edicaoCiclo.regra}
                 onChange={e => {
                   const v = e.target.value;
                   setEdicaoCiclo({...edicaoCiclo, regra: v});
                   setIsCustomCicloRule(v === 'Outro');
                   if (v !== 'Outro') { setCicloHorasTrabalho(''); setCicloHorasDescanso(''); }
                 }}
                 className="input-field"
                 style={{ width: '100%', marginBottom: 24, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                   <option value="12x36">12x36 (Trabalha 12h, folga 36h)</option>
                   <option value="24x48">24x48 (Trabalha 24h, folga 48h)</option>
                   <option value="24x72">24x72 (Trabalha 24h, folga 72h)</option>
                   <option value="5x2">Diarista (Segunda a Sexta)</option>
                   <option value="6x1">Diarista (6x1)</option>
                   <option value="Outro">Outro (Personalizado)</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
               <div>
                 <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Hora de Início (Entrada):</label>
                 <input 
                   type="time"
                   value={edicaoCiclo!.horaInicio}
                   onChange={e => setEdicaoCiclo({...edicaoCiclo!, horaInicio: e.target.value})}
                   className="input-field"
                   style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                 />
               </div>
               <div>
                 <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Hora de Término (Saída):</label>
                 <input 
                   type="time"
                   value={edicaoCiclo!.horaFim}
                   onChange={e => setEdicaoCiclo({...edicaoCiclo!, horaFim: e.target.value})}
                   className="input-field"
                   style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                 />
               </div>
             </div>

              {edicaoCiclo!.regra === 'Outro' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', animation: 'fadeInDown 0.2s ease' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas Trabalhadas</label>
                    <input type="number" min="1" value={cicloHorasTrabalho} onChange={e => { setCicloHorasTrabalho(e.target.value); setEdicaoCiclo({...edicaoCiclo!, regra: `${e.target.value}x${cicloHorasDescanso}`}); }} placeholder="Ex: 12" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas de Descanso</label>
                    <input type="number" min="1" value={cicloHorasDescanso} onChange={e => { setCicloHorasDescanso(e.target.value); setEdicaoCiclo({...edicaoCiclo!, regra: `${cicloHorasTrabalho}x${e.target.value}`}); }} placeholder="Ex: 60" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Ciclo: {(parseInt(cicloHorasTrabalho,10)||0)+(parseInt(cicloHorasDescanso,10)||0)}h</p>
                </div>
              )}
             <div style={{ display: 'flex', gap: 12 }}>
                 <button onClick={() => setEdicaoCiclo(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled={salvandoCiclo}>Cancelar</button>
                 <button 
                   onClick={async () => {
                     setSalvandoCiclo(true);
                     try {
                        const dataNovaFormatada = edicaoCiclo.dataInicio + 'T' + edicaoCiclo.horaInicio + ':00';
                        
                        // 1. Apaga plantoes futuros da escala antiga
                        await fetch('/api/escalas/' + edicaoCiclo.p.escala_id, { 
                          method: 'DELETE', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ modo: 'encerrar_em', data_encerramento: dataNovaFormatada }) 
                        });
                        
                        // 2. Determinar o tipo de jornada
                        let tipo_jornada = 'Plantonista';
                        const regraFinal = edicaoCiclo!.regra === 'Outro' ? `${cicloHorasTrabalho}x${cicloHorasDescanso}` : edicaoCiclo!.regra;
                        
                        if (regraFinal === '5x2' || regraFinal === '6x1') {
                          tipo_jornada = 'Diarista-Corridos';
                        }
                        
                        // 3. Cria a nova escala a partir dessa data escolhida
                        await fetch('/api/escalas', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            local_id: edicaoCiclo!.p.local_id, 
                            regra: regraFinal, 
                            data_inicio: dataNovaFormatada, 
                            forcar_conflito: false,
                            tipo_jornada: tipo_jornada,
                            hora_fim: edicaoCiclo!.horaFim,
                            antecedencia: 2
                          })
                        });
                        
                        localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
                        fetchPlantoes();
                        setEdicaoCiclo(null);
                        setDiaSelecionado(null);
                     } catch (e) {
                        alert('Erro ao recalcular ciclo.');
                     }
                     setSalvandoCiclo(false);
                   }} 
                   className="btn btn-primary" 
                   style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                   disabled={salvandoCiclo || (isCustomCicloRule && (!(parseInt(cicloHorasTrabalho,10) > 0) || !(parseInt(cicloHorasDescanso,10) > 0)))}
                 >
                    {salvandoCiclo ? 'â³ Calculando...' : 'Aplicar Regra'}
                 </button>
             </div>
          </div>
        </div>
      )}

      

      {/* MODAL EXPORTAÇÃƒO PRO */}
      
      <ShareAgendaModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialShifts={plantoes}
        userName={userName}
        initialTotalGanhos={totalGanhos}
        isPro={!!isPro}
      />
    
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} onClick={() => setShowUpgradeModal(false)} />
          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: '32px', padding: '40px 32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#001a41', lineHeight: 1.2 }}>💎 Leve seu controle para outro nível</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {[
                { icon: '💰', title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                { icon: '📄', title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                { icon: '⚡', title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
              ].map((b, i) => (
                <div key={i} style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e3a8a' }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(to right, #2563eb, #1e40af)', border: 'none', borderRadius: '100px', padding: '18px', fontSize: 16, fontWeight: 900 }} onClick={() => setShowUpgradeModal(false)}>🚀 Desbloquear agora</button>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowUpgradeModal(false)}>Talvez mais tarde</button>
            </div>
          </div>
        </div>
      )}
</>
  );
}
