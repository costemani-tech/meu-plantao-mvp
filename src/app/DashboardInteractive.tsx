'use client';
import { toast } from 'sonner';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp,
  Activity,
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
  MoreVertical,
  Rocket,
  Sparkles,
  CheckCircle2,
  Timer,
  Zap,
  Lock,
  BarChart3,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { toBlob, toCanvas } from 'html-to-image';
import { formatRelativeShiftDate, formatBRTTime } from '../lib/date-utils';
import { ShareableScheduleCard } from '../components/ShareableScheduleCard';
import { ShareAgendaModal } from '../components/ShareAgendaModal';
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

  const onUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      {isPro && (
        <button 
          onClick={toggle}
          style={{ 
            position: 'absolute',
            top: -38,
            right: 0,
            background: 'rgba(255,255,255,0.06)', 
            border: '1px solid var(--border-subtle)', 
            cursor: 'pointer', 
            color: 'var(--text-muted)', 
            padding: '6px 14px', 
            borderRadius: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: 12, 
            fontWeight: 700, 
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
          {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          {hidden ? 'Mostrar' : 'Ocultar'}
        </button>
      )}

      {isPro ? (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>Extras do mês</div>
          {total > 0 ? (
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s' }}>
              <DollarSign size={20} /> <span style={{ filter: hidden ? 'blur(8px)' : 'none' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum valor extra registrado.</div>
          )}
        </div>
      ) : (
        <div 
          onClick={onUpgradeClick}
          style={{ 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.02) 100%)', 
            padding: '20px', 
            borderRadius: '1.5rem', 
            border: '1px solid rgba(37,99,235,0.15)', 
            marginTop: 8,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Lock size={16} className="text-blue-500" />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Previsão Financeira</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Assine o plano PRO para ver o cálculo automático dos seus ganhos do mês.
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardInteractive({ isPro, hasLocations }: { isPro: boolean, hasLocations: boolean }) {
  const router = useRouter();

  // Auto-open Paywall para usuários Free com delay para suavidade
  useEffect(() => {
    if (!isPro) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPro]);

  const handleFabClick = () => {
    if (!hasLocations) {
      toast.error("Ops! Primeiro você precisa cadastrar um local em 'Início'.");
      return;
    }
    router.push('/plantao-extra');
  };

  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
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

      {/* SEÇÃO PRO - BANNER PREMIUM */}
      {!isPro && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2f4a 100%)',
          border: '1px solid rgba(20,184,166,0.35)',
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: 32,
          boxShadow: '0 8px 32px -4px rgba(20,184,166,0.18)',
          textAlign: 'center'
        }}>
          <>
            {/* Badge */}
            <div style={{ display: 'inline-block', background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 900, padding: '5px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>OFERTA DE LANÇAMENTO</div>

            {/* Preço principal */}
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              <Sparkles size={20} className="inline mr-2 text-yellow-400" /> Plano PRO por apenas R$&nbsp;9,90
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18, fontWeight: 500 }}>Oferta Exclusiva de Lançamento</div>

            {/* Checkmarks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginBottom: 18 }}>
              {[
                { icon: <CheckCircle2 size={16} className="text-green-400" />, text: '6 meses de acesso PRO' },
                { icon: <CheckCircle2 size={16} className="text-green-400" />, text: 'Todos os recursos premium' },
                { icon: <CheckCircle2 size={16} className="text-green-400" />, text: 'Condição especial para os primeiros usuários' }
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.icon} {item.text}
                </div>
              ))}
            </div>

            {/* Urgência */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Timer size={14} /> Válido por tempo limitado
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Aproveite esta oportunidade única</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Zap size={16} /> Vagas limitadas
              </div>
            </div>
          </>

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%',
              boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)'
            }}
            onClick={handleUpgradeClick}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={18} /> Garantir por R$ 9,90
            </span>
          </button>
        </div>
      )}
    </>
  );
}

export function DesbloquearGanhosBtn() {
  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };

  return (
    <button 
      className="btn btn-primary" 
      onClick={handleUpgradeClick}
      style={{ 
        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
        boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
        width: 'fit-content',
        padding: '12px 24px'
      }}
    >
      Desbloquear ganhos <DollarSign size={16} className="ml-2" />
    </button>
  );
}

export function ShareAgendaButton({ proximos: initialProximos, userName, totalGanhos: initialTotal, isPro }: { proximos: any[], userName: string, totalGanhos: number, isPro: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Share2 size={12} /> Compartilhar</span>
      </button>

      <ShareAgendaModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialShifts={initialProximos}
        userName={userName}
        initialTotalGanhos={initialTotal}
        isPro={isPro}
      />
    </>
  );
}

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
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalendarIcon size={12} /> Ver agenda</span>
            </span>
          </Link>
          <ShareAgendaButton proximos={proximos || []} userName={userName} totalGanhos={totalGanhos} isPro={isPro} />
        </div>
      </div>

      {(!proximos || proximos.length === 0) ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '1.5rem', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>Nenhum plantão agendado para os próximos dias.</p>
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
                <div className="shift-item card" style={{ display: "flex", alignItems: "center", padding: 0, borderRadius: "18px", marginBottom: 0, border: "1px solid var(--border-subtle)" }}>
                  <div className="shift-color-bar" style={{ 
                    backgroundColor: localObj?.cor_calendario || 'var(--accent-blue)', 
                    width: '6px', 
                    height: "64px", borderRadius: "18px 0 0 18px" 
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
