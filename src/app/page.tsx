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
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

// Subcomponente de FAQ Estilizado (Acordeão Moderno)
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#0F172A]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left focus:outline-none hover:bg-white/[0.02]"
      >
        <span className="text-base font-bold text-white tracking-tight">{question}</span>
        <ChevronDown size={20} className={`text-blue-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-sm text-[#94A3B8] leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Redesenhado: Logo e Entrar) */}
      <header className="fixed top-0 w-full z-[100] bg-[#050816]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-5 md:p-6">
          {/* Logo Mais Visível */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-105">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">MEU PLANTÃO</span>
          </Link>

          {/* Botão Entrar Chamativo (Outlined) */}
          <Link 
            href="/login" 
            className="px-6 py-2 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-sm font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)]"
          >
            Acessar Conta
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Título Ajustado e Sem Botão) */}
      <section className="relative pt-40 pb-20 px-6 text-center">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            Recupere seu tempo. <br /> Organize seus plantões.
          </h1>
          
          <p className="text-[#94A3B8] text-base md:text-xl max-w-xl mx-auto leading-relaxed mb-16">
            A ferramenta essencial para profissionais da saúde que buscam o equilíbrio perfeito entre trabalho e vida pessoal.
          </p>

          {/* Mockup do Celular (Agenda em Português) */}
          <div className="w-full max-w-[260px] md:max-w-[320px] mx-auto rounded-[3rem] border-[6px] border-[#1E293B] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden bg-[#0a0f1d] relative aspect-[9/18.5] transition-transform hover:scale-[1.02] duration-500">
            <Image 
              src="/mockup-app.png"
              alt="Meu Plantão - Agenda"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
          
          {/* Glow de fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-blue-600/5 blur-[120px] -z-10" />
        </div>
      </section>

      {/* 3. Funcionalidades (Mantido conforme solicitado) */}
      <section className="w-full max-w-6xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Calendar, title: 'Calendário Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios Profissionais', desc: 'Gere PDFs detalhados para conferência com hospitais.' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0F172A] p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center space-y-5 hover:border-blue-500/20 transition-all">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                <f.icon size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Depoimentos (Melhorados: Mais Profissionais) */}
      <section className="w-full py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-white">O que dizem os médicos</h2>
            <p className="text-[#94A3B8]">A confiança de quem já transformou sua rotina.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0F172A]/50 p-10 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group hover:bg-[#0F172A] transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Plus size={80} className="text-blue-500" />
              </div>
              <p className="text-lg text-white font-medium italic leading-relaxed mb-8 relative z-10">
                "O Meu Plantão mudou minha rotina. Finalmente tenho controle total sobre meus ganhos e escalas."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30" />
                <div>
                  <p className="text-sm font-bold text-white">Dra. Clara Silveira</p>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">UTI Adulto</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A]/50 p-10 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group hover:bg-[#0F172A] transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Plus size={80} className="text-blue-500" />
              </div>
              <p className="text-lg text-white font-medium italic leading-relaxed mb-8 relative z-10">
                "A melhor ferramenta que já usei. Os relatórios em PDF facilitam muito o fechamento do mês."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30" />
                <div>
                  <p className="text-sm font-bold text-white">Dr. Rodrigo Martins</p>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Cirurgia Geral</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ (Melhorado: Acordeões) */}
      <section className="w-full py-24 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-white">Dúvidas Frequentes</h2>
            <p className="text-[#94A3B8]">Tudo o que você precisa saber sobre o Meu Plantão.</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="Como funciona o período de 6 meses?" 
              answer="Ao assinar a oferta de lançamento por R$ 9,90, você garante acesso PRO completo por 180 dias. É um pagamento único, sem sustos na fatura."
            />
            <FAQItem 
              question="Posso exportar meus dados?" 
              answer="Com certeza. Você pode gerar relatórios detalhados em PDF a qualquer momento para conferência ou arquivo pessoal."
            />
            <FAQItem 
              question="O acesso é imediato?" 
              answer="Sim. Assim que você realiza o login e a assinatura é confirmada, todas as funções PRO são liberadas instantaneamente."
            />
          </div>
        </div>
      </section>

      {/* 6. Oferta de Lançamento (Redesenhada: Chamativa) */}
      <section className="w-full py-24 px-6 text-center">
        <div className="max-w-lg mx-auto relative group">
          {/* Brilho atrás do card */}
          <div className="absolute inset-0 bg-blue-600/20 blur-[80px] rounded-full group-hover:bg-blue-600/30 transition-all duration-500" />
          
          <div className="relative bg-[#050816] p-12 rounded-[3rem] border-2 border-blue-500/50 shadow-2xl space-y-10 overflow-hidden">
            {/* Badge */}
            <div className="absolute top-8 right-[-45px] rotate-45 bg-blue-600 text-white text-[10px] font-black px-12 py-1.5 uppercase tracking-widest shadow-xl">
              Founder Edition
            </div>

            <div className="space-y-4">
              <h4 className="text-sm text-blue-400 font-black uppercase tracking-[0.3em]">Oferta de Lançamento</h4>
              <div className="flex flex-col items-center">
                <span className="text-7xl font-black text-white tracking-tighter">R$ 9,90</span>
                <p className="text-lg text-[#94A3B8] mt-2 font-medium">por 6 meses • pagamento único</p>
              </div>
            </div>

            <div className="space-y-5 text-left border-t border-white/5 pt-10">
              {['Acesso ilimitado às funções PRO', 'Relatórios financeiros automáticos', 'Suporte prioritário'].map((b) => (
                <div key={b} className="flex items-center gap-4 text-sm text-[#94A3B8] font-bold">
                  <CheckCircle2 size={18} className="text-blue-500" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/login" 
              className="block w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-xl uppercase tracking-widest"
            >
              Assinar PRO agora
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CTA Final (O Fechamento) */}
      <section className="py-24 px-6 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="text-3xl font-black text-white">Pronto para organizar sua vida?</h2>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#050816] font-black rounded-2xl shadow-2xl hover:scale-[1.05] transition-all text-xl uppercase tracking-widest"
          >
            Começar Agora
            <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-12 px-6 text-center border-t border-white/5 opacity-50">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} MEU PLANTÃO. TODOS OS DIREITOS RESERVADOS.
        </p>
      </footer>

    </div>
  );
}
