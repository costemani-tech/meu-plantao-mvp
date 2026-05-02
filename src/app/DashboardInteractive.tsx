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
            background: "var(--bg-primary)", 
            padding: '20px', 
            borderRadius: '20px', 
            border: "1px solid var(--border-subtle)",
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover-card"
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            🔒 Disponível no Plano Pro
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Veja seus ganhos extras automaticamente
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardInteractive({ isPro, hasLocations = true }: { isPro: boolean, hasLocations?: boolean }) {
  const [showProModal, setShowProModal] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [ofertaAtiva, setOfertaAtiva] = useState<boolean | null>(null);
  const [proCount, setProCount] = useState(0);
  const router = useRouter();

  // Busca status da oferta de lançamento ao montar
  useEffect(() => {
    fetch('/api/mercadopago/oferta-status')
      .then(r => r.json())
      .then(d => {
        setOfertaAtiva(d.ofertaAtiva ?? false);
        setProCount(d.proCount ?? 0);
      })
      .catch(() => setOfertaAtiva(false));
  }, []);

  const handleAssinarPro = async () => {
    setLoadingCheckout(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar link de pagamento');
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não retornada pela API.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao gerar pagamento');
    } finally {
      setLoadingCheckout(false);
    }
  };

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

      {/* SEÇÃO PRO - BANNER PREMIUM */}
      {!isPro && (
        <div className="card" style={{ 
          background: ofertaAtiva
            ? 'linear-gradient(135deg, #0f172a 0%, #1a2f4a 100%)'
            : 'var(--bg-secondary)',
          border: ofertaAtiva ? '1px solid rgba(20,184,166,0.35)' : '1px solid var(--border-subtle)',
          borderRadius: '24px', 
          padding: '24px',
          marginBottom: 32,
          boxShadow: ofertaAtiva
            ? '0 8px 32px -4px rgba(20,184,166,0.18)'
            : '0 4px 6px -1px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          {ofertaAtiva ? (
            <>
              {/* Badge */}
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: '#fff', fontSize: 11, fontWeight: 900, padding: '5px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, boxShadow: '0 4px 12px rgba(20,184,166,0.35)' }}>OFERTA DE LANÇAMENTO</div>

              {/* Preço principal */}
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>💎 Plano PRO por apenas R$&nbsp;9,90</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through', marginBottom: 18, fontWeight: 500 }}>De R$ 89,90/ano</div>

              {/* Checkmarks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginBottom: 18 }}>
                {['✅ 6 meses de acesso PRO', '✅ Todos os recursos premium', '✅ Condição especial para os primeiros usuários'].map((item, i) => (
                  <div key={i} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{item}</div>
                ))}
              </div>

              {/* Urgência */}
              <div style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>⏳ Válido para os primeiros 100 usuários</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>ou até 31/08/2026</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#5eead4' }}>🔥 {100 - proCount} vagas restantes</div>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                💎 Leve seu controle para outro nível
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px 0', fontWeight: 500 }}>
                Desbloqueie a previsão financeira, relatórios em PDF e controle ilimitado.
              </p>
            </>
          )}

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', justifyContent: 'center', 
              background: ofertaAtiva
                ? 'linear-gradient(to right, #14b8a6, #0d9488)'
                : 'linear-gradient(to right, #2563eb, #1e40af)', 
              border: 'none', padding: '16px', borderRadius: '14px', 
              fontWeight: 900, fontSize: 15,
              boxShadow: ofertaAtiva
                ? '0 10px 20px -4px rgba(20,184,166,0.4)'
                : '0 10px 15px -3px rgba(37,99,235,0.3)'
            }}
            onClick={() => setShowProModal('Banner')}
            disabled={loadingCheckout}
          >
            {loadingCheckout && showProModal === 'Banner' ? 'Gerando Pagamento...' : ofertaAtiva ? '🚀 Garantir por R$ 9,90' : '🚀 Assinar PRO'}
          </button>
        </div>
      )}

      {/* MODAL PRO PAYWALL */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {/* Background */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'url(/icons/capa.jpeg), rgba(0,0,0,0.4)', 
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay',
            opacity: 0.15, zIndex: -1 
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} />

          <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', borderRadius: '32px', padding: '40px 32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>

            {ofertaAtiva ? (
              // ─── OFERTA DE LANÇAMENTO ───────────────────────────────────
              <>
                {/* Badge */}
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: '#fff', fontSize: 11, fontWeight: 900, padding: '5px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, boxShadow: '0 4px 12px rgba(20,184,166,0.35)' }}>OFERTA DE LANÇAMENTO</div>

                {/* Preço */}
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>💎 Plano PRO por apenas R$&nbsp;9,90</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: 20, fontWeight: 500 }}>De R$ 89,90/ano</div>

                {/* Checkmarks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 20 }}>
                  {[
                    '✅ 6 meses de acesso PRO',
                    '✅ Todos os recursos premium',
                    '✅ Condição especial para os primeiros usuários',
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item}</div>
                  ))}
                </div>

                {/* Urgência */}
                <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>⏳ Válido para os primeiros 100 usuários</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>ou até 31/08/2026</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0d9488' }}>🔥 {100 - proCount} vagas restantes</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', justifyContent: 'center', 
                      background: 'linear-gradient(to right, #14b8a6, #0d9488)', 
                      border: 'none', borderRadius: '100px', 
                      padding: '18px', fontSize: 16, fontWeight: 900,
                      boxShadow: '0 10px 20px -4px rgba(20,184,166,0.4)'
                    }} 
                    onClick={handleAssinarPro}
                    disabled={loadingCheckout}
                  >
                    {loadingCheckout ? 'Gerando Pagamento...' : '🚀 Garantir por R$ 9,90'}
                  </button>
                  
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
                    onClick={() => setShowProModal('')}
                  >
                    Talvez mais tarde
                  </button>
                </div>

                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Pagamento único · Acesso imediato a todas as funcionalidades.
                </div>
              </>
            ) : (
              // ─── PLANO PADRÃO (oferta encerrada) ───────────────────────
              <>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  💎 Leve seu controle para outro nível
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, textAlign: 'left' }}>
                  {[
                    { icon: <TrendingUp size={18} />, title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                    { icon: <FileText size={18} />, title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                    { icon: <Activity size={18} />, title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
                  ].map((b, i) => (
                    <div key={i} style={{ 
                      background: 'var(--accent-blue-light)', 
                      padding: '16px',
                      borderRadius: '16px',
                      borderLeft: '4px solid #3b82f6', 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    }}>
                      <div style={{ color: 'var(--accent-blue)', marginTop: 2 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent-blue)' }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderRadius: 16, padding: '24px', marginBottom: 24, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Plano Anual PRO</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>R$</span>89,90
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>1 ano de acesso · Pagamento único</div>
                </div>

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
                    onClick={handleAssinarPro}
                    disabled={loadingCheckout}
                  >
                    {loadingCheckout ? 'Gerando Pagamento...' : 'Assinar PRO — R$ 89,90/ano'}
                  </button>
                  
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
                    onClick={() => setShowProModal('')}
                  >
                    Talvez mais tarde
                  </button>
                </div>

                <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Acesso imediato a todas as funcionalidades.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function DesbloquearGanhosBtn() {
  const [showProModal, setShowProModal] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleAssinarPro = async () => {
    setLoadingCheckout(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar link de pagamento');
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não retornada pela API.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao gerar pagamento');
    } finally {
      setLoadingCheckout(false);
    }
  };

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
            
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: "var(--text-primary)", lineHeight: 1.2 }}>
              💎 Leve seu controle para outro nível
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, textAlign: 'left' }}>
              {[
                { icon: '💰', title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
                { icon: '📄', title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
                { icon: '⚡', title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
              ].map((b, i) => (
                <div key={i} style={{ 
                  background: '#eff6ff', 
                  padding: '16px',
                  borderRadius: '16px',
                  borderLeft: '4px solid #3b82f6', 
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

            <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(34,211,181,0.05) 100%)', borderRadius: 16, padding: '32px 24px', marginBottom: 24, border: '1px solid var(--border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'var(--accent-teal)', color: '#fff', fontSize: 12, fontWeight: 900, padding: '6px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 4px 10px rgba(34,211,181,0.3)', marginBottom: 16, display: 'inline-block' }}>🔥 Oferta de Lançamento</div>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>1 Ano de PRO por apenas</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>R$</span>9,90
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>(Pagamento único)</div>
            </div>

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
                onClick={handleAssinarPro}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? 'Gerando Pagamento...' : '🚀 Desbloquear Oferta de Lançamento'}
              </button>
              
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
                onClick={() => setShowProModal('')}
              >
                Talvez mais tarde
              </button>
            </div>

            <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
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
