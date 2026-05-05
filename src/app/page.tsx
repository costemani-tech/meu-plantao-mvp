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
      
      {/* 1. Header (Premium & Transparent) */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#050816]/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Calendar size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Meu Plantão</span>
          </Link>

          <Link 
            href="/login" 
            className="px-6 py-2 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Eção e Humanização) */}
      <section className="relative pt-44 pb-32">
        {/* Glow de fundo atrás do título */}
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] -z-10" />
        
        <div className="w-full max-w-7xl mx-auto py-32 px-6 flex flex-col md:flex-row items-center gap-16 text-center md:text-left">
          {/* Lado Esquerdo: Conteúdo */}
          <div className="flex-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              Recupere seu tempo. <br /> Organize seus plantões com inteligência.
            </h1>
            <p className="text-[#94A3B8] text-lg md:text-xl max-w-xl leading-relaxed">
              A plataforma definitiva para profissionais da saúde que não abrem mão da organização e do controle financeiro.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:bg-[#1E40AF] hover:scale-105 transition-all text-lg flex items-center justify-center gap-2">
                Começar Agora
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Lado Direito: Imagem Humanizada */}
          <div className="flex-1 relative group">
            <div className="relative z-10 w-full rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/5 aspect-[4/3]">
              <Image 
                src="/hero-doctor.png"
                alt="Profissional de saúde usando o app"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Glow decorativo */}
            <div className="absolute -inset-4 bg-blue-600/20 blur-3xl -z-10 opacity-50" />
          </div>
        </div>
      </section>

      {/* 3. Features Section (Cards Premium e Mockups) */}
      <section className="bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto py-40 px-6">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Tecnologia a serviço da sua rotina</h2>
            <p className="text-[#94A3B8] text-lg">Tudo o que você precisa em um único lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1: Calendário */}
            <div className="bg-[#0F172A] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl flex flex-col items-center text-center group hover:border-blue-500/30 transition-all">
              <div className="w-full aspect-[9/12] relative rounded-2xl overflow-hidden bg-[#050816] border border-white/5">
                <Image src="/mockup-iphone.png" alt="Mockup Calendário" fill className="object-cover p-4 group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="space-y-4">
                <Calendar className="w-10 h-10 text-[#2563EB] mx-auto" />
                <h3 className="text-2xl font-bold text-white">Calendário Inteligente</h3>
                <p className="text-[#94A3B8]">Visualize sua escala completa de forma intuitiva e profissional.</p>
              </div>
            </div>

            {/* Card 2: Financeiro */}
            <div className="bg-[#0F172A] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl flex flex-col items-center text-center group hover:border-blue-500/30 transition-all">
              <div className="w-full aspect-[9/12] relative rounded-2xl overflow-hidden bg-[#050816] border border-white/5">
                 <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-white/5">
                       <LineChart className="w-20 h-20 text-blue-500 opacity-40" />
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                <LineChart className="w-10 h-10 text-[#2563EB] mx-auto" />
                <h3 className="text-2xl font-bold text-white">Controle Financeiro</h3>
                <p className="text-[#94A3B8]">Acompanhe e projete seus ganhos mensais automaticamente.</p>
              </div>
            </div>

            {/* Card 3: Relatórios */}
            <div className="bg-[#0F172A] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl flex flex-col items-center text-center group hover:border-blue-500/30 transition-all">
              <div className="w-full aspect-[9/12] relative rounded-2xl overflow-hidden bg-[#050816] border border-white/5">
                 <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400/20 to-blue-800/20 rounded-xl flex items-center justify-center border border-white/5">
                       <FileText className="w-20 h-20 text-blue-400 opacity-40" />
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                <FileText className="w-10 h-10 text-[#2563EB] mx-auto" />
                <h3 className="text-2xl font-bold text-white">Relatórios Profissionais</h3>
                <p className="text-[#94A3B8]">Gere PDFs detalhados das suas escalas para exportação rápida.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Oferta de Lançamento (Impacto Máximo) */}
      <section className="py-40 px-6 relative">
        {/* Glow atrás do preço */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-full max-w-xl h-96 bg-blue-600/10 blur-[140px]" />
        </div>

        <div className="max-w-lg mx-auto p-12 bg-[#050816] rounded-[3rem] border-4 border-[#2563EB] shadow-[0_40px_100px_rgba(37,99,235,0.2)] text-center space-y-10 relative overflow-hidden">
          {/* Badge de Destaque */}
          <div className="absolute top-10 right-[-40px] rotate-45 bg-[#2563EB] text-white text-[10px] font-black px-12 py-1 uppercase tracking-widest">
            Founder Edition
          </div>

          <div className="space-y-2">
            <h4 className="text-xl text-[#94A3B8] font-bold uppercase tracking-widest">Oferta de Lançamento</h4>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black text-white tracking-tighter">R$ 9,90</span>
              <p className="text-xl text-[#94A3B8] mt-4 font-medium leading-relaxed">
                por 6 meses • pagamento único
              </p>
            </div>
          </div>

          <div className="space-y-4 text-left border-t border-white/5 pt-10">
            {['Acesso total ilimitado', 'Sincronização em nuvem', 'Suporte prioritário', 'Sem mensalidades ocultas'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 font-medium">
                <CheckCircle2 size={20} className="text-[#2563EB]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link href="/login" className="block w-full py-5 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:bg-[#1E40AF] hover:scale-105 transition-all text-xl">
            Assinar PRO — R$ 9,90
          </Link>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-20 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center">
            <Calendar size={12} className="text-blue-500" />
          </div>
          <span className="font-bold text-white tracking-tight">Meu Plantão</span>
        </div>
        <p className="text-sm text-slate-600 font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
