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
    <div className="group bg-[#0F172A] rounded-3xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 md:p-8 text-left focus:outline-none"
      >
        <span className="text-base md:text-lg font-bold text-white tracking-tight">{question}</span>
        <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={20} className="text-blue-500" />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-8' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="px-6 md:px-8 text-slate-400 text-sm md:text-base leading-relaxed">
          {answer}
        </p>
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
      
      {/* 1. HEADER PREMIUM (70px Mobile, Pill Button, Blur) */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-300 h-[70px] flex items-center ${scrolled ? 'bg-[#020817]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">Meu Plantão</span>
          </Link>

          {/* Desktop Nav & CTA */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6 text-sm font-bold text-slate-400">
              <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
            </nav>
            <Link 
              href="/login" 
              className="px-8 py-2.5 bg-[#3B82F6] text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Acessar App
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
             <Link 
                href="/login" 
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                Acessar
              </Link>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Headline 44px, 3D Mockup, Glow Blue) */}
      <section className="relative pt-32 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
        {/* Glow Blue de Profundidade */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[#3B82F6]/10 blur-[140px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-[34px] md:text-[44px] font-black text-white leading-[1.1] tracking-tight max-w-3xl mx-auto">
              Organize plantões e escalas <br className="hidden md:block" /> sem complicação.
            </h1>
            <p className="text-base md:text-lg text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
              A ferramenta inteligente feita por médicos para médicos. <br className="hidden md:block" /> Simplicidade e controle total na palma da sua mão.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-12">
            <Link href="/login" className="px-12 py-5 bg-[#3B82F6] text-white font-black uppercase tracking-widest rounded-full shadow-[0_20px_40px_rgba(59,130,246,0.4)] hover:bg-[#2563EB] hover:scale-105 active:scale-95 transition-all text-sm group flex items-center gap-2">
              Começar Gratuitamente
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Mockup Premium (Angled, Glow) */}
            <div className="relative w-full max-w-[280px] md:max-w-[340px] mx-auto group">
              <div className="relative z-10 rounded-[3rem] border-[1px] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden bg-[#020817] aspect-[9/18.5] transform rotate-3d hover:rotate-0 transition-transform duration-1000 ease-out">
                <Image 
                  src="/mockup-app.png"
                  alt="Meu Plantão 3D Preview"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Glow Pulsante Atrás do Mockup */}
              <div className="absolute -inset-10 bg-[#3B82F6]/20 blur-[80px] -z-10 opacity-60 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. PADRONIZAÇÃO DOS CARDS (BG #0F172A, Radius 24, Spacing) */}
      <section id="features" className="max-w-6xl mx-auto py-20 px-6 space-y-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Agenda Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios detalhados para conferência com hospitais.' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0F172A] p-10 rounded-[24px] border border-white/5 flex flex-col items-center text-center space-y-6 hover:border-[#3B82F6]/30 hover:-translate-y-2 transition-all duration-300 group shadow-2xl">
              <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <f.icon size={28} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-base text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CARD DO PRO (Founder Edition, Hierarquia, Escassez) */}
      <section id="pricing" className="py-20 md:py-32 px-6">
        <div className="max-w-[420px] mx-auto relative group">
          {/* Brilho da Oferta */}
          <div className="absolute inset-0 bg-[#3B82F6]/20 blur-[100px] rounded-full" />
          
          <div className="relative bg-[#0F172A] p-10 md:p-12 rounded-[32px] border border-[#3B82F6]/40 shadow-3xl space-y-10 overflow-hidden">
            {/* Badge Premium */}
            <div className="absolute top-8 right-[-45px] rotate-45 bg-[#3B82F6] text-white text-[10px] font-black px-12 py-1.5 uppercase tracking-widest shadow-xl">
              OFERTA DE LANÇAMENTO
            </div>

            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[14px] text-[#94A3B8] line-through opacity-50 uppercase font-black">R$ 29,90</span>
                <span className="text-7xl font-black text-white tracking-tighter">R$ 9,90</span>
                <p className="text-sm text-[#94A3B8] mt-2 font-bold uppercase tracking-widest">por 6 meses • pagamento único</p>
              </div>
            </div>

            {/* Barra de Escassez */}
            <div className="space-y-3">
               <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-blue-400">
                  <span>97 vagas restantes</span>
                  <span>Promoção Limitada</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[12%] bg-[#3B82F6] rounded-full animate-pulse" />
               </div>
            </div>

            <div className="space-y-4 pt-4">
              {['Acesso ilimitado às funções PRO', 'Relatórios financeiros automáticos', 'Suporte VIP prioritário'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300 font-bold">
                  <CheckCircle2 size={18} className="text-[#3B82F6]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/login" 
              className="block w-full py-5 bg-[#3B82F6] text-white font-black rounded-2xl shadow-[0_15px_40px_rgba(59,130,246,0.4)] hover:bg-[#2563EB] hover:scale-[1.02] active:scale-[0.98] transition-all text-center text-xs uppercase tracking-widest"
            >
              Assinar agora com desconto
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ PREMIUM (Accordion Dark, Transição Suave) */}
      <section className="max-w-3xl mx-auto py-20 px-6 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-white">Dúvidas Frequentes</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Informações Essenciais</p>
        </div>
        <div className="space-y-4">
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
      </section>

      {/* 6. FOOTER SaaS (Logo Centralizada, Links Discretos) */}
      <footer className="py-20 px-6 bg-[#0F172A] border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Activity size={24} className="text-[#3B82F6]" />
              <span className="text-xl font-black tracking-tighter uppercase">Meu Plantão</span>
            </div>
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.4em]">Organização para Profissionais da Saúde</p>
          </div>

          <div className="h-px w-full max-w-[200px] mx-auto bg-white/5" />

          <div className="flex flex-wrap justify-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
            <Link href="#" className="hover:text-white transition-colors">Contato</Link>
          </div>

          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} MEU PLANTÃO. TODOS OS DIREITOS RESERVADOS.
          </p>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-[#020817] p-6 animate-fade-in md:hidden">
          <div className="flex justify-between items-center mb-12">
            <span className="text-lg font-black uppercase tracking-tighter">Menu</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex flex-col gap-8 text-2xl font-black uppercase tracking-tighter">
            <Link href="#features" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
            <Link href="#pricing" onClick={() => setIsMenuOpen(false)}>Preços</Link>
            <Link href="/login" className="text-[#3B82F6]">Acessar App</Link>
          </nav>
        </div>
      )}

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
