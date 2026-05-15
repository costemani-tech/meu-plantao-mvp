'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error') === 'pkce_pwa') {
        showToast('Abra o app e digite o código de 6 dígitos ao invés de clicar no link.', 'error');
        // Clean up URL
        window.history.replaceState({}, document.title, '/login');
      }
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Preencha seu e-mail.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://meu-plantao-mvp.vercel.app/auth/callback',
      }
    });

    if (error) {
      showToast(error.message, 'error');
    } else {
      setIsCodeSent(true);
      showToast('Código enviado! Verifique seu e-mail.', 'success');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      showToast('Digite o código numérico válido.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'magiclink'
    });

    if (error) {
      showToast('Código inválido ou expirado.', 'error');
    } else {
      showToast('Sucesso! Entrando...', 'success');
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) showToast(error.message, 'error');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#050816', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px', 
      position: 'relative', 
      overflow: 'hidden',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Deep Blue Radial Glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Glowing Square Logo */}
        <div style={{
          width: '88px',
          height: '88px',
          background: 'linear-gradient(135deg, #1E40AF 0%, #050816 100%)',
          borderRadius: '24px',
          padding: '18px',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          boxShadow: '0 0 40px rgba(37, 99, 235, 0.4)',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image 
            src="/icons/icon-512x512.png" 
            alt="Logo" 
            width={56} 
            height={56} 
            className="object-contain"
          />
        </div>

        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.03em' }}>Meu Plantão</h1>
        <p style={{ color: '#94A3B8', textAlign: 'center', marginBottom: '40px', fontSize: '15px', fontWeight: '500', maxWidth: '300px', lineHeight: '1.5' }}>
          Organize plantões, escalas e ganhos em um só lugar.
        </p>

        {/* Neon Glass Card */}
        <div style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '36px',
          padding: '36px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(37, 99, 235, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          
          {/* Google Pill Button */}
          <button 
            type="button"
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              height: '58px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '29px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              color: 'white',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
               <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
               <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
               <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
               <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Entrar com Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.1em' }}>OU POR E-MAIL</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {!isCodeSent ? (
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Mail 
                  style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '20px', height: '20px' }} 
                />
                <input 
                  type="email" 
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '58px',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '29px',
                    padding: '0 24px 0 56px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  height: '58px',
                  background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                  borderRadius: '29px',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Receber Código
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>
                Enviamos um código para <br/> <span style={{ color: 'white', fontWeight: '700' }}>{email}</span>
              </p>
              <input 
                type="text" 
                placeholder="Código (ex: 123456)"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                autoFocus
                inputMode="numeric"
                style={{
                  width: '100%',
                  height: '72px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '36px',
                  textAlign: 'center',
                  color: 'white',
                  fontSize: '24px',
                  letterSpacing: '6px',
                  fontWeight: '800',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  height: '58px',
                  background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                  borderRadius: '29px',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)',
                  cursor: 'pointer'
                }}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirmar e Entrar'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsCodeSent(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Usar outro e-mail
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <p style={{ fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sem senha. Sem complicação. <br/> Apenas acesso rápido.
            </p>
          </div>
        </div>

        {/* Outer Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5 }}>
           <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sem senha. Sem complicação. <br/> Apenas acesso rápido.
            </p>
        </div>

      </div>

      {/* Decorative Sparkle */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        right: '32px',
        opacity: 0.3
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="white" />
        </svg>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
          padding: '14px 28px',
          borderRadius: '20px',
          backdropFilter: 'blur(12px)',
          color: toast.type === 'success' ? '#34D399' : '#F87171',
          fontWeight: '700',
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'success' ? '✅' : '❌'}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
