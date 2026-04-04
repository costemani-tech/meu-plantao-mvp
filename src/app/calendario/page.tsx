'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../../lib/supabase';
import { Calendar, Clock, MoreVertical, Link, Check, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
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
  const [showProModal, setShowProModal] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [edicaoCiclo, setEdicaoCiclo] = useState<{p: PlantaoComLocal, regra: string, dataInicio: string} | null>(null);
  const [salvandoCiclo, setSalvandoCiclo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const router = useRouter();
  
  const [isPro, setIsPro] = useState(true); // default true durante carregamento

  // Busca status Pro real do banco
  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      if (data) setIsPro(data.is_pro);
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
      console.warn("Offline mode - mantendo dados antigos do cache.", e);
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

    if (ps.length === 1) {
      const p = ps[0];
      const dInicio = new Date(p.data_hora_inicio);
      const dFim = new Date(p.data_hora_fim);
      const crossesMidnight = dInicio.getDate() !== dFim.getDate() || dInicio.getMonth() !== dFim.getMonth() || dInicio.getFullYear() !== dFim.getFullYear();
      const cor = getCor(p);

      if (crossesMidnight) {
        if (dInicio.getDate() === dia) return `linear-gradient(to bottom, transparent 50%, ${cor} 50%)`;
        return `linear-gradient(to bottom, ${cor} 50%, transparent 50%)`;
      }
      return cor;
    }

    if (ps.length >= 2) {
      const cor1 = getCor(ps[0]);
      const cor2 = getCor(ps[1]);
      return `linear-gradient(to bottom, ${cor1} 50%, ${cor2} 50%)`;
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

  const handleIrMetricas = () => {
    if (isPro) router.push('/dashboard');
    else setShowProModal(true);
  };

  const handleLinkFamiliar = () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    navigator.clipboard.writeText('https://meu-plantao-mvp.vercel.app/agenda/demo');
    setLinkCopiado(true);
    alert('✅ Link público da sua agenda copiado!\n\nCole e envie no WhatsApp ou e-mail para que sua família veja seus próximos plantões.');
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const gerarRelatorio = async () => {
    setIsCalculating(true);
    try {
      // mes é 0-based no state; API espera 1-based
      const res = await fetch(`/api/relatorios/financeiro?mes=${mes + 1}&ano=${ano}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        alert(`⚠️ Erro: ${json.message ?? 'Não foi possível gerar o relatório.'}`);
        return;
      }
      console.log('[Relatório Financeiro] Dados completos:', json);
      const totalFormatado = json.total_geral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      alert(`✅ Total de Extras Calculado: ${totalFormatado}\n\nDetalhes no console.`);
    } catch {
      alert('⚠️ Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsCalculating(false);
    }
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

          {/* Botão de teste do motor financeiro */}
          <button
            id="btn-gerar-relatorio-teste"
            onClick={gerarRelatorio}
            disabled={isCalculating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              background: isCalculating
                ? 'rgba(139,92,246,0.15)'
                : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              color: isCalculating ? 'var(--accent-violet)' : '#fff',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: 10,
              cursor: isCalculating ? 'not-allowed' : 'pointer',
              opacity: isCalculating ? 0.75 : 1,
              transition: 'all 0.2s ease',
              boxShadow: isCalculating ? 'none' : '0 4px 12px rgba(124,58,237,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            {isCalculating ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: 13,
                  height: 13,
                  border: '2px solid rgba(139,92,246,0.4)',
                  borderTopColor: 'var(--accent-violet)',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Calculando...
              </>
            ) : '💰 Gerar Relatório (Teste)'}
          </button>
          
          <div style={{ position: 'relative' }}>
             <button onClick={() => setMenuAberto(!menuAberto)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                <MoreVertical size={20} />
             </button>
             {menuAberto && (
                 <div style={{ position: 'absolute', top: 45, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderRadius: 12, overflow: 'hidden', minWidth: 220, zIndex: 50 }}>
                     <button onClick={() => { setMenuAberto(false); handleIrMetricas(); }} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}>
                        📊 Ver Métricas do Mês
                     </button>
                     <button onClick={() => { setMenuAberto(false); handleLinkFamiliar(); }} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}>
                        {linkCopiado ? <Check size={16} color="#10b981"/> : <Link size={16}/>} 
                        {linkCopiado ? 'Link Copiado!' : 'Link Familiar'}
                        {!isPro && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: 8, marginLeft: 'auto' }}>PRO</span>}
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
        <div className="calendar-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            return (
              <div
                key={idx}
                onClick={() => cell.mesAtual && setDiaSelecionado(cell.dia)}
                style={{ 
                  cursor: cell.mesAtual ? 'pointer' : 'default',
                  background: cell.mesAtual ? getCellBackground(ps, cell.dia) : 'transparent',
                  border: ps.some(p => p.status_conflito) ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className={`cal-day ${cell.mesAtual ? '' : 'other-month'} ${cell.mesAtual && isHoje(cell.dia) ? 'today' : ''}`}
              >
                {ps.some(p => p.status_conflito) && (
                  <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 10 }}>🟡</div>
                )}
                <div 
                  className="cal-day-num" 
                  style={{ 
                    position: 'relative', zIndex: 2,
                    color: ps.length > 0 ? '#ffffff' : 'inherit', 
                    textShadow: ps.length > 0 ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    fontWeight: ps.length > 0 ? 800 : 500
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
                <div className="shift-color-bar" style={{ backgroundColor: (p as unknown as { is_extra?: boolean; status_conflito?: boolean }).is_extra ? '#8b5cf6' : (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7') }} />
                <div className="shift-info" style={{ flex: 1, padding: '4px 0' }}>
                  <div className="shift-local" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.local?.nome ?? 'Local não informado'}
                    {(p as unknown as { is_extra?: boolean }).is_extra && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>💰 Extra</span>
                    )}
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
                        {(p as unknown as { is_extra?: boolean }).is_extra && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>💰 Extra</span>
                        )}
                        { (p as unknown as { status_conflito?: boolean }).status_conflito && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4 }}>⚠️ Conflito</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {p.escala_id && (
                          <button 
                            onClick={() => isPro ? setEdicaoCiclo({p, regra: '12x36', dataInicio: p.data_hora_inicio.substring(0, 10)}) : setShowProModal(true)}
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
                🗑️ {modalExclusao.is_extra ? 'Remover Plantão' : 'Remover só este plantão'}
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
                onChange={e => setEdicaoCiclo({...edicaoCiclo, regra: e.target.value})} 
                className="input-field" 
                style={{ width: '100%', marginBottom: 24, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
             >
                  <option value="12x36">12h Trabalhadas / 36h Descanso</option>
                  <option value="24x48">24h Trabalhadas / 48h Descanso</option>
                  <option value="24x72">24h Trabalhadas / 72h Descanso</option>
                  <option value="24x24">24h Trabalhadas / 24h Descanso</option>
                  <option value="12x60">12h Trabalhadas / 60h Descanso</option>
             </select>
             <div style={{ display: 'flex', gap: 12 }}>
                 <button onClick={() => setEdicaoCiclo(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled={salvandoCiclo}>Cancelar</button>
                 <button 
                   onClick={async () => {
                     setSalvandoCiclo(true);
                     try {
                        const dataNovaFormatada = edicaoCiclo.dataInicio + edicaoCiclo.p.data_hora_inicio.substring(10);
                        
                        // 1. Apaga plantoes futuros da escala antiga
                        await fetch('/api/escalas/' + edicaoCiclo.p.escala_id, { 
                          method: 'DELETE', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ modo: 'encerrar_em', data_encerramento: dataNovaFormatada }) 
                        });
                        
                        // 2. Cria a nova escala a partir dessa data escolhida
                        await fetch('/api/escalas', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ local_id: edicaoCiclo.p.local_id, regra: edicaoCiclo.regra, data_inicio: dataNovaFormatada, forcar_conflito: false })
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
                   disabled={salvandoCiclo}
                 >
                    {salvandoCiclo ? '⏳ Calculando...' : 'Aplicar Regra'}
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PRO PAYWALL - PDF */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tenha um Dashboard completo em PDF com soma de horas, saldo financeiro de extras e controle de folgas! Assine o Pro.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProModal(false)}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => setShowProModal(false)}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
