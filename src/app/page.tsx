'use client';

import Link from 'next/link';
import { 
  Calendar, 
  LineChart, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Plus
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Navegação) */}
      <header className="w-full fixed top-0 z-50 bg-[#050816]/80 backdrop-blur-md border-b border-white/5">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Calendar size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Meu Plantão</span>
          </Link>

          {/* Botão Entrar */}
          <Link 
            href="/login" 
            className="px-5 py-1.5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-12 px-6 text-center relative">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
            Organize sua escala, controle ganhos e nunca mais perca um plantão.
          </h1>
          
          <p className="mt-6 text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            A solução premium e inteligente para profissionais da saúde que buscam praticidade e organização.
          </p>

          <Link 
            href="/login" 
            className="mt-10 inline-flex items-center justify-center w-full max-w-[320px] py-4 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-[#1E40AF] transition-all text-base"
          >
            Começar Agora
          </Link>
        </div>

        {/* 3. Mockup do App (Placeholder centralizado) */}
        <div className="mt-16 w-full max-w-[280px] md:max-w-[320px] mx-auto relative group">
          <div className="rounded-[2.5rem] p-2 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl">
            <div className="rounded-[2rem] overflow-hidden bg-[#0a0f1d] border border-white/5 aspect-[9/18.5] relative flex flex-col">
              {/* Simulação de Header do App */}
              <div className="p-4 flex justify-between items-center border-b border-white/5">
                <div className="w-6 h-6 rounded bg-white/5" />
                <div className="w-16 h-2 bg-white/10 rounded" />
                <div className="w-6 h-6 rounded bg-white/5" />
              </div>
              {/* Simulação de Conteúdo */}
              <div className="p-4 space-y-4">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(28)].map((_, i) => (
                    <div key={i} className={`aspect-square rounded ${i === 12 ? 'bg-blue-600/40 border border-blue-500' : 'bg-white/5'}`} />
                  ))}
                </div>
                <div className="space-y-2 mt-6">
                  <div className="h-16 w-full bg-blue-600/10 border border-blue-500/20 rounded-xl" />
                  <div className="h-16 w-full bg-white/5 rounded-xl" />
                </div>
              </div>
              {/* Glow interno */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />
            </div>
          </div>
          {/* Brilho atrás do celular */}
          <div className="absolute -inset-10 bg-blue-600/20 blur-[60px] -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </section>

      {/* 4. Features Section (Cards com Ícones Pequenos) */}
      <section className="w-full max-w-6xl mx-auto py-20 px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center hover:border-blue-500/20 transition-all group">
            <div className="w-16 h-16 text-blue-500 bg-[#050816] p-4 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
              <Calendar size={24} />
            </div>
            <div className="mt-8 space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">Calendário Inteligente</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Visualize sua escala completa de forma intuitiva e focada em produtividade.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center hover:border-blue-500/20 transition-all group">
            <div className="w-16 h-16 text-blue-500 bg-[#050816] p-4 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
              <LineChart size={24} />
            </div>
            <div className="mt-8 space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">Controle Financeiro</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Acompanhe e projete seus ganhos mensais automaticamente com base nos plantões.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center hover:border-blue-500/20 transition-all group">
            <div className="w-16 h-16 text-blue-500 bg-[#050816] p-4 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
              <FileText size={24} />
            </div>
            <div className="mt-8 space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">Relatórios Profissionais</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Gere PDFs detalhados das suas escalas para conferência e exportação rápida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Oferta de Lançamento */}
      <section className="w-full py-24 px-6">
        <div className="max-w-md mx-auto text-center space-y-12">
          <h2 className="text-3xl font-bold text-white">Oferta de Lançamento</h2>
          
          <div className="p-10 bg-[#0F172A]/30 rounded-[2.5rem] border border-blue-500/30 relative shadow-[0_0_50px_rgba(37,99,235,0.1)]">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-[#94A3B8] uppercase tracking-[0.2em] font-bold">Oferta de Lançamento</p>
                <h4 className="text-xs text-[#94A3B8]">Plano Semestral PRO</h4>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-white tracking-tighter">R$ 9,90</span>
                <p className="text-sm text-[#94A3B8] mt-2">por 6 meses • pagamento único</p>
              </div>

              <Link 
                href="/login" 
                className="block w-full py-4 bg-[#2563EB] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-[#1E40AF] transition-all text-base"
              >
                Assinar PRO — R$ 9,90
              </Link>
            </div>

            {/* Brilho sutil */}
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="w-full py-16 px-6 text-center border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-8 text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Links</Link>
            <Link href="#" className="hover:text-white transition-colors">Protos</Link>
          </div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
