'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Star, 
  Share2, 
  FileText, 
  Copy, 
  X, 
  Send, 
  Calendar as CalendarIcon, 
  Clock, 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronLeft,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { toBlob, toCanvas } from 'html-to-image';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { ShareableScheduleCard } from '../components/ShareableScheduleCard';
import { supabase } from '../lib/supabase';

// Sub-componente Cliente: Controle de Privacidade dos Ganhos
export function EarningsPrivacyWrapper({ total, isPro }: { total: number, isPro: boolean }) {
  const [hidden, setHidden] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('meu_plantao_privacy') === 'true';
    setHidden(saved);
    setMounted(true);
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newVal = !hidden;
    setHidden(newVal);
    localStorage.setItem('meu_plantao_privacy', String(newVal));
  };

  if (!mounted) return <div style={{ height: 40 }} />;

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: 10
      }}>
         <button 
           onClick={toggle}
           style={{ 
             background: 'rgba(255,255,255,0.08)', 
             border: '1px solid var(--border-subtle)', 
             cursor: 'pointer', 
             color: 'var(--text-muted)', 
             padding: '6px 12px', 
             borderRadius: 14, 
             display: 'flex', 
             alignItems: 'center', 
             gap: 6, 
             fontSize: 11, 
             fontWeight: 700, 
             transition: 'all 0.2s' 
           }}
         >
           {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
           {hidden ? 'Mostrar Saldo' : 'Ocultar Saldo'}
         </button>
      </div>

      {isPro ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Extras do mês</div>
          {total > 0 ? (
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s' }}>
              💰 <span style={{ filter: hidden ? 'blur(8px)' : 'none' }}>
                {hidden ? 'R$ 0.000,00' : total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                💰 Nenhum extra
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            💰 Ver meus ganhos reais
          </div>
          <DesbloquearGanhosBtn />
        </div>
      )}
    </div>
  );
}

export function DashboardInteractive({ isPro, hasLocations = true }: { isPro: boolean, hasLocations?: boolean }) {
  const [showProModal, setShowProModal] = useState('');
  const router = useRouter();

  // Auto-open Paywall para usuários Free
  useEffect(() => {
    if (!isPro) {
      setShowProModal('Onload');
    }
  }, [isPro]);

  const handleFabClick = () => {
    if (!hasLocations) {
      alert("Ops! Primeiro você precisa cadastrar um Hospital ou Clínica em 'Início'.");
      return;
    }
    router.push('/plantao-extra');
  };

  return (
    <>
      {/* FAB - FLOATING ACTION BUTTON */}
      <button 
        className="fab"
        onClick={handleFabClick}
        title="Adicionar Plantão"
      >
        <Plus size={28} />
      </button>

      {/* SEÇÃO PRO - BANNER PREMIUM SaaS (Redesign Clean) */}
      {!isPro && (
        <div className="card" style={{ 
          background: '#ffffff', 
          border: '1px solid #dbeafe', // blue-100
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: 32,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#001a41', margin: '0 0 4px 0' }}>
            💎 Leve seu controle para outro nível
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px 0', fontWeight: 500 }}>
            Desbloqueie a previsão financeira, relatórios em PDF e controle ilimitado.
          </p>
          
          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', justifyContent: 'center', 
              background: 'linear-gradient(to right, #2563eb, #1e40af)', 
              border: 'none', padding: '16px', borderRadius: '14px', 
              fontWeight: 900, fontSize: 15,
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}
            onClick={() => setShowProModal('Banner')}
          >
            🚀 Assinar PRO
          </button>
        </div>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {/* Background Watermark Identidade */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'url(/icons/capa.jpeg), rgba(0,0,0,0.4)', 
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay',
            opacity: 0.15, zIndex: -1 
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} />

          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: '32px', padding: '40px 32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            {/* Logo Logo */}
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>
            
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#001a41', lineHeight: 1.2 }}>
              💎 Leve seu controle para outro nível
            </h2>

            {/* Minicards de Benefícios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {[
                { icon: '💰', title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                { icon: '📄', title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                { icon: '⚡', title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
              ].map((b, i) => (
                <div key={i} style={{ 
                  background: '#eff6ff', // blue-50
                  padding: '16px',
                  borderRadius: '16px',
                  borderLeft: '4px solid #3b82f6', // blue-500
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e3a8a' }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 24, lineHeight: 1.4 }}>
              🚀 Usado por profissionais para organizar plantões com mais controle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', justifyContent: 'center', 
                  background: 'linear-gradient(to right, #2563eb, #1e40af)', 
                  border: 'none', borderRadius: '100px', 
                  padding: '18px', fontSize: 16, fontWeight: 900,
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                }} 
                onClick={() => setShowProModal('')}
              >
                🚀 Desbloquear agora
              </button>
              
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
                onClick={() => setShowProModal('')}
              >
                Talvez mais tarde
              </button>
            </div>

            <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              Acesso imediato a todas as funcionalidades.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DesbloquearGanhosBtn() {
  const [showProModal, setShowProModal] = useState('');

  return (
    <>
      <button 
        className="btn btn-primary" 
        onClick={() => setShowProModal('Ganhos')}
        style={{ 
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
          border: 'none', 
          padding: '12px 24px', 
          fontSize: 14,
          fontWeight: 800,
          borderRadius: 14,
          boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
          width: 'fit-content'
        }}
      >
        [ Desbloquear ganhos 💰 ]
      </button>

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {/* Background Watermark Identidade */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'url(/icons/capa.jpeg), rgba(0,0,0,0.4)', 
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay',
            opacity: 0.15, zIndex: -1 
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} />

          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: '32px', padding: '40px 32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            {/* Logo Logo */}
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>
            
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#001a41', lineHeight: 1.2 }}>
              💎 Leve seu controle para outro nível
            </h2>

            {/* Minicards de Benefícios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {[
                { icon: '💰', title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                { icon: '📄', title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                { icon: '⚡', title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
              ].map((b, i) => (
                <div key={i} style={{ 
                  background: '#eff6ff', // blue-50
                  padding: '16px',
                  borderRadius: '16px',
                  borderLeft: '4px solid #3b82f6', // blue-500
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e3a8a' }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 24, lineHeight: 1.4 }}>
              🚀 Usado por profissionais para organizar plantões com mais controle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', justifyContent: 'center', 
                  background: 'linear-gradient(to right, #2563eb, #1e40af)', 
                  border: 'none', borderRadius: '100px', 
                  padding: '18px', fontSize: 16, fontWeight: 900,
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                }} 
                onClick={() => setShowProModal('')}
              >
                🚀 Desbloquear agora
              </button>
              
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
                onClick={() => setShowProModal('')}
              >
                Talvez mais tarde
              </button>
            </div>

            <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              Acesso imediato a todas as funcionalidades.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ShareAgendaButton({ proximos: initialProximos, userName, totalGanhos: initialTotal, isPro }: { proximos: any[], userName: string, totalGanhos: number, isPro: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideFinance, setHideFinance] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Navegação de Mês
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState(initialProximos);
  const [totalGanhos, setTotalGanhos] = useState(initialTotal);

  const fetchMonthShifts = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const inicioMes = new Date(year, month, 1).toISOString();
      const fimMes = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('plantoes')
        .select('id, data_hora_inicio, data_hora_fim, local:locais_trabalho(nome, cor_calendario), notas')
        .eq('usuario_id', user.id)
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .neq('status', 'Cancelado')
        .order('data_hora_inicio', { ascending: true });

      const newShifts = data || [];
      setShifts(newShifts);

      // Recalcular Ganhos
      const total = newShifts.reduce((acc, p) => {
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

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchMonthShifts(currentDate);
    }
  }, [currentDate, showModal]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGeneratingImage(true);
      const blob = await toBlob(cardRef.current, { cacheBust: true, style: { transform: 'scale(1)' } });
      if (!blob) throw new Error('Falha');
      const file = new File([blob], 'minha-escala.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Meu Plantão', files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Escala_${currentDate.toLocaleDateString('pt-BR', { month: 'short' })}.png`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getFullShiftInfo = (p: any) => {
    const start = formatBRTTime(p.data_hora_inicio);
    const end = formatBRTTime(p.data_hora_fim || new Date(new Date(p.data_hora_inicio).getTime() + 12 * 60 * 60 * 1000).toISOString());
    const dateStr = formatRelativeShiftDate(p.data_hora_inicio).split(' • ')[0];
    const hour = new Date(p.data_hora_inicio).getHours();
    const type = (hour >= 19 || hour < 5) ? "Plantão Noturno" : "Plantão Diurno";
    return `${dateStr} • ${start} às ${end} • ${type}`;
  };

  const handleExportPDF = async () => {
    if (!cardRef.current || !shifts || shifts.length === 0) return;
    try {
      setLoading(true);
      // Captura o componente como Canvas para garantir paridade visual total
      const canvas = await toCanvas(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#f8fafc' // bg-slate-50
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190; // largura útil no A4 (210mm - margens)
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Margem inicial superior

      // Adiciona a primeira página
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20); // desconta margens top/bottom

      // Adiciona páginas extras se o conteúdo for longo (Paginação Automática)
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const monthStr = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      doc.save(`Escala_Meu_Plantao_${monthStr}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
        [ Compartilhar ]
      </button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px 24px' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Prévia da Escala</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Escolha o mês e compartilhe sua agenda</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* SELETOR DE MÊS PREMIUM */}
            <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                 <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: 8 }}><ChevronLeft size={20} /></button>
                 <div style={{ fontWeight: 800, fontSize: 15, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                   {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                 </div>
                 <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: 8 }}><ChevronRight size={20} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                 <button 
                   onClick={() => setCurrentDate(new Date())}
                   style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                 >
                   Voltar para o Mês Atual
                 </button>
              </div>
            </div>

            <div style={{ padding: '0 8px 24px 8px', maxHeight: 380, overflowY: 'auto', display: 'flex', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative' }}>
              {loading ? (
                <div style={{ width: '400px', transform: 'scale(0.78)', transformOrigin: 'top center', opacity: 0.6 }}>
                   <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
                   <div className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />
                   <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                </div>
              ) : (
                <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center', marginBottom: -100, width: '400px' }}>
                  <ShareableScheduleCard
                    userName={userName}
                    monthYear={currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    shifts={shifts}
                    totalGanhos={totalGanhos}
                    isPro={isPro}
                    hideValues={hideFinance}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: 24, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isPro && (
                  <div 
                    onClick={() => setHideFinance(!hideFinance)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 16, 
                      border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {hideFinance ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--accent-teal)" />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Ocultar ganhos</span>
                    </div>
                    <div 
                      style={{ 
                        width: 44, height: 24, borderRadius: 20, 
                        background: hideFinance ? 'var(--accent-blue)' : 'var(--bg-tertiary)', 
                        border: 'none', position: 'relative', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: hideFinance ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.2s' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {isPro && (
                    <button onClick={handleShareImage} disabled={isGeneratingImage || loading} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 14, background: 'linear-gradient(to right, #1d4ed8, #3b82f6)', width: '100%' }}>
                      <ImageIcon size={20} /> {isGeneratingImage ? 'Gerando...' : 'Compartilhar Imagem PRO'}
                    </button>
                  )}
                  <button 
                    onClick={handleExportPDF} 
                    disabled={shifts.length === 0 || loading}
                    className={isPro ? "btn btn-secondary" : "btn btn-primary"} 
                    style={{ 
                      justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 14, 
                      width: '100%', 
                      background: !isPro ? 'linear-gradient(to right, #1d4ed8, #3b82f6)' : 'var(--bg-primary)',
                      border: isPro ? '1px solid var(--border-subtle)' : 'none',
                      opacity: shifts.length === 0 ? 0.5 : 1
                    }}
                  >
                    <FileText size={20} /> {isPro ? 'Gerar PDF' : 'Gerar PDF Grátis'}
                  </button>
                </div>
            </div>

            {/* Hidden Component for Image Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ShareableScheduleCard
                ref={cardRef}
                userName={userName}
                monthYear={currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                shifts={shifts}
                totalGanhos={totalGanhos}
                isPro={isPro}
                hideValues={hideFinance}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// NOVO: Componente Cliente para os Próximos Plantões (com Interatividade)
export function UpcomingShiftsClient({ proximos, isPro, userName, totalGanhos }: { proximos: any[], isPro: boolean, userName: string, totalGanhos: number }) {
  const router = useRouter();

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Próximos Plantões
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Link href="/calendario" style={{ textDecoration: 'none' }}>
            <span style={{ color: 'var(--accent-blue)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              [ Ver agenda ]
            </span>
          </Link>
          <ShareAgendaButton proximos={proximos || []} userName={userName} totalGanhos={totalGanhos} isPro={isPro} />
        </div>
      </div>

      {(!proximos || proximos.length === 0) ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Nenhum plantão agendado para os próximos dias.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {proximos.map(p => {
            const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
            return (
              <div 
                key={p.id} 
                onClick={() => router.push('/calendario')} // Redireciona para o calendário (onde o modal de edição existe)
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <div className="shift-item" style={{ 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  transition: 'transform 0.1s'
                }}>
                  <div className="shift-color-bar" style={{ 
                    backgroundColor: localObj?.cor_calendario || 'var(--accent-blue)', 
                    width: '6px', 
                    height: '64px', 
                    borderRadius: '16px 0 0 16px' 
                  }} />
                  <div className="shift-info" style={{ padding: '16px', flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {localObj?.nome || 'Local de Trabalho'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <CalendarIcon size={13} />
                      <span style={{ textTransform: 'capitalize' }}>
                        {formatRelativeShiftDate(p.data_hora_inicio)}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
