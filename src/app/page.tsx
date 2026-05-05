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
  Bell,
  Smartphone,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Transparente e Elegante) */}
      <header className="w-full fixed top-0 z-[100] border-b border-white/[0.05] bg-[#050816]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tighter">Meu Plantão</span>
          </Link>

          <Link 
            href="/login" 
            className="px-6 py-2 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-white/5 hover:border-white/20 transition-all shadow-sm"
          >
            Acessar App
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (A Primeira Impressão High-End) */}
      <section className="relative pt-44 pb-32">
        {/* Glows Atmosféricos */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-40 right-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-10">
            {/* Tag Lançamento */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
              <Star size={12} className="text-blue-500 fill-blue-500" />
              Lançamento Founder Edition
            </div>

            {/* Título com Gradiente */}
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent leading-[0.95] max-w-4xl">
              Organize seus <br className="hidden md:block" /> plantões com luxo.
            </h1>

            {/* Subtítulo Relaxado */}
            <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl leading-relaxed font-medium">
              A plataforma definitiva para médicos que valorizam o tempo. <br className="hidden md:block" />
              Simples, elegante e sob o seu controle total.
            </p>

            {/* CTA Principal */}
            <Link 
              href="/login" 
              className="group relative px-10 py-5 bg-white text-[#050816] font-bold rounded-[20px] text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              Começar Agora
              <ArrowRight size={20} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Mockup iPhone 15 Pro (Simulado) */}
            <div className="relative mt-20 w-full max-w-[340px] md:max-w-[400px] animate-float">
              <div className="relative z-10 p-2 rounded-[3.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                <Image 
                  src="/iphone15pro_mockup_calendar_darkmode_1777994054113.png"
                  alt="App Mockup"
                  width={800}
                  height={1200}
                  className="rounded-[3rem] object-cover"
                />
              </div>
              {/* Sombra e Brilho atrás do mockup */}
              <div className="absolute -inset-10 bg-blue-600/10 blur-[80px] -z-10 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Seção de Features (Bento Grid) */}
      <section className="py-40 relative px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="space-y-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Domine sua rotina</h2>
            <p className="text-xl text-[#94A3B8] font-medium">Funcionalidades desenhadas para a sua produtividade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            {/* Grande: Calendário */}
            <div className="md:col-span-8 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[32px] p-10 flex flex-col justify-between group hover:border-white/20 transition-all shadow-2xl relative overflow-hidden">
               <div className="space-y-4 relative z-10">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <Calendar size={20} className="text-blue-500" />
                 </div>
                 <h3 className="text-3xl font-bold text-white tracking-tight">Escalas Inteligentes</h3>
                 <p className="text-[#94A3B8] max-w-sm text-lg leading-relaxed">Visualize múltiplos locais em um calendário visual único e cristalino.</p>
               </div>
               <div className="absolute bottom-[-10%] right-[-5%] w-1/2 h-1/2 bg-blue-600/10 blur-[60px] group-hover:bg-blue-600/20 transition-colors" />
            </div>

            {/* Médio: Finanças */}
            <div className="md:col-span-4 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[32px] p-10 flex flex-col justify-between group hover:border-white/20 transition-all shadow-2xl">
               <div className="space-y-4">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <LineChart size={20} />
                 </div>
                 <h3 className="text-2xl font-bold text-white tracking-tight">Ganhos em Tempo Real</h3>
                 <p className="text-[#94A3B8] text-base leading-relaxed">Acompanhe seu faturamento projetado e consolidado automaticamente.</p>
               </div>
            </div>

            {/* Médio: Notificações */}
            <div className="md:col-span-4 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[32px] p-10 flex flex-col justify-between group hover:border-white/20 transition-all shadow-2xl">
               <div className="space-y-4">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <Bell size={20} />
                 </div>
                 <h3 className="text-2xl font-bold text-white tracking-tight">Alertas Inteligentes</h3>
                 <p className="text-[#94A3B8] text-base leading-relaxed">Não perca nenhum plantão com avisos estratégicos no seu smartphone.</p>
               </div>
            </div>

            {/* Grande: Relatórios */}
            <div className="md:col-span-8 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[32px] p-10 flex flex-col justify-between group hover:border-white/20 transition-all shadow-2xl overflow-hidden relative">
               <div className="space-y-4 relative z-10">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <FileText size={20} />
                 </div>
                 <h3 className="text-3xl font-bold text-white tracking-tight">Exportação em PDF</h3>
                 <p className="text-[#94A3B8] max-w-sm text-lg leading-relaxed">Gere relatórios profissionais para conferência com hospitais em segundos.</p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Oferta de Lançamento (O Fechamento) */}
      <section className="py-40 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-lg mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Torne-se PRO</h2>
            <p className="text-xl text-[#94A3B8] font-medium leading-relaxed">Vagas limitadas para o lançamento Founder Edition.</p>
          </div>

          <div className="relative group p-[2px] rounded-[40px] bg-gradient-to-b from-white/20 via-blue-500/5 to-transparent shadow-[0_0_80px_rgba(37,99,235,0.15)] transition-transform hover:scale-[1.01]">
            <div className="bg-[#050816] rounded-[38px] p-12 space-y-10 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-8 right-[-45px] rotate-45 bg-[#2563EB] text-white text-[10px] font-black px-12 py-1.5 uppercase tracking-widest shadow-2xl">
                Founder
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-8xl font-black text-white tracking-tighter">R$ 9,90</span>
                  </div>
                  <p className="text-xl text-[#94A3B8] font-semibold">por 6 meses • pagamento único</p>
                </div>
              </div>

              <div className="space-y-5 text-left border-t border-white/5 pt-10">
                {[
                  'Locais e plantões ilimitados',
                  'Relatórios financeiros completos',
                  'Sincronização em tempo real',
                  'Acesso antecipado a novas funções'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4 text-lg text-[#94A3B8]">
                    <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                      <CheckCircle2 size={14} className="text-blue-500" />
                    </div>
                    <span className="font-medium tracking-tight">{item}</span>
                  </div>
                ))}
              </div>

              <Link 
                href="/login" 
                className="group relative block w-full py-6 bg-[#2563EB] text-white font-black rounded-[24px] shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-xl uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                Assinar PRO
              </Link>
              
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                97 vagas restantes • liberação imediata
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista High-End */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#050816]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-2 group opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tighter">Meu Plantão</span>
          </div>
          
          <div className="flex gap-10 text-[11px] text-white/30 font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-blue-500 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-blue-500 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-blue-500 transition-colors">Support</Link>
          </div>

          <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        html { scroll-behavior: smooth; }
      `}</style>

    </div>
  );
}
