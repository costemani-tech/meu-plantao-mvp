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
      zIndex: 9999, background: '#050816', display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Mobile Splash Layout */}
      <div className="block md:hidden w-full h-full">
        <video 
          src="/icons/capa.mp4" 
          poster="/icons/capa.jpeg"
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Desktop/Tablet Responsive Hero Splash Layout */}
      <div className="hidden md:grid hero relative z-10">
        <div className="hero-content">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-6">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <h1 className="hero-title">
            Meu <span className="text-[#3B82F6]">Plantão</span>
          </h1>
          <p className="hero-subtitle">
            Autenticando e preparando seu painel...
          </p>
          {/* Premium Progress Bar */}
          <div className="w-full max-w-[320px] h-1.5 bg-slate-800 rounded-full overflow-hidden mt-8 relative">
            <div className="h-full bg-[#3B82F6] rounded-full animate-pulse" style={{ width: '80%' }}></div>
          </div>
        </div>
        <div className="hero-image">
          <div className="relative w-full max-w-[320px]">
            {/* Phone mockup border */}
            <div className="relative z-10 rounded-[2.5rem] border border-[#78a0ff]/20 shadow-[0_20px_60px_rgba(59,130,246,0.2)] overflow-hidden bg-[#0A1128]/50 backdrop-blur-sm aspect-[9/18.5] p-3">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-[#020817]">
                <video 
                  src="/icons/capa.mp4" 
                  poster="/icons/capa.jpeg"
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Pulsing Blue Glow in Background */}
            <div className="absolute -inset-8 bg-blue-500/20 blur-[80px] -z-10 opacity-70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
