'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={{ backgroundColor: '#050816', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic Background Glows */}
      <div style={{
        position: 'absolute',
        top: '0%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '600px',
        background: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* 1. Header (Navegação) */}
      <header style={{ 
        position: 'fixed', 
        top: 0, 
        width: '100%', 
        zIndex: 100, 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(5, 8, 22, 0.8)'
      }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #050816 100%)',
              borderRadius: '10px',
              padding: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)'
            }}>
              <Image 
                src="/icons/icon-512x512.png" 
                alt="Logo" 
                width={24} 
                height={24} 
              />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Meu Plantão</span>
          </Link>

          {/* Links Discretos */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</a>
          </nav>

          {/* Botão Acessar App */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:flex items-center px-5 py-2.5 rounded-full border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/10 transition-all">
              Acessar App
            </Link>
            <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-[#050816] pt-24 px-6 md:hidden">
          <nav className="flex flex-col gap-6">
            <a href="#features" className="text-2xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" className="text-2xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>Preços</a>
            <Link href="/login" className="w-full py-4 text-center rounded-2xl bg-blue-600 text-white font-bold text-lg">
              Acessar App
            </Link>
          </nav>
        </div>
      )}

      {/* 2. Hero Section (Destaque) */}
      <section className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Lançamento Founder Edition
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
            Organize plantões, escalas e ganhos em um só lugar.
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            A ferramenta essencial para profissionais de saúde modernos. <br className="hidden md:block" />
            Sem complicação, apenas acesso rápido.
          </p>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                padding: '20px 40px',
                background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                borderRadius: '50px',
                color: 'white',
                fontWeight: '800',
                fontSize: '18px',
                border: 'none',
                boxShadow: '0 0 40px rgba(37, 99, 235, 0.5)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Quero Organizar Meus Plantões
              <ArrowRight size={20} />
            </button>
          </Link>

          {/* Floating Device Mockup (Simplified for MVP) */}
          <div className="mt-20 relative">
            <div style={{
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '12px',
              boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)'
            }}>
              <div className="bg-[#050816] rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                 <Image 
                    src="/icons/icon-512x512.png" 
                    alt="App Interface" 
                    width={120} 
                    height={120} 
                    className="opacity-50 blur-[2px]"
                 />
                 <div className="absolute bottom-10 left-10 text-left">
                    <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
                    <div className="h-8 w-48 bg-white/20 rounded"></div>
                 </div>
              </div>
            </div>
            {/* Ambient Glow behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* 3. Seção de Funcionalidades */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Tudo que você precisa para dominar sua agenda</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s'
            }} className="hover:border-blue-500/30 hover:bg-white/[0.04]">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Escalas Inteligentes</h3>
              <p className="text-slate-400 leading-relaxed">
                Gerencie múltiplos locais com um calendário visual intuitivo e focado em performance.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s'
            }} className="hover:border-blue-500/30 hover:bg-white/[0.04]">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Controle Financeiro</h3>
              <p className="text-slate-400 leading-relaxed">
                Saiba exatamente quanto vai receber no fim do mês com cálculos automáticos por local.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s'
            }} className="hover:border-blue-500/30 hover:bg-white/[0.04]">
              <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Relatórios Profissionais</h3>
              <p className="text-slate-400 leading-relaxed">
                Gere PDFs profissionais das suas escalas para enviar aos hospitais e organizar repasses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Seção de Preço (Oferta Única) */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-transparent to-blue-600/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">Escolha o plano para evoluir</h2>
            <p className="text-slate-400 font-medium">Preço fixo. Sem surpresas.</p>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '450px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '40px',
            padding: '48px',
            border: '2px solid #2563EB',
            boxShadow: '0 0 50px rgba(37, 99, 235, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Badge Popular */}
            <div className="absolute top-8 right-[-35px] rotate-45 bg-blue-600 text-white text-[10px] font-black px-10 py-1 uppercase tracking-widest">
              Mais Popular
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-black text-white mb-2">Plano PRO</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tracking-tighter">R$ 9,90</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {[
                'Locais ilimitados',
                'Alertas de plantão',
                'Relatórios financeiros',
                'Exportação PDF',
                'Dashboard de ganhos',
                'Sincronização Cloud'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={20} className="text-blue-500" />
                  <span className="text-sm font-semibold">{benefit}</span>
                </div>
              ))}
            </div>

            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '20px',
                background: '#2563EB',
                borderRadius: '24px',
                color: 'white',
                fontWeight: '800',
                fontSize: '16px',
                border: 'none',
                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
                cursor: 'pointer'
              }} className="hover:brightness-110 active:scale-95 transition-all">
                Assinar Agora
              </button>
            </Link>
            
            <p className="text-center text-slate-500 text-[11px] font-bold mt-6 uppercase tracking-widest">
              Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-slate-600 text-sm font-medium">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
