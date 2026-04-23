'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

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
        emailRedirectTo: 'https://meu-plantao-mvp.vercel.app/auth/callback',
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
      showToast('Digite o código de 6 dígitos.', 'error');
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
      window.location.href = '/';
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, #1a1e2d 100%)',
      padding: 24
    }}>
      
      <div className="card" style={{ width: '100%', maxWidth: 420, zIndex: 10, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
            borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px', color: 'white'
          }}>🏥</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Meu Plantão
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Sua central médica pessoal segura
          </p>
        </div>

        <button 
          onClick={signInWithGoogle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'white', color: '#333', border: 'none', padding: '12px 16px',
            borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            marginBottom: 24, transition: 'transform 0.15s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
             <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
             <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
             <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
             <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Entrar com o Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>ou link mágico (sem senha)</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {!isCodeSent ? (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                placeholder="Digite seu e-mail" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : 'Receber Código de Acesso'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Enviamos um código para <strong>{email}</strong>
              </p>
            </div>
            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Digite o código recebido" 
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
                autoFocus
                inputMode="numeric"
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: otpCode.length > 6 ? '2px' : '4px', fontWeight: 700 }}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}
              disabled={loading}
            >
              {loading ? '⏳ Verificando...' : 'Confirmar e Entrar'}
            </button>

            <button 
              type="button"
              onClick={() => setIsCodeSent(false)}
              style={{ 
                width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', 
                fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline' 
              }}
            >
              Usar outro e-mail
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          Esqueceu senhas? Nós também. Enviamos um passe direto para o seu e-mail aprovado.
        </div>
      </div>
      
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
