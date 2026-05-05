'use client';

import Link from 'next/link';
import { 
  Calendar, 
  LineChart, 
  FileText, 
  CheckCircle2, 
  Activity,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30">
      
      {/* 1. Header (Navegação) */}
      <header className="w-full">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between p-6">
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
            className="px-6 py-2 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-white/5 hover:border-white/20 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (A Promessa) */}
      <section className="relative overflow-hidden">
        {/* Glow de Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#2563EB]/10 blur-[120px] -z-10" />
        
        <div className="w-full max-w-7xl mx-auto py-24 px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tighter">
            Organize plantões, escalas <br className="hidden md:block" /> e ganhos em um só lugar.
          </h1>
          
          <p className="mt-6 text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
            A plataforma moderna para profissionais da saúde que buscam controle absoluto da sua rotina. 
            Sem complicação, apenas acesso rápido.
          </p>

          <Link 
            href="/login" 
            className="mt-12 inline-flex items-center gap-3 px-10 py-4 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.3)] hover:bg-[#1E40AF] hover:-translate-y-1 transition-all text-lg"
          >
            Começar Agora
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* 3. Features Section (Cards Premium) */}
      <section className="w-full max-w-7xl mx-auto py-20 px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-2xl hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
              <Calendar className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Escalas Inteligentes</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Gerencie múltiplos locais com um calendário visual intuitivo focado em produtividade.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-2xl hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
              <LineChart className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Controle Financeiro</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Saiba exatamente quanto vai receber no fim do mês com cálculos automáticos baseados nos seus plantões.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0F172A] p-8 rounded-2xl border border-white/5 space-y-5 shadow-2xl hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 text-[#2563EB] bg-[#050816] p-2.5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
              <FileText className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Relatórios Profissionais</h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Gere PDFs detalhados das suas escalas para conferência com hospitais e grupos médicos.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Oferta de Lançamento (Página de Conversão) */}
      <section className="w-full py-24 bg-[#0F172A] px-6">
        <div className="max-w-lg mx-auto p-10 bg-[#050816] rounded-2xl border-2 border-[#2563EB] shadow-[0_0_50px_rgba(37,99,235,0.2)] text-center space-y-8 relative overflow-hidden">
          {/* Badge de Oferta */}
          <div className="absolute top-6 right-[-35px] rotate-45 bg-[#2563EB] text-white text-[10px] font-black px-10 py-1 uppercase tracking-widest shadow-xl">
            Founder Edition
          </div>

          <div className="space-y-2">
            <h4 className="text-xl text-[#94A3B8] font-medium uppercase tracking-widest">Oferta Especial</h4>
            <div className="flex flex-col items-center">
              <span className="text-7xl font-extrabold text-white tracking-tighter">R$ 9,90</span>
              <p className="text-lg text-[#94A3B8] mt-2 font-medium">por 6 meses • pagamento único</p>
            </div>
          </div>

          <div className="space-y-4 text-left border-t border-white/5 pt-8">
            {[
              'Acesso PRO completo por 180 dias',
              'Relatórios ilimitados em PDF',
              'Alertas de plantão via Push',
              'Sincronização em múltiplos dispositivos'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#94A3B8]">
                <CheckCircle2 size={18} className="text-[#2563EB] flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link 
            href="/login" 
            className="block w-full py-5 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:bg-[#1E40AF] hover:scale-[1.02] active:scale-[0.98] transition-all text-xl"
          >
            Assinar PRO — R$ 9,90
          </Link>
          
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-[0.2em] font-bold">
            Liberação imediata após o login
          </p>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="w-full py-12 px-6 text-center border-t border-white/5">
        <p className="text-sm text-[#94A3B8]">
          © {new Date().getFullYear()} Meu Plantão. Desenvolvido para transformar a rotina médica.
        </p>
      </footer>

    </div>
  );
}
