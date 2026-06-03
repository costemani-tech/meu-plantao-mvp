'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { ShieldAlert, Cookie } from 'lucide-react';

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifica se já existe uma resposta salva no localStorage
    const consent = localStorage.getItem('meu_plantao_consent');
    
    if (consent === null) {
      // Se não há resposta, exibe o banner
      setShowBanner(true);
    } else if (consent === 'true') {
      // Se aceitou anteriormente, ativa o rastreamento
      posthog.opt_in_capturing();
    } else {
      // Se recusou, garante a desativação
      posthog.opt_out_capturing();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('meu_plantao_consent', 'true');
    posthog.opt_in_capturing();
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('meu_plantao_consent', 'false');
    posthog.opt_out_capturing();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '600px',
      background: 'rgba(8, 18, 36, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(80, 120, 255, 0.2)',
      borderRadius: '20px',
      padding: '20px 24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(37, 99, 235, 0.1)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'Inter, sans-serif',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          borderRadius: '50%',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Cookie size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Privacidade & Cookies</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
            Usamos cookies e o PostHog para analisar o uso do app e melhorar sua experiência. Você pode ler nossa{' '}
            <a href="/politica-de-privacidade" style={{ color: '#3B82F6', textDecoration: 'underline', fontWeight: 600 }}>
              Política de Privacidade
            </a>{' '}
            para saber mais.
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleDecline} 
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          Recusar
        </button>
        <button 
          onClick={handleAccept} 
          style={{
            background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
          }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
