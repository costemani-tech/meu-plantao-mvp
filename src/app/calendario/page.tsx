'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, Plantao, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { Clock, MoreVertical, ChevronLeft, ChevronRight, Info, AlertTriangle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ShareAgendaModal } from '../../components/ShareAgendaModal';
import Link from 'next/link';

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

  const renderCellBackground = (ps: PlantaoComLocal[]) => {
    if (ps.length === 0) return null;
    const getCor = (p: PlantaoComLocal) => p.is_extra ? '#8b5cf6' : (p.local?.cor_calendario ?? '#4f8ef7');
    
    // Garantir cores únicas se possível para evitar repetição visual se houver 2 plantões no mesmo local
    const displayPs = ps.slice(0, 4);
    
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
                {renderCellBackground(ps)}

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

      {/* Modais (Mantidos da versão anterior) */}
      {diaSelecionado !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setDiaSelecionado(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 400, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{diaSelecionado} de {MESES[mes]}</h2>
              <button onClick={() => setDiaSelecionado(null)} style={{ background: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#fff', padding: 8, borderRadius: '50%', cursor: 'pointer' }}>X</button>
            </div>
            {plantoesNoDia(diaSelecionado).length === 0 ? (<p style={{ color: '#94a3b8', fontSize: 14 }}>Dia de folga livre!</p>) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantoesNoDia(diaSelecionado).map(p => (
                  <div key={p.id} style={{ padding: 16, background: 'rgba(30, 41, 59, 0.3)', border: '1px solid #1e293b', borderRadius: 16, borderLeft: `4px solid ${p.local?.cor_calendario ?? '#4f8ef7'}` }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>{p.local?.nome ?? 'Local Indefinido'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}><Clock size={14} /> {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ShareAgendaModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} initialShifts={plantoes} userName={userName} initialTotalGanhos={totalGanhos} isPro={!!isPro} />
    </div>
  );
}
