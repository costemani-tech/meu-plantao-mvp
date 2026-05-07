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
    <div className="bg-[#0A1128]/80 backdrop-blur-md rounded-[24px] border border-[#3B82F6]/15 overflow-hidden transition-all duration-300 hover:border-[#3B82F6]/30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className="text-base font-bold text-white">{question}</span>
        <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={24} className="text-[#3B82F6]" />
        </div>
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-[#94A3B8] text-sm leading-relaxed font-medium">
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
      <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
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
            <div className="flex flex-col items-center gap-3">
              <Link href="/login" className="px-8 py-4 bg-[#3B82F6] text-white font-semibold rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:bg-[#2563EB] hover:scale-105 active:scale-95 transition-all text-base group flex items-center gap-2">
                Começar Gratuitamente
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-sm font-medium text-[#94A3B8]">Sem cartão • acesso imediato</span>
            </div>

            {/* Mockup Premium */}
            <div className="relative w-full max-w-[260px] md:max-w-[320px] mx-auto group">
              <div className="relative z-10 rounded-[2.5rem] border border-[#3B82F6]/15 shadow-[0_20px_60px_rgba(59,130,246,0.15)] overflow-hidden bg-[#0A1128]/50 backdrop-blur-sm aspect-[9/18.5] flex items-center justify-center p-3 transform transition-transform duration-1000 ease-out">
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
      <section id="features" className="max-w-5xl mx-auto py-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Calendar, title: 'Agenda Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios detalhados para conferência com hospitais.' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0A1128]/60 backdrop-blur-md p-8 rounded-[24px] border border-[#3B82F6]/15 flex flex-col items-center text-center gap-6 hover:border-[#3B82F6]/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <f.icon size={28} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-sm font-medium text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CARD DO PRO */}
      <section id="pricing" className="py-20 md:py-32 px-6">
        <div className="max-w-[420px] mx-auto relative group">
          {/* Brilho da Oferta */}
          <div className="absolute inset-0 bg-[#3B82F6]/20 blur-[100px] rounded-full" />
          
          <div className="relative bg-[#0A1128]/80 backdrop-blur-xl p-8 md:p-10 rounded-[32px] border border-[#3B82F6]/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col gap-8 overflow-hidden">
            
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold uppercase tracking-wider">
                <span>🔥</span> Oferta de lançamento
              </div>
              <h2 className="text-2xl font-bold text-white">Plano PRO</h2>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-start justify-center gap-1">
                <span className="text-xl text-slate-400 font-medium mt-2">R$</span>
                <span className="text-6xl font-bold text-white tracking-tighter">9,90</span>
              </div>
              <p className="text-sm text-[#94A3B8] font-medium">6 meses de acesso • pagamento único</p>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
              {[
                'Relatórios financeiros', 
                'PDF profissional', 
                'Locais ilimitados', 
                'Suporte prioritário'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                  <CheckCircle2 size={20} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <Link 
                href="/login" 
                className="w-full py-4 bg-[#3B82F6] text-white font-semibold rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:bg-[#2563EB] hover:scale-[1.02] active:scale-[0.98] transition-all text-center text-base"
              >
                Garantir Oferta
              </Link>
              <p className="text-center text-xs text-[#3B82F6] font-semibold">
                97 vagas restantes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ PREMIUM */}
      <section className="max-w-3xl mx-auto py-20 px-6">
        <div className="flex flex-col gap-10">
          <div className="text-center flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-white">Dúvidas Frequentes</h2>
            <p className="text-[#94A3B8] font-medium text-sm">Informações Essenciais</p>
          </div>
          <div className="flex flex-col gap-5">
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
      <footer className="py-20 px-6 bg-[#02050A] text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-xl font-bold tracking-tight text-white">Meu Plantão</span>
          </div>
          
          <p className="text-[#94A3B8] text-sm font-medium">
            Organização inteligente para profissionais da saúde
          </p>
          
          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
            <Link href="#" className="hover:text-white transition-colors">Contato</Link>
          </div>
          
          <p className="text-xs text-slate-700 font-medium mt-4">
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
