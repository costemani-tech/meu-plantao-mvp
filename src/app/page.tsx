'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  LineChart, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './landing.css';

// --- SCROLL FADE-IN HOOK ---
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// --- FAQ ITEM PREMIUM ---
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div 
      style={{
        background: '#0A1128',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: '18px',
        padding: '20px 24px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 15px rgba(59,130,246,0.05)',
      }}
      className="faq-card"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none cursor-pointer"
        style={{ background: 'transparent', border: 'none' }}
      >
        <span className="text-base md:text-lg font-bold text-white">{question}</span>
        <div className={`faq-icon-wrapper ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={22} className="text-[#60A5FA] drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        </div>
      </button>
      <div 
        className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="pt-4 text-[#94A3B8] text-sm md:text-base leading-relaxed font-medium">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- FADE-IN SECTION WRAPPER ---
function FadeSection({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const { ref, isVisible } = useFadeIn();
  return (
    <div 
      ref={ref} 
      className={`fade-section ${isVisible ? 'fade-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-white antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      
      {/* 1. HEADER PREMIUM */}
      <header className={`hidden md:flex fixed top-0 w-full z-[100] transition-all duration-300 h-[70px] items-center ${scrolled ? 'bg-[#020817]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
        <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Meu Plantão</span>
          </Link>

          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
            </nav>
            <Link 
              href="/login" 
              className="px-6 py-2 bg-[#3B82F6] text-white rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Acessar App
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION — Desktop: 2 colunas | Mobile: stacked */}
      <section className="relative pt-24 pb-16 md:pt-40 md:pb-32 px-6 overflow-hidden">
        {/* Glow Blue de Profundidade */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[#3B82F6]/10 blur-[140px] -z-10" />
        
        <div className="hero-container max-w-[1200px] mx-auto">
          {/* Left — Text */}
          <div className="hero-text animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight max-w-md">
              Organize seus plantões{' '}
              <br className="hidden md:block" />sem complicação.
            </h1>
            <p className="text-base md:text-lg text-[#94A3B8] font-medium max-w-md leading-relaxed">
              Simplicidade e controle total dos seu plantões na palma da sua mão.
            </p>

            {/* CTA PRINCIPAL */}
            <Link href="/login" className="cta-main group">
              <span>Começar Gratuitamente</span>
              <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right — Mockup */}
          <div className="hero-mockup">
            <div className="relative w-full max-w-[260px] md:max-w-[320px] mx-auto group">
              <div className="relative z-10 rounded-[2.5rem] border border-[#78a0ff]/15 shadow-[0_20px_60px_rgba(59,130,246,0.15)] overflow-hidden bg-[#0A1128]/50 backdrop-blur-sm aspect-[9/18.5] flex items-center justify-center p-3 transform transition-transform duration-1000 ease-out group-hover:scale-[1.02]">
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#020817]">
                  <Image 
                    src="/mockup-app.png"
                    alt="Meu Plantão 3D Preview"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              {/* Glow Pulsante */}
              <div className="absolute -inset-8 bg-[#3B82F6]/30 blur-[80px] -z-10 opacity-70 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARDS DE FUNCIONALIDADES */}
      <FadeSection>
        <section id="features" className="landing-section max-w-[1200px] mx-auto px-6">
          <div className="features-grid">
            {[
              { icon: Calendar, title: 'Agenda Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
              { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
              { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios detalhados para conferência com hospitais.' }
            ].map((f, i) => (
              <div key={i} className="feature-card group">
                <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <f.icon size={26} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-sm font-medium text-[#94A3B8] leading-relaxed max-w-[260px]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeSection>

      {/* 4. CARD DO PRO */}
      <FadeSection>
        <section id="pricing" className="landing-section px-6">
          <div className="pro-card max-w-[900px] mx-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#3B82F6]/10 blur-[80px] pointer-events-none" />
            
            <div className="pro-card-inner">
              {/* Left — Info & Benefits */}
              <div className="pro-card-left">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="inline-flex items-center gap-2 text-[#3B82F6] text-xs font-bold uppercase tracking-widest mb-1">
                    <span>🔥</span> Oferta de lançamento
                  </div>
                  <h2 className="text-2xl font-bold text-white">Plano PRO</h2>
                </div>

                <div className="flex flex-col space-y-4 my-6 md:my-4 text-left">
                  {[
                    'Relatórios financeiros', 
                    'PDF profissional', 
                    'Locais ilimitados', 
                    'Controle de repasses e extras'
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-base text-slate-200 font-medium">
                      <CheckCircle2 size={20} className="text-[#3B82F6] flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Price & CTA */}
              <div className="pro-card-right">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-start justify-center gap-1">
                    <span style={{ fontSize: '28px', color: '#94A3B8', fontWeight: 500, marginTop: '16px' }}>R$</span>
                    <span style={{ fontSize: '96px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>9,90</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, marginTop: '4px' }}>Pagamento único • 6 meses PRO</p>
                </div>

                <Link 
                  href="/login" 
                  className="pro-cta-btn"
                >
                  🚀 Garantir Oferta por R$ 9,90
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* 5. FAQ PREMIUM */}
      <FadeSection>
        <section className="landing-section max-w-3xl mx-auto px-6">
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Dúvidas Frequentes</h2>
            </div>
            <div className="flex flex-col gap-4">
              <FAQItem 
                question="Como funciona o período de 6 meses?" 
                answer="Ao garantir sua vaga na Oferta de Lançamento por R$ 9,90, você terá acesso completo a todas as funções PRO por 180 dias. É um pagamento único, sem recorrência automática."
              />
              <FAQItem 
                question="Posso exportar meus dados?" 
                answer="Sim! O Meu Plantão permite gerar relatórios detalhados em PDF da sua escala e faturamento em segundos, prontos para enviar para o hospital ou grupo médico."
              />
              <FAQItem 
                question="É seguro cadastrar meus dados?" 
                answer="Utilizamos criptografia de ponta e os servidores mais seguros do mercado para garantir que suas escalas e dados financeiros fiquem protegidos e privados."
              />
            </div>
          </div>
        </section>
      </FadeSection>

      {/* 6. FOOTER SaaS */}
      <footer className="py-16 md:py-20 px-6 bg-[#02050A] border-t border-[#78a0ff]/10">
        <div className="footer-container max-w-[1200px] mx-auto">
          <div className="footer-col footer-brand">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-lg font-bold tracking-tight text-white">Meu Plantão</span>
            </div>
            <p className="text-[#94A3B8] text-sm font-medium mt-2">
              Organização inteligente para profissionais da saúde
            </p>
          </div>

          <div className="footer-col footer-links">
            <div className="footer-links-list">
              <Link href="#" className="text-sm text-slate-500 font-medium hover:text-white transition-colors">Privacidade</Link>
              <span className="footer-separator text-slate-700">•</span>
              <Link href="#" className="text-sm text-slate-500 font-medium hover:text-white transition-colors">Termos</Link>
            </div>
          </div>

          <div className="footer-col footer-contact">
            <Link href="#" className="text-sm text-slate-500 font-medium hover:text-white transition-colors">Contato</Link>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-700 font-medium text-center mt-10">
          © 2026 Meu Plantão
        </p>
      </footer>

    </div>
  );
}
