'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Crown, Gift, Lock, Check, ChevronDown, ChevronRight, RefreshCw, MessageCircle, X, Shield, Zap, BarChart3, MapPin, FileText, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import './meu-plano.css';

async function handleCheckout() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Você precisa estar logado.'); return; }

    const res = await fetch('/api/mercadopago/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userEmail: user.email }),
    });
    const data = await res.json();
    if (!res.ok || !data.init_point) throw new Error(data.error || 'Erro ao gerar checkout');
    window.location.href = data.init_point;
  } catch (e: any) {
    toast.error(e.message || 'Erro ao iniciar pagamento. Tente novamente.');
  }
}

interface Props {
  isPro: boolean;
  subStatus: string;
  endDate: string | null;
  autoRenew: boolean;
  launchOffer: boolean;
  locaisUsados: number;
  locaisMax: number;
  diasRestantes: number | null;
}

const PRO_FEATURES = [
  { icon: FileText, label: 'Relatórios em PDF' },
  { icon: BarChart3, label: 'Previsão financeira automática' },
  { icon: MapPin, label: 'Locais ilimitados' },
  { icon: Zap, label: 'Controle de extras' },
  { icon: Shield, label: 'Suporte prioritário' },
];

const FREE_FEATURES_INCLUDED = ['Até 2 locais', 'Agenda inteligente', 'Controle básico de escalas'];
const FREE_FEATURES_LOCKED = ['Relatórios PDF', 'Previsão financeira', 'Locais ilimitados', 'Controle de extras'];

const FAQ_ITEMS = [
  { q: 'Como funciona o pagamento?', a: 'O pagamento é processado via Mercado Pago com total segurança. Você pode pagar por PIX ou cartão de crédito.' },
  { q: 'O plano renova automaticamente?', a: 'Não. O Meu Plantão PRO é um pagamento único de 6 meses. Não há cobranças automáticas — você decide quando renovar.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Você pode voltar para o plano gratuito a qualquer momento. Seu acesso PRO continua ativo até a data de expiração.' },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mp-faq">
      <h3 className="mp-section-title">Perguntas frequentes</h3>
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="mp-faq-item" onClick={() => setOpen(open === i ? null : i)}>
          <div className="mp-faq-q">
            <span>{item.q}</span>
            <ChevronDown size={16} className={`mp-faq-icon ${open === i ? 'open' : ''}`} />
          </div>
          {open === i && <p className="mp-faq-a">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [categoria, setCategoria] = useState('Sugestão');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (mensagem.trim().length < 5) { toast.error('Escreva uma mensagem antes de enviar.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, mensagem }),
        credentials: 'include',
      });
      const data = await res.json();
      console.log('[Feedback Modal] Resposta API:', res.status, JSON.stringify(data));
      if (!res.ok) {
        toast.error(`Erro ao enviar: ${data.error || res.status}`);
        return;
      }
      if (data.emailSent === false) {
        console.warn('[Feedback Modal] E-mail não enviado pelo Resend:', data.emailError);
      }
      setSent(true);
    } catch (e) {
      console.error('[Feedback Modal] Erro fetch:', e);
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-card mp-modal" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="mp-modal-success">
            <div className="mp-success-icon"><Check size={28} /></div>
            <h3>Mensagem enviada!</h3>
            <p>Nossa equipe analisará seu feedback em breve. Obrigado!</p>
            <button className="btn btn-primary mp-btn-full" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="mp-modal-header">
              <MessageCircle size={24} className="mp-modal-icon" />
              <div>
                <h3>Feedback & Suporte</h3>
                <p>Tem uma sugestão, problema ou dúvida?</p>
              </div>
              <button className="mp-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            <div className="mp-modal-body">
              <label className="mp-label">Categoria</label>
              <div className="mp-categoria-grid">
                {['Sugestão', 'Problema', 'Dúvida', 'Crítica'].map(c => (
                  <button key={c} className={`mp-cat-btn ${categoria === c ? 'active' : ''}`} onClick={() => setCategoria(c)}>{c}</button>
                ))}
              </div>
              <label className="mp-label">Mensagem</label>
              <textarea className="mp-textarea" rows={4} placeholder="Descreva aqui..." value={mensagem} onChange={e => setMensagem(e.target.value)} />
              <button className="btn btn-primary mp-btn-full" onClick={handleSend} disabled={sending}>
                {sending ? 'Enviando...' : '📨 Enviar mensagem'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CancelModal({ onClose, onConfirm, loading, formattedEndDate }: { onClose: () => void; onConfirm: () => void; loading: boolean; formattedEndDate: string | null }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="premium-modal-overlay" onClick={() => !loading && onClose()}>
      <div className="premium-modal-card mp-modal" onClick={e => e.stopPropagation()}>
        <div className="mp-modal-header">
          <div className="mp-cancel-icon">!</div>
          <div>
            <h3>Confirmar downgrade</h3>
            <p>Você terá acesso PRO até {formattedEndDate}.</p>
          </div>
          <button className="mp-close-btn" onClick={onClose} disabled={loading}><X size={20} /></button>
        </div>
        <div className="mp-modal-body">
          <div className="mp-pause-hint">
            <p className="mp-hint-title">💡 Precisa de uma pausa?</p>
            <p className="mp-hint-text">Seu plano não possui renovação automática. Você pode continuar usando normalmente até a data final sem nenhuma cobrança extra.</p>
          </div>
          <p className="mp-label" style={{ marginTop: 20, marginBottom: 12 }}>Ao voltar para o plano gratuito:</p>
          <div className="mp-loss-list">
            {['Relatórios PDF', 'Controle financeiro', 'Locais ilimitados', 'Recursos premium'].map(item => (
              <div key={item} className="mp-loss-item"><X size={14} className="mp-loss-x" />{item}</div>
            ))}
          </div>
          <label className="mp-label">O que faltou para você continuar?</label>
          <textarea className="mp-textarea" rows={3} placeholder="Seu feedback nos ajuda a melhorar..." value={motivo} onChange={e => setMotivo(e.target.value)} />
          <div className="mp-modal-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Voltar</button>
            <button className="mp-cancel-confirm-btn" onClick={onConfirm} disabled={loading}>{loading ? 'Processando...' : 'Confirmar downgrade'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FreePlanView({ locaisUsados, locaisMax }: { locaisUsados: number; locaisMax: number }) {
  const pct = Math.min(100, Math.round((locaisUsados / locaisMax) * 100));
  const [showFeedback, setShowFeedback] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const onUpgrade = async () => {
    setCheckingOut(true);
    posthog.capture('click_upgrade_pro');
    await handleCheckout();
    setCheckingOut(false);
  };
  return (
    <div className="mp-page">
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      <div className="page-header">
        <h1>Meu Plano</h1>
        <p>Gerencie seu plano e acompanhe seus benefícios.</p>
      </div>

      {/* Card Plano Atual */}
      <div className="mp-card mp-card-free">
        <div className="mp-plan-header">
          <div className="mp-plan-icon free"><Gift size={22} /></div>
          <div>
            <div className="mp-plan-label">PLANO ATUAL</div>
            <div className="mp-plan-name">Gratuito</div>
          </div>
          <div className="mp-badge mp-badge-free">Ativo</div>
        </div>
        <p className="mp-plan-desc">Você está utilizando o plano gratuito do Meu Plantão.</p>
      </div>

      {/* Card Limites */}
      <div className="mp-card">
        <h3 className="mp-section-title">Uso atual</h3>
        <div className="mp-usage-row">
          <span>{locaisUsados} de {locaisMax} locais utilizados</span>
          <span className="mp-usage-pct">{pct}%</span>
        </div>
        <div className="mp-progress-bg">
          <div className="mp-progress-bar" style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : 'linear-gradient(90deg,#3B82F6,#22D3EE)' }} />
        </div>

        <h3 className="mp-section-title" style={{ marginTop: 24 }}>Limites do plano gratuito</h3>
        <div className="mp-features-list">
          {FREE_FEATURES_INCLUDED.map(f => <div key={f} className="mp-feature-row"><Check size={16} className="mp-feat-check" /><span>{f}</span></div>)}
          {FREE_FEATURES_LOCKED.map(f => <div key={f} className="mp-feature-row mp-feature-locked"><Lock size={14} className="mp-feat-lock" /><span>{f}</span></div>)}
        </div>
      </div>

      {/* Card PRO — Vendedor */}
      <div className="mp-card mp-card-pro-seller">
        <div className="mp-popular-badge">MAIS POPULAR</div>
        <div className="mp-pro-seller-header">
          <div className="mp-plan-icon pro"><Crown size={22} /></div>
          <div>
            <div className="mp-plan-name mp-pro-name">Plano PRO</div>
            <div className="mp-pro-sub">Pagamento único • 6 meses de acesso</div>
          </div>
          <div className="mp-pro-price">R$ 9,90</div>
        </div>
        <div className="mp-features-list" style={{ marginBottom: 20 }}>
          {PRO_FEATURES.map(({ icon: Icon, label }) => <div key={label} className="mp-feature-row"><Check size={16} className="mp-feat-check" /><span>{label}</span></div>)}
        </div>
        <button className="mp-upgrade-btn" onClick={onUpgrade} disabled={checkingOut}>
          {checkingOut ? <><Loader2 size={18} className="mp-spin" /> Redirecionando...</> : '👑 Fazer Upgrade para PRO'}
        </button>
        <div className="mp-trust-signals">
          <span>✔ Pagamento seguro via Mercado Pago</span>
          <span>✔ Sem renovação automática</span>
          <span>✔ Acesso imediato após pagamento</span>
        </div>
      </div>

      <FaqAccordion />

      <div className="mp-feedback-link">
        <button onClick={() => setShowFeedback(true)} className="mp-text-btn">
          <MessageCircle size={14} /> Feedback & Suporte
        </button>
      </div>
    </div>
  );
}

function ProPlanView({ subStatus, endDate, autoRenew, diasRestantes }: { subStatus: string; endDate: string | null; autoRenew: boolean; diasRestantes: number | null }) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [localStatus, setLocalStatus] = useState(subStatus);

  const onRenovar = async () => {
    setCheckingOut(true);
    await handleCheckout();
    setCheckingOut(false);
  };

  const formattedEndDate = endDate
    ? new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assinatura/cancelar', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Downgrade realizado. Seu acesso PRO continua até ' + formattedEndDate);
      setLocalStatus('canceled');
      setShowCancel(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ocorreu um erro.');
    } finally { setLoading(false); }
  };

  const isCanceled = localStatus === 'canceled';

  return (
    <div className="mp-page">
      {showCancel && <CancelModal onClose={() => setShowCancel(false)} onConfirm={handleCancel} loading={loading} formattedEndDate={formattedEndDate} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <div className="page-header">
        <h1>Meu Plano</h1>
        <p>Gerencie sua assinatura e benefícios ativos.</p>
      </div>

      {/* Card PRO Principal */}
      <div className="mp-card mp-card-pro-main">
        <div className="mp-plan-header">
          <div className="mp-plan-icon pro"><Crown size={22} /></div>
          <div>
            <div className="mp-plan-label">ASSINATURA ATUAL</div>
            <div className="mp-plan-name">Plano PRO</div>
          </div>
          <div className={`mp-badge ${isCanceled ? 'mp-badge-warn' : 'mp-badge-pro'}`}>
            {isCanceled ? '⚠ Cancelado' : '🟢 Ativo'}
          </div>
        </div>
        <p className="mp-plan-desc">{isCanceled ? 'Seu plano foi cancelado, mas o acesso PRO continua ativo.' : 'Seu plano está ativo.'}</p>

        {formattedEndDate && (
          <div className="mp-expiry-block">
            <div className="mp-expiry-row">
              <span className="mp-expiry-label">Expira em</span>
              <span className="mp-expiry-date">{formattedEndDate}</span>
            </div>
            {diasRestantes !== null && (
              <div className="mp-expiry-row">
                <span className="mp-expiry-label">Restam</span>
                <span className="mp-expiry-days">{diasRestantes} dias de acesso</span>
              </div>
            )}
          </div>
        )}
        <div className="mp-no-renew-note">
          Plano expira naturalmente. Sem renovação automática — você decide quando renovar.
        </div>
      </div>

      {/* Benefícios Ativos */}
      <div className="mp-card">
        <h3 className="mp-section-title">Benefícios do seu plano</h3>
        <div className="mp-features-list mp-features-pro">
          {PRO_FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="mp-feature-row mp-feature-pro-row">
              <div className="mp-pro-feat-icon"><Icon size={15} /></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gerenciar Assinatura */}
      <div className="mp-card">
        <h3 className="mp-section-title">Gerenciar assinatura</h3>
        <p className="mp-manage-sub">Você tem total controle sobre sua assinatura.</p>

        <div className="mp-action-list">
          <button className="mp-action-row" onClick={onRenovar} disabled={checkingOut}>
            <div className="mp-action-icon">{checkingOut ? <Loader2 size={18} className="mp-spin" /> : <RefreshCw size={18} />}</div>
            <div className="mp-action-text">
              <span className="mp-action-title">{checkingOut ? 'Redirecionando...' : 'Renovar antecipadamente'}</span>
              <span className="mp-action-sub">Adicionar mais 6 meses ao seu plano</span>
            </div>
            <ChevronRight size={16} className="mp-action-arrow" />
          </button>

          <button className="mp-action-row" onClick={() => setShowFeedback(true)}>
            <div className="mp-action-icon"><MessageCircle size={18} /></div>
            <div className="mp-action-text">
              <span className="mp-action-title">Falar com suporte</span>
              <span className="mp-action-sub">Tire dúvidas ou solicite ajuda</span>
            </div>
            <ChevronRight size={16} className="mp-action-arrow" />
          </button>

          {!isCanceled && (
            <button className="mp-action-row mp-action-danger" onClick={() => {
              posthog.capture('open_cancel_modal');
              setShowCancel(true);
            }}>
              <div className="mp-action-icon danger"><X size={18} /></div>
              <div className="mp-action-text">
                <span className="mp-action-title danger">Cancelar plano</span>
                <span className="mp-action-sub">Cancelar e voltar para o plano gratuito</span>
              </div>
              <ChevronRight size={16} className="mp-action-arrow" />
            </button>
          )}

          <div className="mp-action-row mp-action-info">
            <div className="mp-action-icon info">i</div>
            <div className="mp-action-text">
              <span className="mp-action-title">Pagamento único</span>
              <span className="mp-action-sub">Seu plano PRO não possui renovação automática.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeuPlanoClient({ isPro, subStatus, endDate, autoRenew, launchOffer, locaisUsados, locaisMax, diasRestantes }: Props) {
  if (isPro) {
    return <ProPlanView subStatus={subStatus} endDate={endDate} autoRenew={autoRenew} diasRestantes={diasRestantes} />;
  }
  return <FreePlanView locaisUsados={locaisUsados} locaisMax={locaisMax} />;
}
