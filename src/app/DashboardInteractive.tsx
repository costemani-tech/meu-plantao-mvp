import { toast } from 'sonner';
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
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border-subtle)', marginTop: 8 }}>
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
        <div 
          onClick={onUpgradeClick}
          style={{ 
            background: '#f8fafc', 
            padding: '20px', 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover-card"
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            🔒 Disponível no Plano Pro
          </div>
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Veja seus ganhos extras automaticamente
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardInteractive({ isPro, hasLocations = true }: { isPro: boolean, hasLocations?: boolean }) {
  const [showProModal, setShowProModal] = useState('');
  const router = useRouter();

  // Auto-open Paywall para usuários Free + Listeners
  useEffect(() => {
    if (!isPro) {
      setShowProModal('Onload');
    }

    const handleOpen = () => setShowProModal('Event');
    window.addEventListener('open-upgrade-modal', handleOpen);
    return () => window.removeEventListener('open-upgrade-modal', handleOpen);
  }, [isPro]);

  const handleFabClick = () => {
    if (!hasLocations) {
      toast.error("Ops! Primeiro você precisa cadastrar um local em 'Início'.");
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

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
        [ Compartilhar ]
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
