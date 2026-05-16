'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function ProcessingPage() {
  useEffect(() => {
    const processAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // Troca o código no cliente usando localStorage
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login?error=pkce_pwa';
        }
      } else {
        window.location.href = '/login';
      }
    };

    processAuth();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9999, background: '#050816', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <video 
        src="/icons/capa.mp4" 
        poster="/icons/capa.jpeg"
        autoPlay 
        muted 
        loop 
        playsInline 
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} 
      />
      <div style={{ 
        zIndex: 10000, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '16px',
        background: 'rgba(5, 8, 22, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: '24px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white'
      }}>
        <Loader2 className="animate-spin" size={40} color="var(--accent-blue)" />
        <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'white' }}>Autenticando...</p>
      </div>
    </div>
  );
}
