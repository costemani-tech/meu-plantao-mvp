'use client';

import Link from 'next/link';
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={{ 
      backgroundColor: '#050816', 
      color: 'white', 
      minHeight: '100vh', 
      fontFamily: '"Inter", sans-serif',
      overflowX: 'hidden'
    }}>
      
      {/* Background Glows (Efeito Premium) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%)',
          filter: 'blur(100px)'
        }} />
      </div>

      {/* 1. Header (Navegação Elite) */}
      <header style={{ 
        position: 'fixed', 
        top: 0, 
        width: '100%', 
        zIndex: 100, 
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        background: 'rgba(5, 8, 22, 0.7)'
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)'
            }}>
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Meu Plantão</span>
          </Link>

          {/* Links Discretos Centralizados */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Suporte</a>
          </nav>

          {/* Botão Entrar */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block px-5 py-2 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all">
              Entrar
            </Link>
            <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-[#050816]/95 backdrop-blur-xl pt-24 px-8 md:hidden">
          <nav className="flex flex-col gap-8">
            <a href="#features" className="text-3xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" className="text-3xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>Preços</a>
            <Link href="/login" className="w-full py-4 text-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-600/20">
              Acessar App
            </Link>
          </nav>
        </div>
      )}

      {/* 2. Hero Section (Centralizado e Limpo) */}
      <section className="relative z-10 pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-10">
            Lançamento Founder Edition
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-[1.05]">
            Organize plantões, escalas <br className="hidden md:block" /> e ganhos em um só lugar.
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            A ferramenta essencial para profissionais de saúde modernos. <br className="hidden md:block" />
            Sem complicação, apenas acesso rápido.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button 
                style={{
                  padding: '18px 36px',
                  background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                  borderRadius: '50px',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="hover:scale-105 active:scale-95"
              >
                Quero Organizar Meus Plantões
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Seção de Funcionalidades (Grid 3 Colunas) */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Funcionalidade 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '48px 32px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              textAlign: 'center',
              transition: 'all 0.4s ease'
            }} className="hover:bg-white/[0.05] hover:border-blue-500/30 group">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto text-blue-500 transition-transform group-hover:scale-110">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Escalas Inteligentes</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Gerencie múltiplos locais com um calendário visual intuitivo e focado em performance.
              </p>
            </div>

            {/* Funcionalidade 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '48px 32px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              textAlign: 'center',
              transition: 'all 0.4s ease'
            }} className="hover:bg-white/[0.05] hover:border-emerald-500/30 group">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto text-emerald-500 transition-transform group-hover:scale-110">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Controle Financeiro</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Saiba exatamente quanto vai receber no fim do mês com cálculos automáticos por local.
              </p>
            </div>

            {/* Funcionalidade 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '48px 32px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              textAlign: 'center',
              transition: 'all 0.4s ease'
            }} className="hover:bg-white/[0.05] hover:border-purple-500/30 group">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto text-purple-500 transition-transform group-hover:scale-110">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Relatórios Profissionais</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Gere PDFs profissionais das suas escalas para enviar aos hospitais e organizar repasses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Seção de Preços (Destaque Central) */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">O plano para sua evolução</h2>
            <p className="text-slate-400 font-medium">Comece hoje e transforme sua rotina.</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(30px)',
            borderRadius: '40px',
            padding: '60px 40px',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(37, 99, 235, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle Gradient Glow inside card */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: '50%',
              height: '50%',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} />

            <div className="text-center mb-10">
              <span className="text-blue-500 font-black text-xs uppercase tracking-widest mb-4 block">Melhor Escolha</span>
              <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Plano PRO</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">R$ 9,90</span>
                <span className="text-slate-500 font-bold">/mês</span>
              </div>
            </div>

            <div className="space-y-5 mb-12 max-w-[280px] mx-auto">
              {[
                'Locais ilimitados',
                'Alertas de plantão',
                'Relatórios financeiros',
                'Exportação PDF'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-4 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{benefit}</span>
                </div>
              ))}
            </div>

            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '22px',
                background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                borderRadius: '20px',
                color: 'white',
                fontWeight: '800',
                fontSize: '16px',
                border: 'none',
                boxShadow: '0 15px 30px rgba(37, 99, 235, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} className="hover:brightness-110 active:scale-95 shadow-lg">
                Assinar Agora
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Rodapé (Centralizado e Discreto) */}
      <footer className="relative z-10 py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium tracking-tight mb-4">
            Sem senha. Sem complicação. Apenas acesso rápido.
          </p>
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Global CSS for Animations & Cleanup */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        body { background-color: #050816; margin: 0; }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

    </div>
  );
}
