'use client';
import React, { useState, useEffect } from 'react';
import { Rocket, Sparkles, CheckCircle2, DollarSign, FileText, Zap, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function PremiumModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-upgrade-modal', handleOpen);
    return () => window.removeEventListener('open-upgrade-modal', handleOpen);
  }, []);

  const handleAssinar = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="premium-modal-overlay" style={{ zIndex: 10000 }}>
      <div className="premium-modal-card">
        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Meu Plantão</div>
        
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: "var(--text-primary)", lineHeight: 1.2 }}>
          💎 Leve seu controle para outro nível
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, textAlign: 'left' }}>
          {[
            { icon: <DollarSign size={18} className="text-blue-500" />, title: 'Previsão Financeira', desc: 'Veja quanto vai receber no mês.' },
            { icon: <FileText size={18} className="text-blue-500" />, title: 'Escalas Premium', desc: 'Gere PDF profissional para envio.' },
            { icon: <Zap size={18} className="text-blue-500" />, title: 'Controle Ilimitado', desc: 'Gestão total das suas escalas.' }
          ].map((b, i) => (
            <div key={i} style={{ 
              background: 'rgba(37, 99, 235, 0.05)', 
              padding: '16px',
              borderRadius: '1.25rem',
              borderLeft: '4px solid #3b82f6', 
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <div style={{ marginTop: 2 }}>{b.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent-blue)' }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(34,211,181,0.05) 100%)', borderRadius: 16, padding: '32px 24px', marginBottom: 24, border: '1px solid var(--border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: 'var(--accent-teal)', color: '#fff', fontSize: 12, fontWeight: 900, padding: '6px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 4px 10px rgba(34,211,181,0.3)', marginBottom: 16, display: 'inline-block' }}>🔥 Oferta de Lançamento</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>6 meses de PRO por apenas</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>R$</span>9,90
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>(Pagamento único)</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button type="button"
            className="btn btn-primary" 
            style={{ 
              width: '100%', justifyContent: 'center', 
              background: 'linear-gradient(to right, #2563eb, #1e40af)', 
              border: 'none', borderRadius: '100px', 
              padding: '18px', fontSize: 16, fontWeight: 900,
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }} 
            onClick={handleAssinar}
            disabled={loading}
          >
            {loading ? 'Gerando Pagamento...' : '🚀 Desbloquear Oferta de Lançamento'}
          </button>
          
          <button type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }} 
            onClick={() => setIsOpen(false)}
          >
            Talvez mais tarde
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
          Acesso imediato a todas as funcionalidades.
        </div>
      </div>
    </div>
  );
}
