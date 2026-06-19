'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PoliticaPrivacidadePage() {
  const router = useRouter();

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={32} color="var(--accent-blue)" />
          Política de Privacidade
        </h1>
        <p>Última atualização: 3 de Junho de 2026</p>
      </div>

      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '15px', color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>1. Introdução</h2>
          <p>
            O aplicativo <strong>Meu Plantão</strong> valoriza a privacidade dos seus usuários. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>2. Informações que Coletamos</h2>
          <p>Coletamos dados essenciais para o funcionamento do controle de escalas médicas:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li><strong>Dados Cadastrais:</strong> Nome e endereço de e-mail fornecidos durante a criação da conta.</li>
            <li><strong>Dados de Escalas e Plantões:</strong> Nomes dos locais de trabalho, datas, horários de início e fim dos plantões e anotações financeiras sobre valores recebidos.</li>
            <li><strong>Notificações Push:</strong> Identificadores de dispositivos necessários para disparar lembretes de plantões.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>3. Uso de Serviços de Terceiros</h2>
          <p>Para fornecer uma experiência estável e segura, utilizamos as seguintes ferramentas parceiras:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li><strong>Supabase:</strong> Banco de dados e infraestrutura de autenticação segura.</li>
            <li><strong>Mercado Pago:</strong> Processamento seguro de pagamentos e assinaturas do plano PRO. Nenhum dado de cartão de crédito é guardado em nossos servidores.</li>
            <li><strong>OneSignal:</strong> Gerenciamento e disparo de alertas push de plantões configurados.</li>
            <li><strong>PostHog:</strong> Análise estatística de uso e comportamento para melhoria contínua do aplicativo.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>4. Seus Direitos e Exclusão de Dados</h2>
          <p>
            Você possui pleno direito de acessar, retificar ou excluir seus dados cadastrados a qualquer momento. Em conformidade com a LGPD, disponibilizamos uma funcionalidade de autoatendimento para <strong>exclusão completa de conta</strong> diretamente na aba de configurações do seu plano. Ao confirmar a exclusão, todos os seus dados de plantões, escalas, locais de trabalho e credenciais de login serão removidos permanentemente dos nossos servidores.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>5. Segurança dos Dados</h2>
          <p>
            Seus dados são protegidos por mecanismos robustos de controle de acesso (Row Level Security no Supabase) e criptografia em trânsito (HTTPS). Garantimos que apenas você tem autorização de visualizar ou modificar suas escalas de trabalho.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>6. Contato</h2>
          <p>
            Caso tenha qualquer dúvida relacionada a esta política ou queira exercer seus direitos de privacidade, entre em contato através de nossa área de suporte no aplicativo.
          </p>
        </section>
      </div>
    </div>
  );
}
