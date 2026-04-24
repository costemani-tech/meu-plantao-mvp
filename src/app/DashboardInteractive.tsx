'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Share2, FileText, Copy, X, Send, Calendar as CalendarIcon, Clock, Image as ImageIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import { toBlob } from 'html-to-image';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { ShareableScheduleCard } from '../components/ShareableScheduleCard';

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

    return `Minha escala de plantões:\n${list}\n\nEscala gerada gratuitamente pelo app Meu Plantão. Organize a sua também em meuplantao.com.br`;
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
      
      // Fundo Suave (Slate-50)
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, pageH, 'F');
      
      // Cabeçalho Clean SaaS
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(0, 40, pageW, 40); // Divisória sutil

      // Logo Simulation (Ícone Blue + Texto Dark)
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.roundedRect(margin, 12, 10, 10, 2, 2, 'F');
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('Meu Plantão', margin + 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Sua agenda organizada e seus plantões sob controle', margin + 14, 26);

      let y = 55;
      
      // Identificação
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(userName, margin, y);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const monthStr = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      doc.text(monthStr, pageW - margin, y, { align: 'right' });
      
      y += 12;

      proximos.forEach((p, i) => {
        const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
        const info = getFullShiftInfo(p);
        
        // Card Background SaaS
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.roundedRect(margin, y - 8, pageW - (margin * 2), 22, 3, 3, 'FD');
        
        // Linha decorativa lateral (Accent)
        doc.setFillColor(localObj?.cor_calendario || '#2563eb');
        doc.rect(margin, y - 8, 1.5, 22, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.setFontSize(12);
        doc.text(`${localObj?.nome || 'Local de Trabalho'}`, margin + 6, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // Slate-700
        doc.text(`${info}`, margin + 6, y + 8);
        
        y += 30;

        if (y > 240) {
          doc.addPage();
          // Repetir Fundo e Cabeçalho Simplificado
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 0, pageW, pageH, 'F');
          y = 20;
        }
      });

      // Rodapé SaaS (Free Banner)
      const footerY = 270;
      if (!isPro) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.rect(0, footerY - 10, pageW, 30, 'F');
        doc.line(0, footerY - 10, pageW, footerY - 10);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text('Escala gerada gratuitamente pelo app Meu Plantão.', pageW / 2, footerY, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('Organize a sua também e tenha controle total em:', pageW / 2, footerY + 6, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.text('meuplantao.com.br', pageW / 2, footerY + 12, { align: 'center' });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('Gerado por meuplantao.com.br', pageW / 2, footerY + 10, { align: 'center' });
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
              padding: '0 8px 24px 8px',
              maxHeight: 400,
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              overflowX: 'hidden'
            }}>
              <div style={{ 
                transform: 'scale(0.78)', 
                transformOrigin: 'top center',
                marginBottom: -100,
                width: '400px'
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
                {isPro && (
                  <>
                    <button onClick={handleShareImage} disabled={isGeneratingImage} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'linear-gradient(to right, #1d4ed8, #3b82f6)' }}>
                      <ImageIcon size={18} /> {isGeneratingImage ? 'Gerando...' : 'Compartilhar Imagem PRO'}
                    </button>

                    <button onClick={handleDirectShare} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 }}>
                      <Send size={18} /> Compartilhar Texto Direto
                    </button>
                  </>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: isPro ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {!isPro && (
                    <button onClick={handleExportPDF} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'linear-gradient(to right, #1d4ed8, #3b82f6)' }}>
                      <FileText size={18} /> Gerar PDF Grátis
                    </button>
                  )}
                  {isPro && (
                    <>
                      <button onClick={handleCopy} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, fontSize: 13 }}>
                        <Copy size={16} /> Copiar Texto
                      </button>
                      <button onClick={handleExportPDF} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, fontSize: 13 }}>
                        <FileText size={16} /> Gerar PDF
                      </button>
                    </>
                  )}
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
      )}
    </>
  );
}
