'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, Plantao, LocalTrabalho } from '../../lib/supabase';
import { ReportTemplate } from '../../components/ReportTemplate';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PlantaoComLocal extends Plantao {
  local?: LocalTrabalho;
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardPage() {
  const router = useRouter();
  const [plantoes, setPlantoes] = useState<PlantaoComLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const reportRef = useRef<HTMLDivElement>(null);

  // MOCK PAYWALL (mudar para query ao DB quando tiver auth pro full)
  const isPro = false;

  const fetchPlantoes = useCallback(async () => {
    // OFFLINE FIRST
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

  useEffect(() => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    fetchPlantoes();
  }, [fetchPlantoes, isPro]);

  const exportPDF = async () => {
    if (!reportRef.current || !isPro) return;
    setGerandoPdf(true);
    try {
      await new Promise(r => setTimeout(r, 100)); // Render tick
      
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true,
        onclone: (documentClone) => {
          const el = documentClone.getElementById('report-template-container');
          if (el) {
            el.style.width = '800px';
            el.style.maxWidth = '800px';
            el.style.minHeight = '1131px';
            el.style.padding = '40px'; 
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`meu-plantao-${MESES[mes].toLowerCase()}-${ano}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
      alert('Houve um problema ao gerar o PDF. Verifique sua conexão e tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  if (showProModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⭐</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Upgrade para o Pro</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            Tenha acesso ao Dashboard exclusivo de Produtividade em PDF.<br/>
            Veja em R$ e horas reais o tamanho do seu esforço.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => router.push('/')}>Voltar à Home</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none' }} onClick={() => router.push('/')}>Assinar Pro</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-secondary)' }}>
      {/* HEADER DE NAVEGAÇÃO */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => router.back()}
            style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Métricas</h2>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={exportPDF} 
          disabled={gerandoPdf}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
        >
          {gerandoPdf ? '⏳ Gerando...' : '📥 Exportar PDF'}
        </button>
      </div>

      {/* CONTROLES DE MÊS */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '20px 0', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button className="btn btn-secondary" onClick={() => { setMes(prev => prev === 0 ? 11 : prev - 1); setAno(prev => mes === 0 ? prev - 1 : prev); }} style={{ padding: 8 }}>
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
          {MESES[mes]} {ano}
        </span>
        <button className="btn btn-secondary" onClick={() => { setMes(prev => prev === 11 ? 0 : prev + 1); setAno(prev => mes === 11 ? prev + 1 : prev); }} style={{ padding: 8 }}>
          <ChevronRight />
        </button>
      </div>

      {/* DASHBOARD ROLÁVEL */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--accent-blue)' }}>⟳ Carregando Métricas...</div>
        ) : (
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '80px', background: '#fff' }}>
            <ReportTemplate ref={reportRef} plantoes={plantoes} mesNome={MESES[mes]} ano={ano} />
          </div>
        )}
      </div>
    </div>
  );
}
