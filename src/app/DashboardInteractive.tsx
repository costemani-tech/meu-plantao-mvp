'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Share2, FileText, Copy, X, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import { formatRelativeShiftDate } from '../lib/date-utils';

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

  const getShareText = () => {
    if (!proximos || proximos.length === 0) return "";
    return "Minha escala de plantões:\n" + proximos.map(p => {
      const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
      const dataFormatada = formatRelativeShiftDate(p.data_hora_inicio).replace('•', '-');
      return `${localObj?.nome || 'Local'}: ${dataFormatada}`;
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
      
      // Cabeçalho
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 25, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Próximos Plantões', margin, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, 19);

      let y = 35;
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      proximos.forEach((p, i) => {
        const localObj = Array.isArray(p.local) ? p.local[0] : p.local;
        const dataStr = formatRelativeShiftDate(p.data_hora_inicio).replace('•', '-');
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${localObj?.nome || 'Local de Trabalho'}`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${dataStr}`, margin, y + 6);
        
        y += 15;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`Escala_Proximos_Plantoes.pdf`);
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Prévia da Escala</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: 16, 
              borderRadius: 16, 
              border: '1px solid var(--border-subtle)',
              marginBottom: 24,
              maxHeight: 250,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              {getShareText() || "Nenhum plantão agendado."}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleDirectShare} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 }}>
                <Send size={18} /> Compartilhar Direto
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
          </div>
        </div>
      )}
    </>
  );
}
