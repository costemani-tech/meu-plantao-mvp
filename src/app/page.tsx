'use client';

import Link from 'next/link';
import { 
  Calendar, 
  LineChart, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

// Acordeão Moderno para o FAQ
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left focus:outline-none"
      >
        <span className="text-sm font-bold text-white tracking-tight">{question}</span>
        <ChevronDown size={18} className={`text-blue-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-[13px] text-slate-400 leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Premium e Fixo) */}
      <header className="fixed top-0 w-full z-[100] bg-[#050816] border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          {/* Logo Marca */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tighter uppercase">Meu Plantão</span>
          </Link>

          {/* Botão de Ação */}
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
          >
            Acessar Conta
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Foco em Clareza e Espaço) */}
      <section className="relative pt-44 pb-32 px-6 text-center">
        {/* Glow de Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-blue-600/5 blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Sua rotina sob controle
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Recupere seu tempo. <br /> Organize seus plantões.
          </h1>
          
          <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
            A ferramenta essencial para profissionais da saúde que buscam praticidade e controle absoluto da sua jornada.
          </p>

          <div className="pt-8">
            <Link href="/login" className="px-10 py-5 bg-white text-[#050816] rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl">
              Começar Agora
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Funcionalidades (Grid com Espaçamento Real) */}
      <section className="max-w-6xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { icon: Calendar, title: 'Calendário Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios detalhados das suas escalas em segundos.' }
          ].map((f, i) => (
            <div key={i} className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center space-y-6 hover:border-blue-500/20 transition-all group">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <f.icon size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Prova Social (Design de Cartão de Visita) */}
      <section className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto space-y-16">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center tracking-tight">O que dizem os médicos</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0F172A] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
              <p className="text-lg text-white font-medium italic leading-relaxed">
                "O Meu Plantão mudou minha rotina. Finalmente tenho controle total sobre meus ganhos e escalas."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-500">CS</div>
                <div>
                  <p className="text-sm font-bold text-white">Dra. Clara Silveira</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">UTI Adulto</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
              <p className="text-lg text-white font-medium italic leading-relaxed">
                "A melhor ferramenta que já usei. Os relatórios em PDF facilitam muito o fechamento do mês."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-500">RM</div>
                <div>
                  <p className="text-sm font-bold text-white">Dr. Rodrigo Martins</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cirurgia Geral</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ (Limpo e Profissional) */}
      <section className="max-w-3xl mx-auto py-24 px-6 space-y-12">
        <h2 className="text-3xl font-black text-white text-center tracking-tight">Dúvidas Frequentes</h2>
        <div className="space-y-4">
          <FAQItem 
            question="Como funciona o período de 6 meses?" 
            answer="Ao assinar a oferta de lançamento por R$ 9,90, você garante acesso PRO completo por 180 dias. É um pagamento único."
          />
          <FAQItem 
            question="Posso exportar em PDF?" 
            answer="Sim! O Meu Plantão gera relatórios detalhados das suas escalas para você enviar para o hospital."
          />
          <FAQItem 
            question="O acesso é imediato?" 
            answer="Sim. Logo após o login e confirmação da assinatura, todas as funções são liberadas instantaneamente."
          />
        </div>
      </section>

      {/* 6. Oferta de Lançamento (Impacto Máximo) */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-lg mx-auto bg-gradient-to-b from-blue-600 to-blue-800 p-[2px] rounded-[3rem] shadow-[0_0_80px_rgba(37,99,235,0.25)]">
          <div className="bg-[#050816] rounded-[2.9rem] p-12 space-y-10 relative overflow-hidden">
            {/* Badge */}
            <div className="absolute top-8 right-[-45px] rotate-45 bg-white text-blue-600 text-[10px] font-black px-12 py-1.5 uppercase tracking-widest shadow-xl">
              Founder
            </div>

            <div className="space-y-4">
              <h4 className="text-xs text-blue-500 font-black uppercase tracking-[0.3em]">Oferta de Lançamento</h4>
              <div className="flex flex-col items-center">
                <span className="text-8xl font-black text-white tracking-tighter">R$ 9,90</span>
                <p className="text-lg text-slate-400 mt-2 font-medium">por 6 meses • pagamento único</p>
              </div>
            </div>

            <div className="space-y-4 text-left border-t border-white/5 pt-8">
              {['Escalas ilimitadas', 'Relatórios financeiros', 'Sincronização imediata'].map((b) => (
                <div key={b} className="flex items-center gap-3 text-sm text-slate-300 font-bold uppercase tracking-wide">
                  <CheckCircle2 size={18} className="text-blue-500" />
                  {b}
                </div>
              ))}
            </div>

            <Link href="/login" className="block w-full py-6 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-500 transition-all text-lg uppercase tracking-widest">
              Assinar PRO agora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-16 px-6 border-t border-white/5 text-center opacity-40">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
