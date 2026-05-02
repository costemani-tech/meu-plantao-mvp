'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MeuPlanoClientProps {
  planName: string;
  isActive: boolean;
  subStatus: string;
  endDate?: string | null;
  autoRenew: boolean;
}

export default function MeuPlanoClient({ planName, isActive, subStatus, endDate, autoRenew }: MeuPlanoClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localSubStatus, setLocalSubStatus] = useState(subStatus);
  const [localAutoRenew, setLocalAutoRenew] = useState(autoRenew);
  const router = useRouter();

  const formattedEndDate = endDate 
    ? new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assinatura/cancelar', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar');

      toast.success('Assinatura cancelada com sucesso.');
      setLocalSubStatus('canceled');
      setLocalAutoRenew(false);
      setShowModal(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 12 }}>
          Assinatura Atual
        </h3>
        
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          {planName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            {isActive ? (
              <span style={{ color: localSubStatus === 'canceled' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                {localSubStatus === 'canceled' ? 'Cancelada (Fim de período)' : 'Ativo'}
              </span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Expirado / Inativo</span>
            )}
          </div>
          
          {formattedEndDate && isActive && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Acesso até</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formattedEndDate}</span>
            </div>
          )}

          {localSubStatus === 'canceled' && isActive && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, fontSize: 13, color: '#d97706', lineHeight: 1.5 }}>
              Sua assinatura foi cancelada, mas seu acesso PRO continuará ativo até <strong>{formattedEndDate}</strong>.
            </div>
          )}
        </div>

        {/* Só mostra botão de cancelar se estiver ativo, não estiver cancelado, e tiver renovação automática */}
        {isActive && localSubStatus !== 'canceled' && localAutoRenew && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 10 }}>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Cancelar assinatura
            </button>
          </div>
        )}
      </div>

      {/* Modal de Retenção */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => !loading && setShowModal(false)} />
          
          <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', borderRadius: 24, padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Tem certeza?</h2>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Seu acesso PRO continuará disponível até <strong>{formattedEndDate}</strong>. Após isso, sua conta voltará para o plano gratuito e você perderá acesso a:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
              <div>❌ Compartilhamento premium</div>
              <div>❌ Relatórios financeiros</div>
              <div>❌ Locais ilimitados</div>
              <div>❌ Exportação profissional</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-blue)', fontSize: 15, fontWeight: 700 }}
              >
                Continuar com PRO
              </button>
              
              <button 
                onClick={handleCancel}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '12px 0' }}
              >
                {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
