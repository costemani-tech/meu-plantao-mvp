'use client';

import { useState } from 'react';
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
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-inter text-white">
      {/* Background Decorative Glows - Increased opacity and size */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header / Logo Section */}
      <div className="flex flex-col items-center mb-10 z-10 text-center px-4">
        <div className="w-20 h-20 bg-blue-600/15 rounded-3xl border border-white/15 p-4 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center overflow-hidden backdrop-blur-sm">
          <Image 
            src="/icons/icon-512x512.png" 
            alt="Meu Plantão Logo" 
            width={60} 
            height={60} 
            className="object-contain"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 drop-shadow-sm">
          Meu Plantão
        </h1>
        <p className="text-slate-400 text-sm md:text-lg max-w-[300px] md:max-w-md font-medium leading-relaxed">
          Organize plantões, escalas e ganhos em um só lugar.
        </p>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-[420px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-blue-900/20 z-10 relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="space-y-8 relative z-10">
          {/* Google Login Button */}
          <button 
            onClick={signInWithGoogle}
            className="w-full h-14 flex items-center justify-center gap-4 bg-white/5 border border-white/15 rounded-2xl text-white font-bold text-base transition-all hover:bg-white/10 hover:border-blue-500/40 active:scale-[0.97] group"
          >
            <div className="bg-white p-1.5 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
                 <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                 <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                 <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                 <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
            </div>
            <span>Entrar com Google</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">OU POR E-MAIL</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {!isCodeSent ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  className="w-full h-16 bg-[#0F172A]/80 border border-white/10 rounded-2xl pl-14 pr-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold text-base" 
                  placeholder="Seu melhor e-mail" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Receber Link de Acesso
                    <ArrowRight className="h-6 w-6" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
              <div>
                <p className="text-base text-slate-400 mb-6">
                  Enviamos um código para <br/>
                  <span className="text-white font-black text-lg">{email}</span>
                </p>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full h-20 bg-[#0F172A]/80 border border-white/10 rounded-2xl text-center text-3xl font-black tracking-[0.4em] text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  placeholder="000000" 
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  inputMode="numeric"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirmar Código'}
              </button>

              <button 
                type="button"
                onClick={() => setIsCodeSent(false)}
                className="text-sm text-slate-500 hover:text-white font-bold transition-colors"
              >
                ← Usar outro e-mail
              </button>
            </form>
          )}
          
          {/* Footer info inside card */}
          <div className="pt-4 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Sem senha. Sem complicação. <br/> Apenas acesso rápido.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-3xl backdrop-blur-xl border animate-in fade-in slide-in-from-bottom-6 duration-500 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/15 border-red-500/20 text-red-400'
        } shadow-2xl shadow-black/50`}>
          <div className="flex items-center gap-3 font-black text-sm uppercase tracking-wider">
            {toast.type === 'success' ? '✅' : '❌'}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
