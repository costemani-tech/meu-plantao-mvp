'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toBlob, toCanvas } from 'html-to-image';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { ShareableScheduleCard } from './ShareableScheduleCard';
import { supabase } from '../lib/supabase';

interface ShareAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShifts: any[];
  userName: string;
  initialTotalGanhos: number;
  isPro: boolean;
}

export function ShareAgendaModal({ 
  isOpen, 
  onClose, 
  initialShifts, 
  userName, 
  initialTotalGanhos, 
  isPro 
}: ShareAgendaModalProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideFinance, setHideFinance] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Navegação de Mês
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState(initialShifts);
  const [totalGanhos, setTotalGanhos] = useState(initialTotalGanhos);

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
    if (isOpen) {
      fetchMonthShifts(currentDate);
    }
  }, [currentDate, isOpen]);

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

  const handleExportPDF = async () => {
    if (!cardRef.current || !shifts || shifts.length === 0) return;
    try {
      setLoading(true);
      const canvas = await toCanvas(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#f8fafc' 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190; 
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; 

      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20); 

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

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'cardEntrance 0.3s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px 24px' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Prévia da Escala</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Escolha o mês e compartilhe sua agenda</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  );
}
