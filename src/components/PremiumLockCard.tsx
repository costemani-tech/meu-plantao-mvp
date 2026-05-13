import React, { useState } from 'react';
import { Diamond, Loader2 } from 'lucide-react';
import { handleDirectCheckout } from '../lib/checkout';
import { toast } from 'sonner';

interface PremiumLockCardProps {
  title: string;
  description: string;
  badgeText?: string;
  icon?: React.ReactNode;
}

export default function PremiumLockCard({
  title,
  description,
  badgeText = "PLANO GRATUITO",
  icon = <Diamond size={14} />
}: PremiumLockCardProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckoutClick = async () => {
    setLoading(true);
    try {
      const url = await handleDirectCheckout();
      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao redirecionar para o pagamento.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#081224',
      border: '1px solid rgba(80,120,255,0.15)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      gap: '16px',
      boxShadow: '0 0 40px rgba(59,130,246,0.05)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '24px'
    }} className="premium-lock-card">
      {/* glow background */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        background: 'radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 40%)',
        pointerEvents: 'none'
      }} />

      <div className="plc-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, zIndex: 1 }}>
        <div style={{ 
          background: 'rgba(59,130,246,0.1)', 
          border: '1px solid rgba(59,130,246,0.2)', 
          color: '#3B82F6', 
          fontSize: '11px', 
          fontWeight: 800, 
          padding: '4px 10px', 
          borderRadius: '100px', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '12px' 
        }}>
          {icon} {badgeText}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5, maxWidth: '400px' }}>
          {description}
        </p>
      </div>

      <button
        onClick={handleCheckoutClick}
        disabled={loading}
        className="btn btn-primary plc-button"
        style={{
          background: '#3B82F6',
          border: 'none',
          color: '#fff',
          fontWeight: 800,
          padding: '12px 24px',
          borderRadius: '100px',
          boxShadow: '0 8px 20px rgba(59,130,246,0.2)',
          zIndex: 1,
          height: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : 'Desbloquear Plano PRO'}
      </button>
    </div>
  );
}
