'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useState } from 'react';

// Subcomponente FAQ para organização
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-sm md:text-base font-semibold text-slate-200">{question}</span>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={18} className="text-slate-500" />
        </div>
      </button>
      {isOpen && (
        <div className="mt-3 text-sm text-slate-400 leading-relaxed animate-fade-in">
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
      
      {/* 1. HEADER (Isolado e Mobile-First) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Meu Plantão</span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</a>
          </nav>

          {/* CTA Header */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all">
              Acessar App
            </Link>
            <button className="md:hidden text-slate-400 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-[#050816] pt-24 px-8 md:hidden animate-fade-in">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center mb-4">
               <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Navegação</span>
               <button onClick={() => setIsMenuOpen(false)}><X size={24} /></button>
            </div>
            <a href="#features" className="text-2xl font-bold text-white py-2" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" className="text-2xl font-bold text-white py-2" onClick={() => setIsMenuOpen(false)}>Preços</a>
            <div className="h-px bg-white/5 my-4"></div>
            <Link href="/login" className="w-full py-4 text-center rounded-2xl bg-blue-600 text-white font-bold text-lg">
              Acessar App
            </Link>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION (Impacto Centralizado) */}
      <section className="pt-44 pb-20 px-6 relative">
        {/* Glow sutil de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Oferta de Lançamento
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Organize plantões, escalas e ganhos em um só lugar.
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            A plataforma moderna para profissionais da saúde. <br className="hidden md:block" />
            Simples, rápido e no seu controle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="group px-8 py-4 bg-blue-600 rounded-full text-white font-bold text-base hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
              Começar Agora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE / MOCKUPS (NOVA SEÇÃO) */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative group p-2 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
            <div className="rounded-[2rem] overflow-hidden bg-[#0a0f1d] border border-white/5 aspect-[16/9] relative">
              {/* Placeholder para imagem real */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Image 
                   src="/icons/icon-512x512.png" 
                   alt="App Mockup Placeholder" 
                   width={120} 
                   height={120} 
                   className="grayscale"
                />
              </div>
              {/* Overlay de carregamento/espera */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent"></div>
              
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="space-y-2">
                  <div className="h-2 w-24 bg-white/10 rounded"></div>
                  <div className="h-4 w-48 bg-white/20 rounded"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <Activity size={20} className="text-blue-500" />
                </div>
              </div>
            </div>
            {/* Sombras laterais para profundidade */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-xl -z-10 opacity-50"></div>
          </div>
        </div>
      </section>

      {/* 4. BENEFÍCIOS (Cards Diretos) */}
      <section id="features" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Escalas Inteligentes', desc: 'Gerencie múltiplos locais com um calendário focado em performance.' },
              { icon: TrendingUp, title: 'Controle Financeiro', desc: 'Saiba exatamente quanto vai receber no fim do mês automaticamente.' },
              { icon: FileText, title: 'Relatórios Profissionais', desc: 'Gere PDFs das suas escalas para hospitais e repasses em segundos.' }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-6 text-blue-500">
                  <f.icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CONFIANÇA & FAQ (NOVA SEÇÃO) */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Feito para profissionais da saúde</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">Organize plantões com mais controle e menos estresse.</p>
          </div>

          <div className="space-y-2">
            <FAQItem 
              question="Funciona no celular?" 
              answer="Sim! O Meu Plantão é um PWA moderno que funciona perfeitamente em qualquer smartphone, Android ou iOS." 
            />
            <FAQItem 
              question="Precisa instalar pela App Store?" 
              answer="Não. Basta acessar pelo navegador e 'Adicionar à tela de início' para ter a experiência de um aplicativo nativo." 
            />
            <FAQItem 
              question="Como funciona o PRO?" 
              answer="O plano PRO libera locais ilimitados, alertas inteligentes e exportação de relatórios financeiros detalhados." 
            />
          </div>
        </div>
      </section>

      {/* 6. OFERTA / PLANO PRO (Contraste e Escassez) */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-md mx-auto relative">
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-b from-blue-500/20 to-transparent">
            <div className="bg-[#0a0f1d] rounded-[2.3rem] p-10 border border-white/5 relative overflow-hidden">
              {/* Badge de Escassez */}
              <div className="absolute top-8 right-[-35px] rotate-45 bg-blue-600 text-white text-[10px] font-black px-10 py-1 uppercase tracking-widest shadow-xl">
                Lançamento
              </div>

              <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                  6 meses de PRO inclusos
                </span>
                <h3 className="text-2xl font-black mb-2">Plano PRO</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-500 line-through text-sm">R$ 89,90/ano</span>
                  <span className="text-4xl font-black text-white tracking-tighter">R$ 9,90</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {['Locais ilimitados', 'Alertas de plantão', 'Relatórios financeiros', 'Exportação PDF'].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <span className="text-sm font-medium">{b}</span>
                  </div>
                ))}
              </div>

              <Link href="/login" className="block w-full py-5 bg-blue-600 rounded-2xl text-white font-bold text-center hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
                Assinar Agora
              </Link>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                Primeiros 100 usuários • 97 vagas restantes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA & FOOTER */}
      <section className="py-32 px-6 text-center border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 tracking-tight">Pronto para simplificar sua escala?</h2>
          <Link href="/login" className="inline-block px-10 py-5 bg-white text-[#050816] rounded-full font-bold text-base hover:bg-slate-200 transition-all">
            Começar Agora
          </Link>
          
          <footer className="mt-32 opacity-40">
             <div className="flex items-center justify-center gap-2 mb-4">
               <Activity size={16} className="text-blue-500" />
               <span className="font-bold text-sm tracking-tight">Meu Plantão</span>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
               Sem senha. Sem complicação. Apenas acesso rápido.
             </p>
             <p className="text-[10px] text-slate-600">
               © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
             </p>
          </footer>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}
