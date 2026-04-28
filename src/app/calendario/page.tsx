'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, Plantao, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { Clock, MoreVertical, ChevronLeft, ChevronRight, Info, Edit2, Trash2, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ShareAgendaModal } from '../../components/ShareAgendaModal';
import { ShiftEditScreen } from '../../components/ShiftEditScreen';
import { formatDaysArray } from '../../lib/date-utils';

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
  const [shiftParaEditar, setShiftParaEditar] = useState<PlantaoComLocal | null>(null);
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
      console.warn("Offline/Error fetching", e);
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
        body: JSON.stringify({ modo: 'encerrar_em', data_encerramento: p.data_hora_inicio }),
      });
      if (response.ok) {
        localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
        fetchPlantoes();
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
      }
    } catch { /* silence */ }
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

  const hospitaisNoMes = useMemo(() => {
    const unique = new Map<string, { nome: string, cor: string, regra: string, turno: string }>();
    plantoes.forEach(p => {
      if (p.local) {
        const h = new Date(p.data_hora_inicio).getHours();
        const turno = (h >= 18 || h < 6) ? 'Noturno' : 'Diurno';
        const regra = p.escala?.regra || 'Ocasional';
        unique.set(p.local.id, { 
          nome: p.local.nome, 
          cor: p.local.cor_calendario || '#4f8ef7',
          regra,
          turno
        });
      } else if (p.is_extra) {
        unique.set('extra', { nome: 'Plantão Extra', cor: '#8b5cf6', regra: 'Ad-hoc', turno: 'Ocasional' });
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
    const starts = ps.filter(p => new Date(p.data_hora_inicio).getDate() === dia);
    const ends = ps.filter(p => new Date(p.data_hora_inicio).getDate() !== dia);
    const displayPs = [...starts, ...ends].slice(0, 3);
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {displayPs.map((p, i) => (<div key={i} style={{ flex: 1, background: getCor(p) }} />))}
      </div>
    );
  };

  const handleSaveShift = async (data: any) => {
    if (!shiftParaEditar) return;
    setSalvandoCiclo(true);
    try {
      const { regra, horaInicio, horaFim, cor, dataInicio } = data;
      const dataNovaFormatada = dataInicio + 'T' + horaInicio + ':00';
      
      if (shiftParaEditar.local_id && cor !== shiftParaEditar.local?.cor_calendario) {
        await supabase.from('locais_trabalho').update({ cor_calendario: cor }).eq('id', shiftParaEditar.local_id);
      }

      if (shiftParaEditar.escala_id) {
        await fetch(`/api/escalas/${shiftParaEditar.escala_id}`, { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ modo: 'encerrar_em', data_encerramento: dataNovaFormatada }) 
        });
        
        await fetch('/api/escalas', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            local_id: shiftParaEditar.local_id, 
            regra: regra, 
            data_inicio: dataNovaFormatada, 
            hora_fim: horaFim 
          }) 
        });
      } else {
        await supabase.from('plantoes').update({
           data_hora_inicio: dataNovaFormatada,
           data_hora_fim: dataInicio + 'T' + horaFim + ':00'
        }).eq('id', shiftParaEditar.id);
      }

      localStorage.removeItem(`calendario_cache_${ano}_${mes}`);
      fetchPlantoes();
      setShiftParaEditar(null);
      setDiaSelecionado(null);
    } catch (e) {
      alert('Erro ao salvar alterações.');
    } finally {
      setSalvandoCiclo(false);
    }
  };

  return (
    <div className="page-container" style={{ background: '#020617', minHeight: '100vh', paddingBottom: '120px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Calendário</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Visualize seus plantões — {loading && 'carregando...'}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
        <button onClick={mesAnterior} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', color: '#fff', padding: 12, borderRadius: '50%', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', minWidth: 160, textAlign: 'center' }}>{MESES[mes]} {ano}</span>
        <button onClick={proximoMes} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #1e293b', color: '#fff', padding: 12, borderRadius: '50%', cursor: 'pointer' }}><ChevronRight size={20} /></button>
      </div>

      <div className="card" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 12 }}>
          {DIAS_SEMANA.map(d => (<div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>{d}</div>))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {cells.map((cell, idx) => {
            const ps = cell.mesAtual ? plantoesNoDia(cell.dia) : [];
            const hojeCell = cell.mesAtual && isHoje(cell.dia);
            return (
              <div key={idx} onClick={() => { if (!cell.mesAtual) return; setDiaSelecionado(cell.dia); }}
                className={`aspect-square rounded-2xl overflow-hidden ${hojeCell ? 'border-neon-blue' : ''}`}
                style={{ position: 'relative', background: cell.mesAtual ? 'rgba(15, 23, 42, 0.5)' : 'transparent', cursor: cell.mesAtual ? 'pointer' : 'default', border: !hojeCell && cell.mesAtual ? '1px solid #1e293b' : 'none' }}>
                {renderCellBackground(ps, cell.dia)}
                <div style={{ position: 'relative', zIndex: 5, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: ps.length > 0 ? '#fff' : (cell.mesAtual ? '#64748b' : '#334155'), textShadow: ps.length > 0 ? '0 1px 4px rgba(0,0,0,0.5)' : 'none' }}>{cell.dia}</span>
                </div>
                {hojeCell && (<div style={{ position: 'absolute', top: 4, left: 4, background: '#3b82f6', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 4, zIndex: 10 }}>HOJE</div>)}
                {ps.length > 3 && (<div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 4px', borderRadius: 4, zIndex: 10 }}>+{ps.length - 3}</div>)}
              </div>
            );
          })}
        </div>
      </div>

      {hospitaisNoMes.length > 0 && (
        <div className="card" style={{ marginTop: 32, background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #1e293b', borderRadius: 24, padding: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: 20 }}>Legenda</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 24 }}>
            {hospitaisNoMes.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: h.cor }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{h.nome}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{formatDaysArray(h.regra)} • {h.turno}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid #1e293b' }}>
            <Info size={16} color="#475569" />
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>As cores representam os locais de trabalho. Toque em um dia para ver os detalhes.</p>
          </div>
        </div>
      )}

      {diaSelecionado !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setDiaSelecionado(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 420, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 28, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{diaSelecionado} de {MESES[mes]}</h2>
              <button onClick={() => setDiaSelecionado(null)} style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer' }}>X</button>
            </div>
            {plantoesNoDia(diaSelecionado).length === 0 ? (<p style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', padding: '20px 0' }}>Dia de folga livre! 🏖️</p>) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plantoesNoDia(diaSelecionado).map(p => {
                  const dInicio = new Date(p.data_hora_inicio);
                  const isExitOnly = dInicio.getDate() !== diaSelecionado || dInicio.getMonth() !== mes || dInicio.getFullYear() !== ano;
                  return (
                    <div key={p.id} style={{ padding: 20, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid #1e293b', borderRadius: 20, borderLeft: `5px solid ${p.local?.cor_calendario ?? '#4f8ef7'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', marginBottom: 6 }}>{p.local?.nome ?? 'Local Indefinido'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#94a3b8', fontWeight: 500 }}><Clock size={16} /> {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        {!isExitOnly && (
                          <div style={{ display: 'flex', gap: 10 }}>
                             <button onClick={() => { if (!isPro) { setShowUpgradeModal(true); return; } setShiftParaEditar(p); }} style={{ background: 'rgba(30, 41, 59, 0.6)', border: 'none', color: '#fff', padding: 10, borderRadius: 10, cursor: 'pointer' }}><Edit2 size={18} /></button>
                             <button onClick={() => setModalExclusao(p)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#ef4444', padding: 10, borderRadius: 10, cursor: 'pointer' }}><Trash2 size={18} /></button>
                          </div>
                        )}
                      </div>
                      {isExitOnly && (
                        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Info size={16} color="#60a5fa" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Plantão iniciado no dia anterior. Edição apenas no dia de início.</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalExclusao(null)}>
          <div className="card" style={{ maxWidth: 400, width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 28, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Remover Plantão</h2>
            <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 28 }}><strong>{modalExclusao.local?.nome}</strong><br />{new Date(modalExclusao.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={removerSomenteEste} disabled={excluindo} style={{ padding: 16, background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #1e293b', borderRadius: 14, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>Remover só este</button>
              {!modalExclusao.is_extra && modalExclusao.escala_id && (<button onClick={removerEstEFuturos} disabled={excluindo} style={{ padding: 16, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 14, color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>Remover este e futuros</button>)}
              <button onClick={() => setModalExclusao(null)} style={{ padding: 16, background: 'transparent', border: 'none', color: '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {shiftParaEditar && (
        <ShiftEditScreen 
          shift={shiftParaEditar} 
          onSave={handleSaveShift} 
          onCancel={() => setShiftParaEditar(null)} 
        />
      )}

      <ShareAgendaModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} initialShifts={plantoes} userName={userName} initialTotalGanhos={totalGanhos} isPro={!!isPro} />
    </div>
  );
}
