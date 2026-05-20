'use client';

import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import ResponsiveSplash from '../../../components/ResponsiveSplash';

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
    <ResponsiveSplash subtitle={<>Autenticando e preparando<br />seu painel...</>} />
  );
}
