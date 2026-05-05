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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (DNA do App: Blur e Simplicidade) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tighter uppercase">Meu Plantão</span>
          </Link>

          <Link 
            href="/login" 
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
          >
            Acessar Conta
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Clean, Respiro e Impacto) */}
      <section className="relative pt-44 pb-20 md:pt-60 md:pb-32 px-6">
        {/* Glow Central de Profundidade */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-blue-600/10 blur-[140px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Recupere seu tempo. <br /> Organize seus plantões.
            </h1>
            <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              A ferramenta inteligente feita por quem entende a rotina médica. 
              Simples, rápida e poderosa.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <Link href="/login" className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all text-sm">
              Começar Agora Gratuitamente
            </Link>
          </div>

          {/* Mockup Real do Calendário (DNA do App) */}
          <div className="pt-20 max-w-[280px] md:max-w-[340px] mx-auto group">
            <div className="relative z-10 rounded-[2.8rem] border-[4px] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden bg-[#050816] aspect-[9/18.5]">
              <Image 
                src="/mockup-app.png"
                alt="Meu Plantão Calendar Preview"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
            </div>
            {/* Glow sutil atrás do celular */}
            <div className="absolute -inset-10 bg-blue-600/20 blur-[80px] -z-10 opacity-60" />
          </div>
        </div>
      </section>

      {/* 3. Funcionalidades (Cards Menores e Mais Premium) */}
      <section className="max-w-6xl mx-auto py-20 md:py-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Calendar, title: 'Agenda Inteligente', desc: 'Sua escala em um calendário limpo e focado.' },
            { icon: LineChart, title: 'Cálculo de Ganhos', desc: 'Saiba exatamente quanto vai receber no fim do mês.' },
            { icon: FileText, title: 'Relatórios em PDF', desc: 'Gere relatórios profissionais em um clique.' }
          ].map((f, i) => (
            <div key={i} className="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/[0.08] flex flex-col items-center text-center space-y-6 hover:bg-white/[0.05] transition-all group">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <f.icon size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Oferta de Lançamento (DNA do Paywall do App) */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-md mx-auto relative group">
          {/* Aura de Glow */}
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-all duration-500" />
          
          <div className="relative bg-[#050816] p-12 rounded-[3rem] border border-blue-500/30 shadow-2xl space-y-12">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Founder Edition</p>
              <div className="flex flex-col items-center">
                <span className="text-7xl font-bold text-white tracking-tighter">R$ 9,90</span>
                <p className="text-base text-slate-400 mt-2 font-medium">por 6 meses • pagamento único</p>
              </div>
            </div>

            <div className="space-y-5 text-left border-t border-white/5 pt-10">
              {['Escalas ilimitadas', 'Cálculo financeiro automático', 'Suporte prioritário'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300 font-semibold">
                  <CheckCircle2 size={18} className="text-blue-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/login" 
              className="block w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-center text-sm uppercase tracking-widest"
            >
              Assinar PRO — R$ 9,90
            </Link>
          </div>
        </div>
      </section>

      {/* Footer (DNA do App: Discreto) */}
      <footer className="py-20 px-6 border-t border-white/5 text-center opacity-40">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Activity size={16} className="text-blue-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Meu Plantão</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>

    </div>
  );
}
