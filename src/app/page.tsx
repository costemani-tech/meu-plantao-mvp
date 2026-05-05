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

// Subcomponente de FAQ para evitar repetição
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 shadow-lg w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-lg font-bold text-white">{question}</span>
        <Plus size={20} className={`text-blue-500 transition-transform ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="mt-4 text-[#94A3B8] leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Corrigido: Fundo Sólido e Blur) */}
      <header className="fixed top-0 w-full z-50 bg-[#050816]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Meu Plantão</span>
          </Link>

          {/* Botão Entrar */}
          <Link 
            href="/login" 
            className="px-6 py-2 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-white/5 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (A Promessa + Mockup Proporcional) */}
      <section className="relative pt-32 pb-24">
        <div className="w-full max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Recupere seu tempo. <br /> Organize seus plantões.
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            A plataforma definitiva para profissionais da saúde que buscam praticidade. 
            Gerencie escalas, projete ganhos e gere relatórios.
          </p>

          <Link 
            href="/login" 
            className="mt-10 inline-flex items-center gap-2 px-10 py-4 bg-[#2563EB] text-white font-bold rounded-2xl shadow-lg hover:bg-[#1E40AF] transition-all text-lg"
          >
            Começar Agora
            <ArrowRight size={20} />
          </Link>

          {/* Mockup do Celular (Tamanho Restrito e Borda) */}
          <div className="mt-16 w-full max-w-[280px] md:max-w-[320px] mx-auto rounded-[2.5rem] border-4 border-[#1E293B] shadow-2xl overflow-hidden bg-[#0a0f1d] relative aspect-[9/19]">
            <Image 
              src="/mockup-app.png"
              alt="App Preview"
              fill
              className="object-cover"
              priority
            />
            {/* Glow sutil atrás */}
            <div className="absolute -inset-10 bg-blue-600/10 blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* 3. Features Section (Cards Preenchidos bg-[#0F172A]) */}
      <section className="w-full max-w-7xl mx-auto py-20 px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-xl transition-all hover:border-blue-500/30">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5">
              <Calendar className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Calendário Inteligente</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Visualize sua escala completa em um calendário focado em produtividade.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-xl transition-all hover:border-blue-500/30">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5">
              <LineChart className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Controle Financeiro</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Acompanhe seu faturamento projetado automaticamente com base nos seus plantões.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-xl transition-all hover:border-blue-500/30">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5">
              <FileText className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Relatórios em PDF</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Gere PDFs detalhados para conferência com hospitais e grupos médicos.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Depoimentos (Fundo Preenchido) */}
      <section className="w-full py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center">O que estão dizendo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 shadow-lg flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shrink-0" />
              <div>
                <p className="text-white font-medium italic">"Mudou minha rotina. Finalmente tenho controle total."</p>
                <p className="text-sm text-[#94A3B8] mt-2 font-bold">— Dra. Clara</p>
              </div>
            </div>
            <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 shadow-lg flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shrink-0" />
              <div>
                <p className="text-white font-medium italic">"A melhor ferramenta para escalas que já utilizei."</p>
                <p className="text-sm text-[#94A3B8] mt-2 font-bold">— Dr. Rodrigo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ (Cards Preenchidos) */}
      <section className="w-full py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">Dúvidas Frequentes</h2>
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

      {/* 6. Oferta de Lançamento (Card Sólido e Botão Destaque) */}
      <section className="w-full py-24 bg-[#0F172A] px-6 text-center border-t border-white/5">
        <div className="max-w-lg mx-auto p-12 bg-[#050816] rounded-3xl border-2 border-[#2563EB]/50 shadow-2xl space-y-10 relative overflow-hidden">
          {/* Badge */}
          <div className="absolute top-6 right-[-35px] rotate-45 bg-[#2563EB] text-white text-[10px] font-black px-10 py-1 uppercase tracking-widest">
            Founder Edition
          </div>

          <div className="space-y-4">
            <h4 className="text-xl text-[#94A3B8] font-bold uppercase tracking-widest">Oferta de Lançamento</h4>
            <div className="flex flex-col items-center">
              <span className="text-7xl font-extrabold text-white tracking-tighter">R$ 9,90</span>
              <p className="text-lg text-[#94A3B8] mt-2 font-medium">por 6 meses • pagamento único</p>
            </div>
          </div>

          <Link 
            href="/login" 
            className="block w-full py-5 bg-[#2563EB] text-white font-bold rounded-2xl shadow-lg hover:bg-[#1E40AF] transition-all text-xl"
          >
            Assinar PRO — R$ 9,90
          </Link>
          
          <p className="text-[11px] text-[#94A3B8] uppercase tracking-[0.2em] font-bold">
            Liberação imediata após o login
          </p>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="w-full py-12 px-6 text-center border-t border-white/5">
        <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
