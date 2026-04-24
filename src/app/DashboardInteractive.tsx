'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Share2, FileText, Copy, X, Send, Calendar as CalendarIcon, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';

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

export function ShareAgendaButton({ proximos }: { proximos: any[] }) {
  const [showModal, setShowModal] = useState(false);

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
    return "Minha escala de plantões:\n" + proximos.map(p => {
      const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
      return `${localObj?.nome || 'Local'}: ${getFullShiftInfo(p)}`;
    }).join('\n');
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
      const margin = 15;
      
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
      doc.setTextColor(30, 41, 59);

      proximos.forEach((p, i) => {
        const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
        const info = getFullShiftInfo(p);
        
        // Linha decorativa lateral
        doc.setFillColor(localObj?.cor_calendario || '#2563eb');
        doc.rect(margin, y - 5, 2, 14, 'F');

        doc.setFont('helvetica', 'bold');
        doc.text(`${localObj?.nome || 'Local de Trabalho'}`, margin + 6, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${info}`, margin + 6, y + 6);
        
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        y += 22;

        if (y > 250) {
          doc.addPage();
          y = 20;
        }
      });

      // Rodapé Branding Viral
      const footerY = 280;
      doc.setFillColor(239, 246, 255); // Blue-50
      doc.rect(0, footerY - 5, pageW, 25, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text('🚀 Escala gerada gratuitamente pelo app Meu Plantão.', pageW / 2, footerY + 5, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Organize a sua também em meuplantao.com.br', pageW / 2, footerY + 11, { align: 'center' });

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
              padding: '0 24px 24px 24px',
              maxHeight: 380,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {proximos.length > 0 ? proximos.map((p, idx) => {
                  const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
                  const hour = new Date(p.data_hora_inicio).getHours();
                  const isNight = hour >= 19 || hour < 5;
                  
                  return (
                    <div key={p.id} style={{ 
                      background: 'var(--bg-secondary)', 
                      padding: 16, 
                      borderRadius: 18, 
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: localObj?.cor_calendario || '#2563eb' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{localObj?.nome || 'Local'}</span>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 700, 
                          padding: '4px 8px', 
                          borderRadius: 8, 
                          background: isNight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: isNight ? '#8b5cf6' : '#d97706'
                        }}>
                          {isNight ? '🌙 Noturno' : '☀️ Diurno'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <CalendarIcon size={14} color="var(--accent-blue)" />
                          {formatRelativeShiftDate(p.data_hora_inicio).split(' • ')[0]}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <Clock size={14} color="var(--accent-blue)" />
                          {formatBRTTime(p.data_hora_inicio)} às {formatBRTTime(p.data_hora_fim || new Date(new Date(p.data_hora_inicio).getTime() + 12 * 60 * 60 * 1000).toISOString())}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Nenhum plantão agendado.</p>
                )}
              </div>
            </div>

            <div style={{ padding: 24, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleDirectShare} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 16, fontSize: 15, background: 'var(--accent-blue)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                  <Send size={18} /> Compartilhar no WhatsApp
                </button>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={handleCopy} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, fontSize: 13, background: 'var(--bg-primary)' }}>
                    <Copy size={16} /> Copiar Texto
                  </button>
                  <button onClick={handleExportPDF} className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, fontSize: 13, background: 'var(--bg-primary)' }}>
                    <FileText size={16} /> Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
