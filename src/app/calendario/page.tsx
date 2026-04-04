'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../../lib/supabase';
import { Calendar, Clock, MoreVertical, Link, Check, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
  status_conflito?: boolean;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];
const MESES = ['Janeiro','Fevereiro','MarÃ§o','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
  const [isCustomCicloRule, setIsCustomCicloRule] = useState(false);
  const [cicloHorasTrabalho, setCicloHorasTrabalho] = useState('');
  const [cicloHorasDescanso, setCicloHorasDescanso] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // â”€â”€ Estados do Modal de ExportaÃ§Ã£o PRO
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMes, setExportMes] = useState<number | null>(null);
  const [exportAno, setExportAno] = useState(new Date().getFullYear());
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPreview, setExportPreview] = useState<PlantaoComLocal[]>([]);
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

  // Fetch ao montar e quando o mÃªs/ano muda
  useEffect(() => { fetchPlantoes(); }, [fetchPlantoes]);

  // Escuta o evento customizado disparado pela pÃ¡gina de Escalas apÃ³s criaÃ§Ã£o bem-sucedida
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
      // PlantÃ£o extra sem escala â€” sÃ³ remove este
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
    alert('âœ… Link pÃºblico da sua agenda copiado!\n\nCole e envie no WhatsApp ou e-mail para que sua famÃ­lia veja seus prÃ³ximos plantÃµes.');
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const fetchExportPreview = async (mesNum: number, anoNum: number) => {
    setExportLoading(true);
    setExportPreview([]);
    try {
      const inicioMes = new Date(anoNum, mesNum - 1, 1).toISOString();
      const fimMes = new Date(anoNum, mesNum, 0, 23, 59, 59).toISOString();
      const { data } = await supabase
        .from('plantoes')
        .select('*, local:locais_trabalho(*)')
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado')
        .order('data_hora_inicio', { ascending: true });
      setExportPreview((data as PlantaoComLocal[]) || []);
    } catch (err) {
      console.error('[ExportPreview] Erro:', (err as Error)?.message);
    } finally {
      setExportLoading(false);
    }
  };

  const generateExportPDF = () => {
    if (!exportMes || exportPreview.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      const mesNome = MESES[exportMes - 1];

      // â”€â”€ CabeÃ§alho â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RelatÃ³rio de Escala MÃ©dica', margin, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${mesNome} ${exportAno}  â€¢  Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, 21);

      // â”€â”€ CabeÃ§alho da tabela â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      let y = 36;
      const colW = [8, contentW * 0.22, contentW * 0.30, contentW * 0.18, contentW * 0.18];
      const cols = ['', 'Local', 'Data', 'InÃ­cio', 'TÃ©rmino'];

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      let cx = margin + 2;
      cols.forEach((col, i) => {
        doc.text(col, cx, y + 5.5);
        cx += colW[i];
      });
      y += 8;

      // â”€â”€ Linhas da tabela â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      doc.setFont('helvetica', 'normal');
      exportPreview.forEach((p, idx) => {
        if (y > pageH - 30) {
          doc.addPage();
          y = 20;
        }
        // Fundo zebrado leve (sem cor de fundo colorido)
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentW, 8, 'F');
        }

        const cor = p.local?.cor_calendario ?? '#4f8ef7';
        const r = parseInt(cor.slice(1, 3), 16);
        const g = parseInt(cor.slice(3, 5), 16);
        const b = parseInt(cor.slice(5, 7), 16);

        // Dot colorido
        doc.setFillColor(r, g, b);
        doc.circle(margin + 3.5, y + 4, 2, 'F');

        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        cx = margin + colW[0] + 2;
        const nome = p.local?.nome ?? 'N/A';
        const dataStr = new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const inicio = new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const fim = new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const isExtra = p.is_extra ? ' (Extra)' : '';

        [nome + isExtra, dataStr, inicio, fim].forEach((val, i) => {
          doc.text(val, cx, y + 5.5, { maxWidth: colW[i + 1] - 3 });
          cx += colW[i + 1];
        });

        // Linha separadora
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 8, margin + contentW, y + 8);
        y += 8;
      });

      // â”€â”€ RodapÃ© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const footerY = pageH - 12;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, footerY, pageW - margin, footerY);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Gerado via Meu PlantÃ£o App  â€¢  meu-plantao-mvp.vercel.app', margin, footerY + 5);
      doc.text(`Total: ${exportPreview.length} plantÃ£o(oes)`, pageW - margin, footerY + 5, { align: 'right' });

      doc.save(`Escala_${mesNome}_${exportAno}.pdf`);
      setShowExportModal(false);
    } catch (err) {
      console.error('[GeneratePDF] Erro:', (err as Error)?.message);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
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
          <h1>CalendÃ¡rio ðŸ“…</h1>
          <p>
            Visualize seus plantÃµes â€” {loading && <span style={{ color: 'var(--accent-blue)', fontSize: 13 }}>âŸ³ Atualizando...</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={mesAnterior}>â†</button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
            {MESES[mes]} {ano}
          </span>
          <button className="btn btn-secondary" onClick={proximoMes}>â†’</button>
          
          <div style={{ position: 'relative' }}>
             <button onClick={() => setMenuAberto(!menuAberto)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                <MoreVertical size={20} />
             </button>
             {menuAberto && (
                 <div style={{ position: 'absolute', top: 45, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderRadius: 12, overflow: 'hidden', minWidth: 220, zIndex: 50 }}>
                     <button onClick={() => { setMenuAberto(false); alert('AbrirÃ¡ o modal financeiro'); }} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}>
                        ðŸ’° RelatÃ³rios de PlantÃµes Pro
                     </button>
                     <button
                       onClick={() => { setMenuAberto(false); setShowExportModal(true); }}
                       style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 700, display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)' }}
                     >
                       Compartilhar Escala Pro
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

      {/* Mini-lista da semana/mÃªs inteligente */}
      <div style={{ marginTop: 24, marginBottom: 80 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          PrÃ³ximos PlantÃµes ({MESES[mes]})
        </h2>
        {plantoes.filter(p => new Date(p.data_hora_inicio).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5).length === 0 ? (
          <div className="card">
             <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Nenhum plantÃ£o futuro para este mÃªs.</p>
          </div>
        ) : (
          <div className="shift-list">
            {plantoes.filter(p => new Date(p.data_hora_inicio).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5).map(p => (
              <div key={p.id} className="shift-item" onClick={() => setDiaSelecionado(new Date(p.data_hora_inicio).getDate())} style={{ cursor: 'pointer' }}>
                <div className="shift-color-bar" style={{ backgroundColor: (p as unknown as { is_extra?: boolean; status_conflito?: boolean }).is_extra ? '#8b5cf6' : (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7') }} />
                <div className="shift-info" style={{ flex: 1, padding: '4px 0' }}>
                  <div className="shift-local" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.local?.nome ?? 'Local nÃ£o informado'}
                    {(p as unknown as { is_extra?: boolean }).is_extra && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>ðŸ’° Extra</span>
                    )}
                  </div>
                  <div className="shift-time" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Calendar size={13} /> 
                    <span style={{ textTransform: 'capitalize' }}>
                      {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}
                    </span>
                    <Clock size={13} style={{ marginLeft: 6 }} /> 
                    {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} Ã s {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
              <p style={{ color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>ðŸŽ‰ Dia de folga livre! Nenhum plantÃ£o agendado para esta data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantoesNoDia(diaSelecionado).map(p => (
                  <div key={p.id} style={{ padding: 16, background: (p as unknown as { status_conflito?: boolean }).status_conflito ? 'rgba(245,158,11,0.06)' : 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 12, borderLeft: `4px solid ${ (p as unknown as { status_conflito?: boolean }).status_conflito ? '#f59e0b' : (p.local?.cor_calendario ?? '#4f8ef7')}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {p.local?.nome ?? 'Local Indefinido'}
                        {(p as unknown as { is_extra?: boolean }).is_extra && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 6px', borderRadius: 4 }}>ðŸ’° Extra</span>
                        )}
                        { (p as unknown as { status_conflito?: boolean }).status_conflito && (
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4 }}>âš ï¸ Conflito</span>
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
                          title="Remover PlantÃ£o"
                          style={{ padding: '6px 12px', fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Clock size={14} /> {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} Ã s {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {p.local?.endereco && !p.local?.is_home_care && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.local.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Abrir Rota no Mapa â†—
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de ExclusÃ£o com 3 opÃ§Ãµes */}
      {modalExclusao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setModalExclusao(null)}>
          <div className="card" style={{ maxWidth: 380, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Remover PlantÃ£o ðŸ—‘ï¸</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              <strong>{modalExclusao.local?.nome}</strong><br />
              {new Date(modalExclusao.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} Â· {new Date(modalExclusao.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}
                onClick={removerSomenteEste}
                disabled={excluindo}
              >
                ðŸ—‘ï¸ {modalExclusao.is_extra ? 'Remover PlantÃ£o' : 'Remover sÃ³ este plantÃ£o'}
              </button>
              {!modalExclusao.is_extra && modalExclusao.escala_id && (
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={removerEstEFuturos}
                  disabled={excluindo}
                >
                  âœ‚ï¸ Remover este e todos os futuros desta escala
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
               A regra antiga serÃ¡ <strong>preservada no histÃ³rico</strong>. 
               O novo ciclo entrarÃ¡ em vigor e recalcularÃ¡ os plantÃµes da nova data em diante.
             </p>

             <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Data de InÃ­cio da Nova Regra:</label>
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
                 style={{ width: '100%', marginBottom: isCustomCicloRule ? 12 : 24, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                   <option value="12x36">12h Trabalhadas / 36h Descanso</option>
                   <option value="24x48">24h Trabalhadas / 48h Descanso</option>
                   <option value="24x72">24h Trabalhadas / 72h Descanso</option>
                   <option value="Outro">Outro (Personalizado)</option>
              </select>
              {isCustomCicloRule && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', animation: 'fadeInDown 0.2s ease' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas Trabalhadas</label>
                    <input type="number" min="1" value={cicloHorasTrabalho} onChange={e => { setCicloHorasTrabalho(e.target.value); setEdicaoCiclo({...edicaoCiclo, regra: `${e.target.value}x${cicloHorasDescanso}`}); }} placeholder="Ex: 12" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Horas de Descanso</label>
                    <input type="number" min="1" value={cicloHorasDescanso} onChange={e => { setCicloHorasDescanso(e.target.value); setEdicaoCiclo({...edicaoCiclo, regra: `${cicloHorasTrabalho}x${e.target.value}`}); }} placeholder="Ex: 60" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }} />
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
                   disabled={salvandoCiclo || (isCustomCicloRule && (!(parseInt(cicloHorasTrabalho,10) > 0) || !(parseInt(cicloHorasDescanso,10) > 0)))}
                 >
                    {salvandoCiclo ? 'â³ Calculando...' : 'Aplicar Regra'}
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PRO PAYWALL - PDF */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>â­</span>
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

      {/* MODAL EXPORTAÃ‡ÃƒO PRO */}
      {showExportModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, transition: 'all 0.25s ease' }}
          onClick={() => !isExporting && setShowExportModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.3)', fontSize: 20 }}>ðŸ“„</div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Exportar Escala em PDF</h2>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RelatÃ³rio formal com tabela e cabeÃ§alho</span>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} disabled={isExporting} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 6 }}>âœ•</button>
            </div>

            {/* Seletores */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">MÃªs</label>
                  <select
                    className="form-select"
                    value={exportMes ?? ''}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setExportMes(v);
                      fetchExportPreview(v, exportAno);
                    }}
                    disabled={isExporting}
                  >
                    <option value="">Selecione o mÃªs...</option>
                    {MESES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ano</label>
                  <select
                    className="form-select"
                    value={exportAno}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setExportAno(v);
                      if (exportMes) fetchExportPreview(exportMes, v);
                    }}
                    disabled={isExporting}
                  >
                    {[2024, 2025, 2026, 2027].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {!exportMes ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  Selecione o mÃªs para visualizar a prÃ©via
                </div>
              ) : exportLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />
                  ))}
                </div>
              ) : exportPreview.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  Nenhum plantÃ£o encontrado neste mÃªs.
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
                    PRÃ‰VIA â€” {exportPreview.length} plantÃ£o(Ãµes) encontrado(s)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(241,245,249,0.5)' }}>
                        {['Local', 'Data', 'InÃ­cio', 'TÃ©rmino'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exportPreview.map((p, i) => {
                        const cor = p.local?.cor_calendario ?? '#4f8ef7';
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.4)' }}>
                            <td style={{ padding: '9px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.local?.nome ?? 'N/A'}{p.is_extra ? ' â˜…' : ''}</span>
                            </td>
                            <td style={{ padding: '9px 10px', color: 'var(--text-secondary)' }}>
                              {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </td>
                            <td style={{ padding: '9px 10px', color: 'var(--text-secondary)' }}>
                              {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '9px 10px', color: 'var(--text-secondary)' }}>
                              {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RodapÃ© com botÃµes */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12, flexShrink: 0 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowExportModal(false)} disabled={isExporting}>
                Cancelar
              </button>
              <button
                onClick={generateExportPDF}
                disabled={!exportMes || exportPreview.length === 0 || exportLoading || isExporting}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  background: (!exportMes || exportPreview.length === 0 || exportLoading)
                    ? 'var(--bg-secondary)'
                    : 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                  color: (!exportMes || exportPreview.length === 0 || exportLoading)
                    ? 'var(--text-muted)'
                    : '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  cursor: (!exportMes || exportPreview.length === 0 || exportLoading || isExporting) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isExporting ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Gerando PDF...
                  </>
                ) : 'Baixar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
