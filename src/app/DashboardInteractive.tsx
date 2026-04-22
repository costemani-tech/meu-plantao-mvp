'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star } from 'lucide-react';

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
