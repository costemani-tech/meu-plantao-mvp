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
  Plus
} from 'lucide-react';
import { useState } from 'react';

// Subcomponente FAQ para organização (opcional, mantendo para estrutura)
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-sm font-semibold text-slate-200">{question}</span>
        <Plus size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="mt-3 text-[13px] text-slate-400 leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. HEADER (High-End SaaS) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/60">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Clicável */}
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Calendar size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Meu Plantão</span>
          </Link>

          {/* Botão Entrar Visível */}
          <Link 
            href="/login" 
            className="px-6 py-2 bg-white/[0.08] text-white rounded-2xl text-sm font-bold hover:bg-white/[0.12] transition-all border border-white/5"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION (Impacto e Mockup) */}
      <section className="pt-44 pb-20 px-6 relative overflow-hidden">
        {/* Glow central sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            Sua Escala Médica <br className="hidden md:block" /> sem Complicações.
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Organize seus plantões, projete seus ganhos <br className="hidden md:block" /> e recupere seu tempo.
          </p>

          <Link href="/login" className="px-10 py-4 bg-blue-600 rounded-2xl text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all mb-20">
            Começar Agora
          </Link>

          {/* MOCKUP IPHONE (Angulado e Premium) */}
          <div className="relative w-full max-w-[340px] md:max-w-[420px] mx-auto group animate-float transform perspective-1000">
            <div className="relative z-10 p-1 rounded-[3rem] bg-gradient-to-b from-white/20 to-transparent border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] rotate-[-2deg]">
              <div className="rounded-[2.8rem] overflow-hidden bg-[#0a0f1d] border border-white/5 aspect-[9/19.5] relative">
                 <Image 
                   src="/mockup-iphone.png" 
                   alt="App Mockup" 
                   fill
                   className="object-cover"
                   priority
                 />
              </div>
            </div>
            {/* Brilho e Aura atrás do mockup */}
            <div className="absolute -inset-10 bg-blue-600/20 blur-[80px] -z-10 opacity-60" />
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION (Container Alinhado) */}
      <section id="features" className="py-24 px-6 bg-white/[0.01]">
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            
            {/* Feature 1 */}
            <div className="w-full bg-[#0F172A] p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6 hover:border-blue-500/20 transition-all group shadow-xl">
              <div className="w-12 h-12 text-blue-500 bg-[#050816] p-3 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                <Calendar size={24} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Calendário Inteligente</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                  Visualize sua escala completa de forma intuitiva e profissional.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="w-full bg-[#0F172A] p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6 hover:border-blue-500/20 transition-all group shadow-xl text-[#94A3B8]">
              <div className="w-12 h-12 text-blue-500 bg-[#050816] p-3 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                <LineChart size={24} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Controle Financeiro</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                  Acompanhe e projete seus ganhos mensais automaticamente.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="w-full bg-[#0F172A] p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-6 hover:border-blue-500/20 transition-all group shadow-xl text-[#94A3B8]">
              <div className="w-12 h-12 text-blue-500 bg-[#050816] p-3 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                <FileText size={24} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Relatórios Profissionais</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                  Gere PDFs detalhados das suas escalas para exportação rápida.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. OFERTA DE LANÇAMENTO (Correção de Layout) */}
      <section id="pricing" className="py-32 px-6">
        <div className="w-full max-w-md mx-auto text-center space-y-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">Oferta de Lançamento</h2>
          
          <div className="p-1 rounded-[2.5rem] bg-blue-600/20 border border-blue-500/30 shadow-[0_0_60px_rgba(37,99,235,0.15)]">
            <div className="bg-[#050816] rounded-[2.3rem] p-12 space-y-10 relative overflow-hidden">
              <div className="absolute top-8 right-[-40px] rotate-45 bg-blue-600 text-white text-[10px] font-black px-12 py-1 uppercase tracking-widest">
                Founder
              </div>

              <div className="space-y-2">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Oferta de Lançamento</p>
                 <div className="flex flex-col items-center">
                    <span className="text-6xl font-black text-white tracking-tighter">R$ 9,90</span>
                    <p className="text-base text-slate-400 mt-2 font-medium">por 6 meses • pagamento único</p>
                 </div>
              </div>

              <div className="space-y-4 text-left border-t border-white/5 pt-10">
                {['Locais ilimitados', 'Alertas de plantão', 'Relatórios financeiros', 'Exportação PDF'].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <Link href="/login" className="block w-full py-5 bg-blue-600 rounded-2xl text-white font-bold text-center shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all text-lg">
                Assinar PRO — R$ 9,90
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER (Discreto e Premium) */}
      <footer className="py-16 px-6 border-t border-white/5 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
          <div className="flex gap-10 text-[11px] text-slate-600 font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">Links</Link>
          </div>
          <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(-2deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

    </div>
  );
}
