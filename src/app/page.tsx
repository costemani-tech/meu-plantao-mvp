'use client';

import Link from 'next/link';
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { useState } from 'react';

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-sm font-semibold text-slate-200 pr-4">{question}</span>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#050816] text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. HEADER (Mobile-First) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Reduzida */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">Meu Plantão</span>
          </Link>

          {/* CTA & Menu */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-1.5 rounded-full border border-white/10 text-white text-[12px] font-bold hover:bg-white/5 transition-all">
              Acessar App
            </Link>
            <button className="text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-[#050816] pt-20 px-6 md:hidden animate-fade-in">
          <div className="flex flex-col gap-6 w-full max-w-[420px] mx-auto">
            <div className="flex justify-between items-center mb-2">
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Menu Principal</span>
               <button onClick={() => setIsMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
            </div>
            <a href="#features" className="text-2xl font-bold text-white border-b border-white/5 pb-4" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" className="text-2xl font-bold text-white border-b border-white/5 pb-4" onClick={() => setIsMenuOpen(false)}>Preços</a>
            <Link href="/login" className="w-full py-4 mt-4 text-center rounded-xl bg-blue-600 text-white font-bold text-lg">
              Entrar no Sistema
            </Link>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION (Centralizado Mobile) */}
      <section className="pt-32 pb-12 px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-blue-400 text-[9px] font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Oferta de Lançamento
          </div>
          
          <h1 className="text-[34px] md:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.15]">
            Organize plantões, escalas e ganhos em um só lugar.
          </h1>
          
          <p className="text-slate-400 text-sm md:text-lg mb-8 leading-relaxed max-w-[320px]">
            A plataforma moderna para profissionais da saúde. Simples, rápido e no seu controle.
          </p>

          <Link href="/login" className="flex items-center justify-center w-full max-w-[320px] h-14 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white font-bold text-base shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
            Começar Agora
            <ArrowRight size={18} className="ml-2" />
          </Link>

          {/* 3. MOCKUP (Imagem Ajustada) */}
          <div className="mt-12 w-full max-w-[320px] relative">
            <div className="p-1 rounded-[2rem] bg-white/[0.02] border border-white/5">
              <div className="rounded-[1.8rem] overflow-hidden bg-[#0a0f1d] border border-white/5 aspect-video flex items-center justify-center relative">
                <Activity size={40} className="text-blue-600 opacity-20" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="h-1.5 w-16 bg-white/10 rounded"></div>
                  <div className="h-1.5 w-8 bg-blue-600/30 rounded"></div>
                </div>
              </div>
            </div>
            {/* Glow sutil */}
            <div className="absolute -inset-4 bg-blue-600/5 blur-2xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* 4. BENEFÍCIOS (Cards Mobile-First) */}
      <section id="features" className="py-16 px-6 bg-white/[0.01]">
        <div className="w-full max-w-[420px] mx-auto flex flex-col gap-6">
          <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Tudo em um só app</h2>
          {[
            { icon: Calendar, title: 'Escalas Inteligentes', desc: 'Gerencie múltiplos locais com um calendário focado em performance.' },
            { icon: TrendingUp, title: 'Controle Financeiro', desc: 'Saiba exatamente quanto vai receber no fim do mês automaticamente.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere PDFs das suas escalas para hospitais e repasses em segundos.' }
          ].map((f, i) => (
            <div key={i} className="p-7 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center w-full">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-5 text-blue-500">
                <f.icon size={22} strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold mb-2 text-white">{f.title}</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ (Mobile-First) */}
      <section className="py-20 px-6">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Perguntas comuns</h2>
            <p className="text-slate-400 text-[13px]">Tire suas dúvidas rápidas abaixo.</p>
          </div>

          <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5">
            <FAQItem 
              question="Funciona no celular?" 
              answer="Sim! O Meu Plantão é um PWA moderno que funciona perfeitamente em qualquer smartphone." 
            />
            <FAQItem 
              question="Precisa instalar?" 
              answer="Não. Basta acessar pelo navegador e 'Adicionar à tela de início' para ter o ícone no seu celular." 
            />
            <FAQItem 
              question="Como funciona o PRO?" 
              answer="O plano PRO libera locais ilimitados, alertas inteligentes e exportação de PDFs financeiros." 
            />
          </div>
        </div>
      </section>

      {/* 6. OFERTA / PLANO PRO (Vertical) */}
      <section id="pricing" className="py-16 px-6">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="bg-[#0a0f1d] rounded-[2.5rem] p-8 border border-blue-500/20 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-6 right-[-30px] rotate-45 bg-blue-600 text-[9px] font-black px-8 py-1 uppercase tracking-widest">
              PRO
            </div>

            <div className="mb-8 flex flex-col items-center">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase tracking-widest mb-4">
                6 meses inclusos
              </span>
              <h3 className="text-xl font-bold mb-4">Plano Anual PRO</h3>
              
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500 line-through mb-1">De R$ 89,90/ano</span>
                <span className="text-4xl font-bold text-white mb-2">R$ 9,90<span className="text-lg text-slate-400 font-normal">/mês</span></span>
              </div>
            </div>

            <div className="space-y-4 mb-10 w-full px-2">
              {['Locais ilimitados', 'Alertas de plantão', 'Relatórios financeiros', 'Exportação PDF'].map((b) => (
                <div key={b} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle2 size={16} className="text-blue-500" />
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </div>

            <Link href="/login" className="w-full max-w-[280px] py-4 bg-blue-600 rounded-xl text-white font-bold text-center active:scale-95 transition-transform shadow-lg shadow-blue-600/20">
              Assinar Agora
            </Link>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              97 vagas restantes
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER (Padding Ajustado) */}
      <footer className="pb-12 pt-8 px-6 text-center border-t border-white/5">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity size={16} className="text-blue-500" />
            <span className="font-bold text-sm tracking-tight">Meu Plantão</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 leading-relaxed">
            Sem senha. Sem complicação. <br/> Apenas acesso rápido.
          </p>
          <p className="text-[9px] text-slate-700">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        html { scroll-behavior: smooth; }
      `}</style>

    </div>
  );
}
