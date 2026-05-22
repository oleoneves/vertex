import Image from "next/image";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Vertex Restoration — Entrega de produto",
  description: "Resumo das funcionalidades entregues",
};

type Section = {
  emoji: string;
  title: string;
  subtitle: string;
  items: string[];
};

const SECTIONS: Section[] = [
  {
    emoji: "🔐",
    title: "Controle de acesso por papel",
    subtitle: "Super-admin e assistente com permissões distintas",
    items: [
      "Sistema de papéis: super-admin (Caio) vs assistente",
      "Assistente NÃO vê: invoices, pagamentos, payroll, relatórios, margens, valores de receita, CSV exports",
      "Sidebar e dashboard escondem KPIs financeiros automaticamente",
      "Apenas super-admin cria projeto, edita rates, fecha projeto, vê contratos assinados",
      "Modo open-access ativado por enquanto (login removido) — tratamento como super-admin por padrão",
    ],
  },
  {
    emoji: "🏢",
    title: "Cadastro de empresa contratante",
    subtitle: "Tudo que a empresa cobra e tudo que a Vertex paga",
    items: [
      "Tarifas por categoria: Hora · Per Diem · Travel Time — com bill rate (o que cobra) E cost (o que Vertex paga) lado a lado",
      "Hotel é capturado por invoice (não por empresa)",
      "CRM de contatos por empresa: Supervisor, Finance, Director, Project Manager, Operations, Safety, Billing, Other — com email e telefone",
      "Edição dos rates inline na página da empresa",
      "Botão Weekly Timesheet → folha branded em inglês por semana",
    ],
  },
  {
    emoji: "📋",
    title: "Projetos",
    subtitle: "Do estimate ao fechamento financeiro completo",
    items: [
      "Inputs de estimativa: People × Hours/day × Days = Approved hours (com Travel hours/person opcional)",
      "Editor inline na página do projeto — ajusta quando o trabalho fechar diferente do contrato",
      "KPIs: Approved hours (contratado) × Used hours (real, com % consumido)",
      "Botão **Generate Estimate** → documento branded em inglês com cálculo automático",
      "Add hours manually — assistente registra horas para projetos sem clock-in",
      "Upload de Contract assinado (DocuSign / PDF) no projeto (super-admin only)",
      "Upload de Timesheet assinado pela contratante (proof-of-hours)",
      "Project Closing — registra todos os custos out-of-pocket do projeto",
    ],
  },
  {
    emoji: "💰",
    title: "Fechamento de projeto (Project Closing)",
    subtitle: "Custos extras para calcular a margem real",
    items: [
      "Categorias: Airbnb · Hotel · Aluguel de carro · Voos · Gasolina · Alimentação · Mão de obra extra · Materiais · Farmácia · Hospital/acidente · Outros",
      "Cada despesa: descrição, vendor, data, valor",
      "Painel automático: Revenue − Labor cost − Outras despesas = **Net margin real**",
      "Visível apenas para super-admin",
    ],
  },
  {
    emoji: "📄",
    title: "Invoices",
    subtitle: "Geração automática, editável até o envio",
    items: [
      "Layout limpo em 4 categorias: LABOR (agregada) · PER DIEM · TRAVEL TIME · HOTEL — sem listar cada labor por linha",
      "Auto-geração 1 dia após o fim do projeto (cron diário 12:00 UTC) — fica em draft pendente revisão",
      "Editor completo: ajusta line items, qty, rate, período, due date, notas — totais recalculam sozinho",
      "Manual invoice (em branco) para casos especiais — 4 categorias opcionais editáveis",
      "Campo Project Manager (datalist puxa contatos do employer)",
      "Tax removido por padrão (Vertex não cobra imposto na invoice)",
      "Card A RECEBER no dashboard linka pra `/admin/invoices?status=open` ordenada por vencimento",
    ],
  },
  {
    emoji: "📅",
    title: "Folha de Horas & Weekly Timesheet",
    subtitle: "Edição inline + documento branded em inglês",
    items: [
      "Folha de Horas editável linha a linha: clock-in, clock-out, break, ticket #, extra",
      "Botão Print / PDF",
      "Weekly Timesheet em `/admin/employers/[id]/weekly`: header navy + logo Vertex, agrupado por colaborador, assinaturas, navegação prev/next-week",
      "**Ticket # + Extra** (matching o PDF da Andrea) — coluna de OS do contratante + bônus/hora extra fora do hours×rate",
    ],
  },
  {
    emoji: "👷",
    title: "Cadastro de colaboradores (Workers)",
    subtitle: "Dados completos para pagamento, compliance e operação",
    items: [
      "Zelle full name + SSN + W9 (PDF) + Pay rate · Payment method",
      "**Travel availability**: disponível para viagens? região máxima (local / estado / país / internacional)",
      "Roles simplificadas para 3: Skilled Labor · Unskilled Labor · Supervisor (210 placements remapeados)",
      "Limitadores de clock-in por placement: max hours/day · earliest clock-in · latest clock-out (admin define)",
    ],
  },
  {
    emoji: "📱",
    title: "Backend do labor (worker portal)",
    subtitle: "Dashboard completo para o trabalhador no celular",
    items: [
      "**Dashboard /worker** — tier de confiança (Elite/Pro/Standard/New) · ranking entre peers · ganhos da semana com delta % · KPIs lifetime (mês/ano/total) · próximo pagamento · % aprovação · streak 🔥 · status W9/SSN/Zelle · meus projetos com % do lifetime · gráficos 14d e 12mo",
      "**`/worker/clock`** — clock-in/out separado, botão h-16 mobile-friendly, validação (refuses fora da janela ou no cap diário, exige PPE + termos assinados)",
      "**`/worker/availability`** — disponibilidade semanal (manhã/tarde/noite) + visão mensal calendário",
      "**`/worker/shifts`** — turnos com botões grandes Aceitar/Recusar",
      "**`/worker/hours`** — histórico + upload de fotos antes/depois por entrada (câmera no celular)",
      "**`/worker/refer`** — indicar amigo + ver status + total recebido",
      "**`/worker/rate`** — avaliar trabalho/projeto/supervisor/colega com estrelas + comentário",
      "**`/worker/report`** — reportar incidente (acidente, conflito, problema) com fotos + arquivos + severidade",
      "**`/worker/sign`** — assinatura digital de PPE + Termos (bloqueia clock-in se não assinou)",
      "**`/worker/profile`** — editar Zelle, telefone, viagem + alterar senha",
      "PWA pronto pra instalar no celular (manifest + shortcuts Clock/Hoje/Reportar/Disponibilidade)",
    ],
  },
  {
    emoji: "🛡️",
    title: "Admin vê tudo que o worker faz",
    subtitle: "Páginas dedicadas para revisão e resposta",
    items: [
      "**`/admin/incidents`** — todos os reportes com preview de foto, severidade, status (open/reviewing/resolved/dismissed) + caixa de resposta do admin (visível pro worker)",
      "**`/admin/availability`** — board: workers × 7 dias com slots morning/afternoon/evening · totais por dia · navegação prev/next-week",
      "**`/admin/referrals`** — leaderboard top 10 referrers + lista completa com inline status + reward $",
      "**`/admin/ratings`** — 4 KPIs (média por kind: job/supervisor/peer/project) + top 10 colegas mais bem avaliados + feed de todas as avaliações filtráveis",
      "**`/admin/messages`** — composer pra contratantes/workers/email custom · Resend · log completo",
    ],
  },
  {
    emoji: "📊",
    title: "Relatórios",
    subtitle: "Análise por período, por PM, por colaborador",
    items: [
      "Filtro de período: últimos 7 dias · 30 dias · 3 meses · 6 meses · 12 meses · 24 meses — gráficos respondem ao filtro",
      "**Top 10 Project Managers** com ranking numerado: PM · Empresa · Invoices · Total faturado · Custo estimado · Margem Vertex",
      "Top Colaboradores com Vertex margin (não só horas e salário)",
      "Gráficos com tooltips ao passar o mouse",
      "12 meses de dados históricos simulados — todos os gráficos cheios",
    ],
  },
  {
    emoji: "📈",
    title: "Dashboard admin",
    subtitle: "Tudo que importa em uma tela",
    items: [
      "Money row em 6 colunas: Revenue MTD · Margin MTD · Revenue this week · Margin this week · A receber · Applications 24h — em formato compacto ($1.18M)",
      "Atividade Recente clicável — clica em qualquer invoice/aplicação/clock-in e abre direto",
      "Card A RECEBER abre lista de invoices em aberto ordenadas por vencimento",
      "Live shift board + worker reliability scoring",
      "Sidebar com scroll independente + paginação em Workers/Placements/Timesheet",
    ],
  },
  {
    emoji: "🌎",
    title: "UX, marca e localização",
    subtitle: "Marca Vertex consistente · timezone Orlando",
    items: [
      "Documentos para contratante (Invoice, Weekly Timesheet, Estimate) sempre em **inglês** com header navy + logo Vertex",
      "UI interna do admin/worker em **PT/EN/ES** com switch",
      "**Timezone Eastern (America/New_York / Orlando)** como default; detector que lê o fuso do browser e seta cookie (`vertex-tz`)",
      "Charts interativos com tooltips instantâneos",
      "Páginas de print/PDF otimizadas — controles somem na hora de imprimir",
      "Mobile-first em todo o /worker (botões grandes, file inputs com camera capture)",
    ],
  },
  {
    emoji: "⚙️",
    title: "Por baixo do capô",
    subtitle: "Infra robusta para escalar",
    items: [
      "24 migrations aplicadas no Supabase (schema completo + índices de performance)",
      "Deploy automático no Vercel a cada push",
      "Cron jobs: auto-gerar invoice + marcar overdue (diários)",
      "Email via Resend",
      "Storage privado para documentos (W9, contratos, timesheets, incident photos, before/after photos)",
      "Domínio definido: **vertexrestoration.us**",
      "Modo sandbox para testes — dados serão limpos antes da virada para produção",
    ],
  },
];

const NUMBERS = [
  { value: "50+", label: "deploys nesta sessão" },
  { value: "24", label: "migrations no banco" },
  { value: "15", label: "áreas do produto entregues" },
  { value: "15.000+", label: "registros de teste populados" },
];

export default function ResumoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header
        className="px-6 py-10 sm:px-12 sm:py-16"
        style={{ background: brand.colors.primary, color: "white" }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <Image
              src="/vertex-mark-navy.png"
              alt=""
              width={56}
              height={56}
              priority
              unoptimized
              className="h-14 w-auto invert"
            />
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                VERTEX
              </div>
              <div
                className="text-[11px] font-semibold uppercase tracking-[3px]"
                style={{ color: brand.colors.accent }}
              >
                Restoration · Recovery
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div
              className="text-[11px] font-bold uppercase tracking-[3px]"
              style={{ color: brand.colors.accent }}
            >
              Relatório de entrega
            </div>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Sistema completo<br />admin + worker
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              Plataforma de gestão da Vertex Restoration. 13 áreas do produto
              entregues — desde controle de acesso, fechamento financeiro de
              projetos, até o backend completo do labor (clock-in, avaliações,
              incidentes, fotos, PWA mobile).
            </p>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white px-6 py-8 sm:px-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {NUMBERS.map((n) => (
            <div key={n.label} className="text-center">
              <div
                className="font-mono text-3xl font-extrabold tabular-nums sm:text-4xl"
                style={{ color: brand.colors.primary }}
              >
                {n.value}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {n.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-12 sm:py-16">
        <div className="space-y-12">
          {SECTIONS.map((section, i) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-5 flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${brand.colors.accent}20` }}
                >
                  {section.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    {section.items.length}{" "}
                    {section.items.length === 1 ? "item" : "itens"}
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
                    {section.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-[15px] leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: brand.colors.accent }}
                    />
                    <span className="text-slate-700">
                      {/\*\*.+?\*\*/.test(item)
                        ? item.split(/(\*\*.+?\*\*)/).map((part, k) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                              <strong
                                key={k}
                                className="font-bold"
                                style={{ color: brand.colors.primary }}
                              >
                                {part.slice(2, -2)}
                              </strong>
                            ) : (
                              <span key={k}>{part}</span>
                            ),
                          )
                        : item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section
          className="mt-12 rounded-2xl p-8 text-white sm:p-10"
          style={{ background: brand.colors.primary }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-[3px]"
            style={{ color: brand.colors.accent }}
          >
            Próximos passos
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            O que falta pra ir pra produção
          </h2>
          <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed">
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: brand.colors.accent }}
              />
              <span className="text-white/80">
                Apontar o domínio <strong className="text-white">vertexrestoration.us</strong> para a Vercel
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: brand.colors.accent }}
              />
              <span className="text-white/80">
                Inserir os dados reais de EIN + conta bancária nos PDFs de invoice (hoje são placeholders)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: brand.colors.accent }}
              />
              <span className="text-white/80">
                Limpar dados de teste e ativar autenticação real (super-admin + assistente + workers convidados)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: brand.colors.accent }}
              />
              <span className="text-white/80">
                Onboarding inicial: cadastrar Caio + assistente, primeira empresa contratante real, primeiros workers ativos
              </span>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-xs text-slate-500 sm:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/vertex-mark-navy.png"
              alt=""
              width={20}
              height={20}
              unoptimized
              className="h-5 w-auto"
            />
            <span className="font-bold tracking-tight text-slate-700">
              VERTEX RESTORATION
            </span>
          </div>
          <p className="mt-2">
            Plataforma de gestão · {brand.domain} ·{" "}
            <a
              href="https://vertex-beta-one.vercel.app/admin"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: brand.colors.primary }}
            >
              acessar painel
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
