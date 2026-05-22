import { HelpCircle, Phone, Mail, MessageSquare } from "lucide-react";
import { brand } from "@/lib/brand";

export const metadata = { title: "Ajuda · Vertex" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "Como faço clock-in?",
    a: "Vá em 'Ponto' no menu, escolha o projeto/empresa onde está trabalhando e aperte o botão grande verde. O sistema marca seu horário e a localização automaticamente.",
  },
  {
    q: "Não consigo fazer clock-in — diz que preciso assinar algo.",
    a: "Antes do primeiro clock-in você precisa ler e aceitar o Termo de uso de EPI e os Termos de uso da plataforma. Vá em 'Assinar' no menu e marque as duas caixinhas.",
  },
  {
    q: "Como recebo meu pagamento?",
    a: "A Vertex paga via Zelle, ACH (depósito direto), Check ou CashApp — você escolhe em 'Perfil'. Pagamentos saem semanalmente após as horas serem aprovadas pelo super-admin. Veja o estimado em 'Próximo pagamento' no Hoje.",
  },
  {
    q: "Como marco que estou disponível na próxima semana?",
    a: "Em 'Disponibilidade', marque os checkboxes Manhã/Tarde/Noite para cada dia que pode trabalhar. A Vertex usa essa info pra alocar serviços novos.",
  },
  {
    q: "Como aceito ou recuso um turno?",
    a: "Em 'Turnos', cada turno futuro tem botões Aceitar (verde) e Recusar. Aperte um dos dois pra responder.",
  },
  {
    q: "Tive um acidente / problema no trabalho.",
    a: "Vá em 'Reportar' imediatamente. Preencha título, descrição e severidade. Tire fotos do local pelo celular (botão de Fotos abre a câmera). A Vertex recebe o reporte e responde no admin.",
  },
  {
    q: "Posso indicar um amigo?",
    a: "Sim! Em 'Indicar', preencha nome, telefone ou email do seu amigo. Se ele for contratado pela Vertex, você pode receber uma recompensa.",
  },
  {
    q: "Quero tirar fotos antes/depois do trabalho.",
    a: "Em 'Horas', cada turno completo tem dois botões: 📷 Antes e 📸 Depois. Cada um abre a câmera. As fotos ficam vinculadas ao seu turno e o admin pode ver.",
  },
  {
    q: "Como mudo minha senha?",
    a: "Em 'Perfil', role até 'Alterar senha', digite a nova (mínimo 8 caracteres) e aperte 'Atualizar senha'.",
  },
  {
    q: "Instalar como app no celular?",
    a: "No Safari (iPhone): aperte Compartilhar → 'Adicionar à Tela de Início'. No Chrome (Android): aperte os 3 pontinhos → 'Instalar app'. O Vertex vira ícone na tela inicial e abre sem barra de navegador.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <HelpCircle className="inline h-6 w-6 text-accent" /> Ajuda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perguntas comuns. Não achou o que procura? Fale com a Vertex.
        </p>
      </header>

      {/* Contact card */}
      <section className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          Falar com a Vertex
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <a
            href="tel:+16896863236"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <Phone className="h-4 w-4" /> +1 (689) 686-3236
          </a>
          <a
            href={`mailto:${brand.supportEmail}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <Mail className="h-4 w-4" /> {brand.supportEmail}
          </a>
          <a
            href="/worker/report"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <MessageSquare className="h-4 w-4" /> Reportar incidente
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Perguntas frequentes
        </h2>
        <div className="mt-4 divide-y divide-border/60">
          {FAQ.map((f, i) => (
            <details key={i} className="group py-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{f.q}</span>
                  <span className="text-muted-foreground group-open:rotate-90 transition">
                    ▶
                  </span>
                </div>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
