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
    <div className="bg-[#050816] text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden antialiased">
      
      {/* 1. Header (Elegante e Compacto) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar size={18} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">Meu Plantão</span>
          </Link>

          <Link href="/login" className="px-5 py-2 rounded-xl border border-white/10 text-white text-[12px] font-bold hover:bg-white/5 transition-all">
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Fiel à Imagem 2) */}
      <section className="pt-32 pb-12 px-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow suave no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-blue-600/10 blur-[100px] pointer-events-none -z-10" />

        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-[34px] md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Organize sua escala, controle ganhos e nunca mais perca um plantão.
          </h1>
          
          <p className="text-slate-400 text-sm md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            A solução premium e inteligente para profissionais da saúde que buscam praticidade e organização.
          </p>

          <Link href="/login" className="inline-flex items-center justify-center w-full max-w-[320px] py-4 bg-blue-600 rounded-2xl text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all">
            Começar Agora
          </Link>

          {/* 3. Mockup do iPhone (Centralizado) */}
          <div className="mt-16 w-full max-w-[280px] md:max-w-[340px] mx-auto relative animate-float">
            <div className="p-1 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent border border-white/5 shadow-2xl">
              <div className="rounded-[2.8rem] overflow-hidden bg-[#0a0f1d] border border-white/5 aspect-[9/18.5] relative">
                 <Image 
                   src="/mockup-iphone.png" 
                   alt="App Preview" 
                   fill
                   className="object-cover"
                   priority
                 />
              </div>
            </div>
            {/* Sombra de profundidade */}
            <div className="absolute -inset-10 bg-blue-600/10 blur-[60px] -z-10 opacity-60" />
          </div>
        </div>
      </section>

      {/* 4. Funcionalidades (Cards Verticalizados conforme Ref) */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Calendário Inteligente', desc: 'Visualize sua escala completa de forma intuitiva e profissional.' },
            { icon: LineChart, title: 'Controle Financeiro', desc: 'Acompanhe e projete seus ganhos mensais automaticamente.' },
            { icon: FileText, title: 'Relatórios Profissionais', desc: 'Gere PDFs detalhados das suas escalas para exportação rápida.' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0a0f1d] p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-blue-500/20 transition-all">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                <f.icon size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Oferta de Lançamento (IDÊNTICO À REFERÊNCIA) */}
      <section id="pricing" className="py-20 px-6 text-center">
        <div className="w-full max-w-md mx-auto space-y-10">
          <h2 className="text-3xl font-bold tracking-tight">Oferta de Lançamento</h2>
          
          <div className="p-1 rounded-[2.5rem] bg-blue-600/20 border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
            <div className="bg-[#050816] rounded-[2.3rem] p-10 space-y-8">
              <div className="space-y-2">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Oferta de Lançamento</p>
                 <div className="flex flex-col items-center">
                    <span className="text-5xl font-black text-white tracking-tighter">R$ 9,90</span>
                    <p className="text-[13px] text-slate-400 mt-2 font-medium">por 6 meses • pagamento único</p>
                 </div>
              </div>

              <div className="h-px bg-white/5" />

              <Link href="/login" className="block w-full py-4 bg-blue-600 rounded-xl text-white font-bold text-center shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
                Assinar PRO — R$ 9,90
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer (Simples conforme Imagem 2) */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-8 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Links</Link>
            <Link href="#" className="hover:text-white transition-colors">Protos</Link>
          </div>
          <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
      `}</style>

    </div>
  );
}
