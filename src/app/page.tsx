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
  Star,
  Quote
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] antialiased font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Header (Navegação Premium) */}
      <header className="w-full fixed top-0 z-50 bg-[#050816]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
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

      {/* 2. Hero Section (Humanizada e Emocional) */}
      <section className="relative pt-44 pb-32">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16 text-center md:text-left">
            
            {/* Esquerda: A Emoção (Imagem Gerada) */}
            <div className="w-full md:w-1/2 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <Image 
                src="/healthcare_professional_using_app_1777992330655.png"
                alt="Profissional de Saúde utilizando o Meu Plantão"
                width={800}
                height={600}
                className="relative rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-[4/3] border border-white/5"
              />
              {/* Badge Flutuante */}
              <div className="absolute -bottom-6 -right-6 bg-[#0F172A] p-4 rounded-2xl border border-white/10 shadow-2xl hidden md:block animate-bounce">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-500" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Status Atual</p>
                    <p className="text-sm font-bold text-white">Escala Organizada</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: A Venda */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Sua vida médica simplificada
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tighter">
                Recupere seu tempo. <br /> Organize seus plantões.
              </h1>
              <p className="mt-8 text-xl text-[#94A3B8] max-w-xl leading-relaxed">
                A solução premium para profissionais da saúde que buscam praticidade. 
                Gerencie escalas, projete ganhos e gere relatórios com precisão absoluta.
              </p>
              <Link 
                href="/login" 
                className="mt-12 inline-flex items-center gap-3 px-10 py-5 bg-[#2563EB] text-white font-bold rounded-2xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:bg-[#1E40AF] hover:-translate-y-1 transition-all text-xl group"
              >
                Começar Agora
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Features Section (Show de Mockups) */}
      <section id="features" className="w-full py-40 bg-[#0F172A]/30 border-y border-white/5 px-6">
        <div className="w-full max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-20 tracking-tight">
            Tudo o que você precisa em um só lugar
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-[#0F172A] p-10 rounded-2xl border border-white/5 space-y-8 shadow-2xl group hover:border-blue-500/30 transition-all flex flex-col items-center">
              <div className="w-full aspect-video bg-[#050816] rounded-xl border border-white/5 p-4 relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-16 h-16 text-[#2563EB] opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2563EB]/10 to-transparent"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">Calendário Inteligente</h3>
                <p className="text-[#94A3B8] leading-relaxed">
                  Visualize sua escala completa com um calendário focado em produtividade e clareza.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0F172A] p-10 rounded-2xl border border-white/5 space-y-8 shadow-2xl group hover:border-blue-500/30 transition-all flex flex-col items-center">
              <div className="w-full aspect-video bg-[#050816] rounded-xl border border-white/5 p-4 relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                <LineChart className="w-16 h-16 text-[#2563EB] opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2563EB]/10 to-transparent"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">Controle Financeiro</h3>
                <p className="text-[#94A3B8] leading-relaxed">
                  Saiba exatamente quanto vai receber no fim do mês com cálculos automáticos e projeções.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0F172A] p-10 rounded-2xl border border-white/5 space-y-8 shadow-2xl group hover:border-blue-500/30 transition-all flex flex-col items-center">
              <div className="w-full aspect-video bg-[#050816] rounded-xl border border-white/5 p-4 relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-16 h-16 text-[#2563EB] opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2563EB]/10 to-transparent"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">Relatórios Profissionais</h3>
                <p className="text-[#94A3B8] leading-relaxed">
                  Gere PDFs detalhados para conferência com hospitais e grupos médicos em segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Depoimentos (Prova Social) */}
      <section className="w-full py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-24 tracking-tight">
            A escolha de quem busca controle
          </h2>
          
          <div className="grid md:grid-cols-2 gap-10">
            {/* Depoimento 1 */}
            <div className="bg-[#0F172A] p-12 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10 hover:bg-[#1e293b]/50 transition-all">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 overflow-hidden shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    C
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#2563EB] p-2 rounded-full shadow-lg">
                  <Quote size={14} className="text-white" />
                </div>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <p className="text-xl text-white font-medium italic leading-relaxed">
                  "O Meu Plantão mudou minha rotina. Finalmente tenho controle total sobre meus ganhos e escalas."
                </p>
                <div>
                  <p className="text-lg font-bold text-white">Dra. Clara Silveira</p>
                  <p className="text-sm text-[#94A3B8] font-medium uppercase tracking-widest">Medicina Intensiva</p>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="bg-[#0F172A] p-12 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10 hover:bg-[#1e293b]/50 transition-all">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 overflow-hidden shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-3xl font-bold">
                    R
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#2563EB] p-2 rounded-full shadow-lg">
                  <Quote size={14} className="text-white" />
                </div>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <p className="text-xl text-white font-medium italic leading-relaxed">
                  "A melhor ferramenta que já usei. Os relatórios em PDF facilitam muito o fechamento do mês."
                </p>
                <div>
                  <p className="text-lg font-bold text-white">Dr. Rodrigo Martins</p>
                  <p className="text-sm text-[#94A3B8] font-medium uppercase tracking-widest">Cirurgia Geral</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Oferta de Lançamento (Impacto Massivo) */}
      <section id="pricing" className="w-full py-40 bg-[#0F172A] px-6 text-center border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-20 tracking-tight">
            Comece sua transformação hoje
          </h2>
          
          <div className="max-w-lg mx-auto p-16 bg-[#050816] rounded-3xl border-4 border-[#2563EB] shadow-[0_0_80px_rgba(37,99,235,0.2)] space-y-10 relative overflow-hidden group">
            {/* Badge Founder Edition */}
            <div className="absolute top-8 right-[-45px] rotate-45 bg-[#2563EB] text-white text-xs font-black px-12 py-1.5 uppercase tracking-widest shadow-2xl">
              Founder Edition
            </div>

            <div className="space-y-4">
              <h4 className="text-2xl text-[#94A3B8] font-bold uppercase tracking-[0.2em]">Oferta Especial</h4>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl md:text-9xl font-black text-white tracking-tighter">R$ 9,90</span>
                </div>
                <p className="text-2xl text-[#94A3B8] font-medium">por 6 meses • pagamento único</p>
              </div>
            </div>

            <div className="space-y-5 text-left border-t border-white/5 pt-10">
              {[
                'Acesso PRO completo por 180 dias',
                'Escalas e locais ilimitados',
                'Relatórios financeiros em PDF',
                'Sincronização em tempo real',
                'Suporte prioritário via WhatsApp'
              ].map((item) => (
                <div key={item} className="flex items-center gap-4 text-lg text-[#94A3B8]">
                  <CheckCircle2 size={24} className="text-[#2563EB] flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/login" 
              className="block w-full py-6 bg-[#2563EB] text-white font-black rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.5)] hover:bg-[#1E40AF] hover:scale-[1.02] active:scale-[0.98] transition-all text-2xl uppercase tracking-wider group"
            >
              Assinar PRO — R$ 9,90
              <ArrowRight size={24} className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-[0.3em]">
              Vagas limitadas para o lançamento
            </p>
          </div>
        </div>
      </section>

      {/* Footer Final */}
      <footer className="w-full py-20 px-6 text-center border-t border-white/5 bg-[#050816]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-[#2563EB] rounded flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Meu Plantão</span>
          </div>
          <p className="text-[#94A3B8] text-sm max-w-md mx-auto leading-relaxed">
            Desenvolvido para transformar a rotina exaustiva de médicos e profissionais de saúde em uma jornada organizada e sob controle.
          </p>
          <div className="pt-8 text-xs text-[#94A3B8]/50 uppercase tracking-[0.2em] font-bold">
            © {new Date().getFullYear()} Meu Plantão. Todos os direitos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
