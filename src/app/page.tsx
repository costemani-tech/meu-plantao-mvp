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
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

// --- COMPONENTES PREMIUM ---

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#0F172A] border border-white/10 rounded-xl p-4 mb-4 overflow-hidden transition-colors hover:bg-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none cursor-pointer"
      >
        <span className="text-base md:text-lg font-bold text-white">{question}</span>
        <div className={`flex-shrink-0 ml-4 transition-transform duration-500 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={24} className="text-[#3B82F6]" />
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

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-white antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. HEADER PREMIUM */}
      <header className={`hidden md:flex fixed top-0 w-full z-[100] transition-all duration-300 h-[70px] items-center ${scrolled ? 'bg-[#020817]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Meu Plantão</span>
          </Link>

          {/* Desktop Nav & CTA */}
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

      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">
        {/* Glow Blue de Profundidade */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[#3B82F6]/10 blur-[140px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center flex flex-col gap-20">
          <div className="flex flex-col gap-3 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-snug tracking-tight max-w-3xl mx-auto">
              Organize seus plantões <br className="hidden md:block" /> sem complicação.
            </h1>
            <p className="text-base md:text-lg text-[#94A3B8] font-medium max-w-xl mx-auto leading-relaxed">
              A ferramenta inteligente feita por médicos para médicos. <br className="hidden md:block" /> Simplicidade e controle total na palma da sua mão.
            </p>
          </div>

          <div className="flex flex-col items-center gap-16">
            <div className="flex flex-col items-center gap-4">
              <Link href="/login" className="flex items-center justify-center gap-2 bg-[#2563EB] text-white font-bold rounded-2xl px-10 py-4 shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] hover:scale-105 active:scale-95 transition-all text-lg group">
                Começar Agora
                <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">
                Solução inteligente para os profissionais de plantão.
              </div>
            </div>

            {/* Mockup Premium */}
            <div className="relative w-full max-w-[260px] md:max-w-[320px] mx-auto group">
              <div className="relative z-10 rounded-[2.5rem] border border-[#78a0ff]/15 shadow-[0_20px_60px_rgba(59,130,246,0.15)] overflow-hidden bg-[#0A1128]/50 backdrop-blur-sm aspect-[9/18.5] flex items-center justify-center p-3 transform transition-transform duration-1000 ease-out">
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
              {/* Glow Pulsante Atrás do Mockup */}
              <div className="absolute -inset-8 bg-[#3B82F6]/30 blur-[80px] -z-10 opacity-70 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. PADRONIZAÇÃO DOS CARDS */}
      <section id="features" className="max-w-5xl mx-auto py-24 md:py-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Agenda Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios detalhados para conferência com hospitais.' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0F172A] px-8 py-10 rounded-[24px] border border-[#78a0ff]/15 flex flex-col items-center text-center gap-5 hover:border-[#78a0ff]/30 hover:shadow-[0_0_30px_rgba(120,160,255,0.15)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <f.icon size={24} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-sm font-medium text-[#94A3B8] leading-relaxed max-w-[240px]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CARD DO PRO */}
      <section id="pricing" className="py-24 md:py-32 px-6">
        <div className="bg-[#0A0F1D] border border-[#2563EB] shadow-[0_0_40px_rgba(37,99,235,0.3)] rounded-3xl p-10 max-w-md mx-auto relative">
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-2 text-[#3B82F6] text-xs font-bold uppercase tracking-widest mb-1">
              <span>🔥</span> Oferta de lançamento
            </div>
            <h2 className="text-2xl font-bold text-white">Plano PRO</h2>
          </div>

          <div className="flex flex-col items-center text-center my-6">
            <div className="flex items-start justify-center gap-2">
              <span className="text-2xl text-slate-400 font-medium mt-2">R$</span>
              <span className="text-6xl md:text-7xl font-black text-white tracking-tighter">9,90</span>
            </div>
            <p className="text-sm text-[#94A3B8] font-medium mt-2">6 meses de acesso • pagamento único</p>
          </div>

          <div className="flex flex-col space-y-4 my-8 text-left">
            {[
              'Relatórios financeiros', 
              'PDF profissional', 
              'Locais ilimitados', 
              'Suporte prioritário'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-base text-slate-200 font-medium">
                <CheckCircle2 size={20} className="text-[#3B82F6]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Link 
              href="/login" 
              className="flex items-center justify-center w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-4 rounded-xl font-bold text-lg transition-all"
            >
              Garantir Oferta
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ PREMIUM */}
      <section className="max-w-3xl mx-auto py-24 md:py-32 px-6">
        <div className="flex flex-col gap-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Dúvidas Frequentes</h2>
          </div>
          <div className="flex flex-col">
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

      {/* 6. FOOTER SaaS */}
      <footer className="py-24 px-6 bg-[#02050A] text-center border-t border-[#78a0ff]/10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-lg font-bold tracking-tight text-white">Meu Plantão</span>
            </div>
            
            <p className="text-[#94A3B8] text-sm font-medium">
              Organização inteligente para profissionais da saúde
            </p>
          </div>
          
          <div className="flex gap-6 justify-center text-sm text-slate-500 font-medium my-4">
            <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
            <Link href="#" className="hover:text-white transition-colors">Contato</Link>
          </div>
          
          <p className="text-[10px] text-slate-700 font-medium">
            © 2026 Meu Plantão
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        
        .rotate-3d {
          transform: perspective(1000px) rotateY(-8deg) rotateX(2deg);
        }

        html { scroll-behavior: smooth; }
      `}</style>

    </div>
  );
}
