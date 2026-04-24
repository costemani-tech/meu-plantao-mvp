'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Share2, FileText, Copy, X, Send, Calendar as CalendarIcon, Clock, Image as ImageIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import { toBlob } from 'html-to-image';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { ShareableScheduleCard } from '../components/ShareableScheduleCard';

export function DashboardInteractive({ isPro, hasLocations = true }: { isPro: boolean, hasLocations?: boolean }) {
  const [showProModal, setShowProModal] = useState('');
  const router = useRouter();

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

      {/* SEÇÃO PRO - DESTAQUES (Paywall PLG) */}
      {!isPro && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', 
          border: '1px solid #FDE68A', 
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: 0 }}>Vantagens do Plano Pro</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Relatórios financeiros detalhados
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Exportação de escala em PDF oficial
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ✅ Edição ilimitada de ciclos customizados
            </li>
          </ul>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', background: '#d97706', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800 }}
            onClick={() => setShowProModal('Assinatura')}
          >
            Assinar Pro ⭐
          </button>
        </div>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', borderRadius: '24px' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Desbloqueie recursos exclusivos como controle financeiro, exportação de escala em PDF e locais ilimitados.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }} onClick={() => setShowProModal('')}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', borderRadius: '12px', fontWeight: 700 }} onClick={() => setShowProModal('')}>Assinar Pro</button>
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

      {/* MODAL PRO PAYWALL - Duplicated for simplicity but could be hoisted */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', borderRadius: '24px' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Desbloqueie recursos exclusivos como controle financeiro, exportação de escala em PDF e locais ilimitados.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }} onClick={() => setShowProModal('')}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', borderRadius: '12px', fontWeight: 700 }} onClick={() => setShowProModal('')}>Assinar Pro</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ShareAgendaButton({ proximos, userName, totalGanhos, isPro }: { proximos: any[], userName: string, totalGanhos: number, isPro: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShareImage = async () => {
    if (!cardRef.current) return;

    try {
      setIsGeneratingImage(true);

      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        style: {
          transform: 'scale(1)', // Ensure correct scaling
        }
      });

      if (!blob) throw new Error('Falha ao gerar a imagem');

      const file = new File([blob], 'minha-escala.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meu Plantão',
          text: 'Confira minha escala de plantões!',
          files: [file],
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'minha-escala.png';
        a.click();
        URL.revokeObjectURL(url);
        alert('Imagem baixada! O compartilhamento direto de imagens não é suportado no seu navegador.');
      }
    } catch (err) {
      console.error('Erro ao gerar/compartilhar imagem:', err);
      alert('Houve um erro ao gerar a imagem da sua escala.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getShiftType = (startTime: string) => {
    const hour = new Date(startTime).getHours();
    return (hour >= 19 || hour < 5) ? "Plantão Noturno" : "Plantão Diurno";
  };

  const getFullShiftInfo = (p: any) => {
    const start = formatBRTTime(p.data_hora_inicio);
    const end = formatBRTTime(p.data_hora_fim || new Date(new Date(p.data_hora_inicio).getTime() + 12 * 60 * 60 * 1000).toISOString());
    const dateStr = formatRelativeShiftDate(p.data_hora_inicio).split(' • ')[0];
    const type = getShiftType(p.data_hora_inicio);
    return `${dateStr} • ${start} às ${end} • ${type}`;
  };

  const getShareText = () => {
    if (!proximos || proximos.length === 0) return "";
    const list = proximos.map(p => {
      const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
      return `${localObj?.nome || 'Local'}: ${getFullShiftInfo(p)}`;
    }).join('\n');

    if (isPro) return "Minha escala de plantões:\n" + list;

    return `Minha escala de plantões:\n${list}\n\n🚀 Escala gerada gratuitamente pelo app Meu Plantão. Organize a sua também em meuplantao.com.br`;
  };

  const handleCopy = async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      alert('Escala copiada!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDirectShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleExportPDF = () => {
    if (!proximos || proximos.length === 0) return;
    
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Fundo Claro (Tema Unificado)
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(0, 0, pageW, pageH, 'F');
      
      // Cabeçalho Premium Azul
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Meu Plantão', margin, 16);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(191, 219, 254); // Blue-200
      doc.text(`Próximos Plantões  •  Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, 23);

      let y = 45;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // Slate-800

      proximos.forEach((p, i) => {
        const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
        const info = getFullShiftInfo(p);
        
        // Card Background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin - 2, y - 8, pageW - (margin * 2) + 4, 18, 2, 2, 'F');
        
        // Linha decorativa lateral
        doc.setFillColor(localObj?.cor_calendario || '#2563eb');
        doc.rect(margin, y - 8, 1.5, 18, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${localObj?.nome || 'Local de Trabalho'}`, margin + 6, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(`${info}`, margin + 6, y + 6);
        
        y += 25;

        if (y > 250) {
          doc.addPage();
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 0, pageW, pageH, 'F');
          y = 20;
        }
      });

      // Rodapé Branding (Condicional)
      const footerY = 280;
      if (!isPro) {
        doc.setFillColor(239, 246, 255); // Blue-50
        doc.rect(0, footerY - 12, pageW, 32, 'F');
        doc.setDrawColor(219, 234, 254); // Blue-100
        doc.line(0, footerY - 12, pageW, footerY - 12);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138); // Blue-800
        doc.text('🚀 Escala gerada gratuitamente pelo app Meu Plantão.', pageW / 2, footerY - 2, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.text('Organize a sua também pelo nosso aplicativo!', pageW / 2, footerY + 5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Acesse meuplantao.com.br', pageW / 2, footerY + 11, { align: 'center' });
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('Gerado por meuplantao.com.br', pageW / 2, footerY + 5, { align: 'center' });
      }

      doc.save(`Escala_Meu_Plantao.pdf`);
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro ao gerar PDF.');
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--accent-blue)', 
          fontSize: '12px', 
          fontWeight: 700, 
          cursor: 'pointer', 
          padding: 0,
        }}
      >
        [ Compartilhar ]
      </button>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px 24px' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Prévia da Escala</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Confira seus próximos plantões</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              padding: '0 12px 24px 12px',
              maxHeight: 420,
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              background: 'var(--bg-primary)'
            }}>
              <div style={{ 
                transform: 'scale(0.85)', 
                transformOrigin: 'top center',
                marginBottom: -60 // Compensate for scale shrinkage
              }}>
                <ShareableScheduleCard
                  userName={userName}
                  monthYear={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  shifts={proximos}
                  totalGanhos={totalGanhos}
                  isPro={isPro}
                />
              </div>
            </div>

            <div style={{ padding: 24, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleShareImage} disabled={isGeneratingImage} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'linear-gradient(to right, #1d4ed8, #3b82f6)' }}>
                  <ImageIcon size={18} /> {isGeneratingImage ? 'Gerando...' : (isPro ? 'Compartilhar Imagem PRO' : 'Compartilhar Imagem')}
                </button>

                <button onClick={handleDirectShare} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 }}>
                  <Send size={18} /> Compartilhar Texto Direto
                </button>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={handleCopy} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, fontSize: 13 }}>
                    <Copy size={16} /> Copiar Texto
                  </button>
                  <button onClick={handleExportPDF} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, fontSize: 13 }}>
                    <FileText size={16} /> Gerar PDF
                  </button>
                </div>
              </div>

              {/* Hidden Component for Image Generation */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <ShareableScheduleCard
                  ref={cardRef}
                  userName={userName}
                  monthYear={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  shifts={proximos}
                  totalGanhos={totalGanhos}
                  isPro={isPro}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
