import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/ui-kit";

const PRIVACY_CONTACT = "privacidade@conservatoriohermetopascoal.example";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Conservatório Hermeto Pascoal" },
      { name: "description", content: "Quais dados pessoais o sistema do conservatório coleta, para quê e como exercer seus direitos (LGPD)." },
      { property: "og:title", content: "Política de Privacidade" },
      { property: "og:description", content: "Dados coletados, finalidades e direitos dos usuários." },
    ],
  }),
  component: Privacidade,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2"><h2 className="text-lg font-semibold text-navy">{title}</h2><div className="space-y-2 text-sm leading-relaxed">{children}</div></section>;
}

function Privacidade() {
  return (
    <div>
      <PageHeader title="Política de Privacidade" subtitle="Como tratamos seus dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)." />
      <Panel className="max-w-3xl space-y-6">
        <Section title="Quais dados coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Conta:</b> nome, e-mail e senha (guardada de forma criptografada). No login com Google, recebemos nome e e-mail da sua conta Google.</li>
            <li><b>Perfil (opcional):</b> instrumento de interesse e foto.</li>
            <li><b>Atividades:</b> solicitações de matrícula, reservas de espaços, publicações e interesses na Colaboração, e notificações.</li>
          </ul>
        </Section>
        <Section title="Para que usamos">
          <p>Somente para operar o sistema: identificar você, processar matrículas e reservas, permitir a colaboração entre músicos e enviar avisos sobre suas solicitações. Não vendemos nem compartilhamos seus dados para publicidade.</p>
        </Section>
        <Section title="Quem pode ver">
          <ul className="list-disc space-y-1 pl-5">
            <li>Suas matrículas, reservas e notificações são visíveis apenas para você. O responsável pelas matrículas vê as solicitações, com seu nome e instrumento, para analisá-las.</li>
            <li>Publicações da Colaboração são visíveis para usuários conectados, com seu nome como autor. Quem demonstra interesse tem o nome mostrado apenas ao autor da publicação.</li>
            <li>Outros usuários veem apenas que um horário de espaço está ocupado, sem saber quem reservou.</li>
          </ul>
        </Section>
        <Section title="Por quanto tempo guardamos">
          <p>Os dados da conta e o histórico de matrículas e reservas são mantidos enquanto a conta existir. Notificações lidas são apagadas automaticamente após 30 dias.</p>
        </Section>
        <Section title="Seus direitos">
          <p>Você pode, a qualquer momento, pedir confirmação e acesso aos seus dados, correção, exclusão da conta, informação sobre compartilhamento e revogação de consentimento. Nome, instrumento e foto podem ser alterados diretamente em Minha área → Dados pessoais.</p>
        </Section>
        <Section title="Contato">
          <p>Para qualquer pedido sobre seus dados pessoais, escreva para <a className="font-medium text-primary underline" href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>. Responderemos em até 15 dias.</p>
        </Section>
      </Panel>
    </div>
  );
}
