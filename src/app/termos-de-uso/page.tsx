'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermosUsoPage() {
  const router = useRouter();

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={32} color="var(--accent-blue)" />
          Termos de Uso
        </h1>
        <p>Última atualização: 3 de Junho de 2026</p>
      </div>

      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '15px', color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta ou utilizar os serviços do aplicativo <strong>Meu Plantão</strong>, você concorda expressamente e aceita integralmente estes Termos de Uso. Caso discorde de qualquer cláusula ou termo descrito aqui, você deve descontinuar o uso do aplicativo imediatamente.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>2. Elegibilidade e Cadastro</h2>
          <p>
            O Meu Plantão destina-se a médicos e profissionais da saúde para fins de gerenciamento e organização de suas próprias escalas e plantões de trabalho.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li>Você é responsável por fornecer informações cadastrais verdadeiras e mantê-las atualizadas.</li>
            <li>Suas credenciais de login (email e autenticação mágica/senha) são pessoais e intransferíveis, sendo você o único responsável por qualquer atividade realizada na sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>3. Planos de Assinatura e Pagamentos</h2>
          <p>
            O aplicativo oferece uma versão gratuita com limitações (até 2 locais e sem emissão de relatórios) e um plano PRO pago (com locais ilimitados, relatórios financeiros e gestão de extras).
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li>As transações de upgrade para o plano PRO são feitas em pagamento único e processadas de forma segura pelo Mercado Pago.</li>
            <li>O acesso do plano PRO é concedido pelo período selecionado no momento da compra (ex: 6 meses). Não há renovações automáticas involuntárias.</li>
            <li>Você pode solicitar o downgrade ou exclusão da conta a qualquer momento de forma manual.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>4. Uso Aceitável da Plataforma</h2>
          <p>Você concorda em usar o Meu Plantão de forma legítima e ética. É proibido:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li>Modificar, clonar ou piratear a aplicação ou acessar seus servidores e APIs de forma a burlar as travas do plano PRO.</li>
            <li>Inserir dados fraudulentos ou de terceiros sem a devida autorização.</li>
            <li>Utilizar automações que sobrecarreguem ou causem indisponibilidade aos serviços do Meu Plantão.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>5. Limitação de Responsabilidade</h2>
          <p>
            O Meu Plantão é uma ferramenta de produtividade pessoal e auxílio organizacional. Não nos responsabilizamos por perdas financeiras, faltas a plantões médicos, conflitos de agenda com seus respectivos hospitais ou qualquer prejuízo decorrente de falha de uso, notificações atrasadas ou inconsistência no carregamento de dados móveis.
          </p>
        </section>

        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>6. Alterações nos Termos</h2>
          <p>
            Estes termos podem ser atualizados periodicamente para refletir melhorias do produto ou novas leis de mercado. Notificaremos os usuários sobre mudanças significativas através do aplicativo ou e-mail cadastrado.
          </p>
        </section>
      </div>
    </div>
  );
}
