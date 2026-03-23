'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Preencha e-mail e senha.', 'error');
      return;
    }

    setLoading(true);
    let authError = null;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
      if (!error) {
        window.location.href = '/'; // Redireciona via browser para o middleware atualizar a sessão
        return; 
      }
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        }
      });
      authError = error;
      if (!error) {
        showToast('Cadastro realizado! Verifique sua caixa de e-mail para confirmar a conta.', 'success');
        setIsLogin(true); // volta para a tela de login
      }
    }

    if (authError) {
      showToast(authError.message, 'error');
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
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
            Sua central médica pessoal
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
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>E-mail corporativo ou pessoal</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>Senha</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}
            disabled={loading}
          >
            {loading ? '⏳ Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Ainda não tem conta? ' : 'Já possui uma conta? '}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--accent-blue)', 
              fontWeight: 600, cursor: 'pointer', padding: 4 
            }}
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>
      </div>
      
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
