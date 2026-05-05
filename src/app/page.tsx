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

// Subcomponente de FAQ com fundo sólido
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 shadow-lg w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-base font-bold text-white">{question}</span>
        <Plus size={18} className={`text-blue-500 transition-transform ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="mt-4 text-[13px] text-[#94A3B8] leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Ajustado: Z-Index e Respiro) */}
      <header className="fixed top-0 w-full z-[100] bg-[#050816]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Meu Plantão</span>
          </Link>

          <Link 
            href="/login" 
            className="px-5 py-1.5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Aumento do PT para não encavalar) */}
      <section className="relative pt-40 pb-20 px-6 text-center">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-[32px] md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Recupere seu tempo. <br /> Organize seus plantões.
          </h1>
          
          <p className="text-slate-400 text-sm md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            A plataforma premium para profissionais da saúde que buscam praticidade e controle absoluto.
          </p>

          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563EB] text-white font-bold rounded-2xl shadow-xl hover:bg-[#1E40AF] transition-all text-base mb-16"
          >
            Começar Agora
            <ArrowRight size={18} />
          </Link>

          {/* Mockup do Celular (Corrigido: Caminho e Tamanho) */}
          <div className="w-full max-w-[260px] md:max-w-[320px] mx-auto rounded-[2.5rem] border-4 border-[#1E293B] shadow-2xl overflow-hidden bg-[#0a0f1d] relative aspect-[9/18.5]">
            <Image 
              src="/mockup-app.png"
              alt="App Preview"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* 3. Funcionalidades (Ícones Corrigidos: w-12 h-12) */}
      <section className="w-full max-w-6xl mx-auto py-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-5 hover:border-blue-500/20 transition-all">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Calendar size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Calendário Inteligente</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualize sua escala completa de forma intuitiva e profissional.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-5 hover:border-blue-500/20 transition-all">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
              <LineChart size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Controle Financeiro</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acompanhe e projete seus ganhos mensais automaticamente.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-5 hover:border-blue-500/20 transition-all">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
              <FileText size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Relatórios em PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere PDFs detalhados para conferência com hospitais e grupos médicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Depoimentos (Fundo Sólido) */}
      <section className="w-full py-20 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white text-center">O que estão dizendo</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 shadow-lg flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shrink-0" />
              <div>
                <p className="text-[13px] text-white font-medium italic">"Mudou minha rotina. Finalmente tenho controle total."</p>
                <p className="text-xs text-[#94A3B8] mt-1 font-bold">— Dra. Clara</p>
              </div>
            </div>
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 shadow-lg flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shrink-0" />
              <div>
                <p className="text-[13px] text-white font-medium italic">"A melhor ferramenta para escalas que já utilizei."</p>
                <p className="text-xs text-[#94A3B8] mt-1 font-bold">— Dr. Rodrigo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ (Sólido) */}
      <section className="w-full py-20 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-extrabold text-white text-center mb-10">Dúvidas Frequentes</h2>
          <FAQItem 
            question="Como funciona o período de 6 meses?" 
            answer="Ao assinar a oferta de lançamento por R$ 9,90, você tem acesso PRO completo por 180 dias sem cobranças adicionais."
          />
          <FAQItem 
            question="Posso exportar em PDF?" 
            answer="Sim! O Meu Plantão gera relatórios detalhados em PDF para você enviar para o seu hospital ou grupo médico."
          />
        </div>
      </section>

      {/* 6. Oferta de Lançamento (Card Sólido) */}
      <section className="w-full py-20 px-6 text-center">
        <div className="max-w-lg mx-auto p-10 bg-[#0F172A] rounded-[2.5rem] border border-blue-500/30 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="space-y-2">
            <h4 className="text-xs text-slate-500 uppercase tracking-widest font-bold">Oferta de Lançamento</h4>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white tracking-tighter">R$ 9,90</span>
              <p className="text-[13px] text-slate-400 mt-1">por 6 meses • pagamento único</p>
            </div>
          </div>

          <Link 
            href="/login" 
            className="block w-full py-4 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg hover:bg-[#1E40AF] transition-all text-base"
          >
            Assinar PRO — R$ 9,90
          </Link>
          
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Liberação imediata após o login
          </p>
        </div>
      </section>

      {/* Footer Final */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
