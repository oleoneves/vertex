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
      "Assistente NÃO vê: invoices, pagamentos, payroll, relatórios, margens, valores de receita",
      "Sidebar e dashboard escondem KPIs financeiros automaticamente para o assistente",
      "Apenas super-admin cria projeto, edita rates, fecha projeto, exporta CSV",
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
      "Botão Generate Estimate → documento branded em inglês com cálculo automático (Labor + Per Diem + Travel + Hotel placeholder)",
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
      "Campo Project Manager (puxa do CRM de contatos da empresa)",
      "Tax removido por padrão (Vertex não cobra imposto na invoice)",
      "Botão de Edit na invoice + página /admin/invoices?status=open ordenada por vencimento (in 5d / due today / 3d overdue)",
    ],
  },
  {
    emoji: "📅",
    title: "Folha de Horas & Timesheet Semanal",
    subtitle: "Edição inline + documento branded para a contratante",
    items: [
      "Folha de Horas editável linha a linha: clock-in, clock-out, break — com Save por linha",
      "Botão Print / PDF",
      "Weekly Timesheet em /admin/employers/[id]/weekly: header navy + logo Vertex, agrupado por colaborador, assinaturas de ambas as partes, navegação prev/next-week, totalizadores",
      "**Formato batendo com o PDF da Andrea**: colunas Ticket # (work-order da contratante, ex: 4110322351) + Extra (bônus/hora extra fora do hours×rate), edição inline + soma automática no subtotal por colaborador",
      "Edição inline de horários antes de imprimir/enviar",
    ],
  },
  {
    emoji: "👷",
    title: "Colaboradores (Workers)",
    subtitle: "Dados completos para pagamento e compliance",
    items: [
      "Cadastro com: Zelle full name (nome registrado no Zelle se diferente) · SSN · W9 (PDF armazenado no sistema)",
      "Tipos de role simplificados para 3: Skilled Labor · Unskilled Labor · Supervisor",
      "210 placements existentes remapeados automaticamente para os novos 3 tipos",
    ],
  },
  {
    emoji: "📊",
    title: "Relatórios",
    subtitle: "Análise por período, por PM, por colaborador",
    items: [
      "Filtro de período: últimos 7 dias · 30 dias · 3 meses · 6 meses · 12 meses · 24 meses — **gráficos respondem ao filtro** (antes mostravam sempre 6 meses)",
      "**Top 10 Project Managers** com ranking numerado: PM · Empresa · Invoices · **Total faturado** · Custo estimado · **Margem Vertex** (calculada via ratio do employer)",
      "Top Colaboradores com coluna de Vertex margin (não só horas e salário)",
      "Gráficos com tooltips ao passar o mouse (data + valor)",
      "12 meses de dados históricos simulados (90 paid invoices + 4.000+ time entries) — todos os gráficos cheios",
    ],
  },
  {
    emoji: "📈",
    title: "Dashboard",
    subtitle: "Tudo que importa em uma tela",
    items: [
      "Money row em 6 colunas: Revenue MTD · Margin MTD · Revenue this week · Margin this week · A receber · Applications 24h",
      "Atividade Recente clicável — clica em qualquer invoice/aplicação/clock-in e abre direto",
      "Card A receber abre lista de invoices em aberto ordenadas por vencimento",
      "Live shift board + worker reliability scoring",
    ],
  },
  {
    emoji: "📧",
    title: "Mensagens internas",
    subtitle: "Comunicação com contratantes e colaboradores",
    items: [
      "Composer em /admin/messages com 3 abas: Contractors · Workers · Custom email",
      "Lista pré-populada de contatos das empresas e colaboradores ativos",
      "Email enviado com header e footer branded da Vertex",
      "Log de todos os envios (sent_emails) — auditoria do que foi enviado, pra quem, quando",
      "Disponível para o assistente também",
    ],
  },
  {
    emoji: "🎨",
    title: "UX e identidade visual",
    subtitle: "Marca Vertex consistente em tudo",
    items: [
      "Documentos para contratante (Invoice, Weekly Timesheet, Estimate) sempre em inglês com header navy + logo Vertex",
      "UI interna do admin em PT/EN/ES com switch",
      "Charts interativos com tooltips instantâneos",
      "Páginas de print/PDF otimizadas — controles somem na hora de imprimir",
    ],
  },
  {
    emoji: "⚙️",
    title: "Por baixo do capô",
    subtitle: "Infra robusta para escalar",
    items: [
      "17 migrations aplicadas no Supabase (schema completo)",
      "Deploy automático no Vercel a cada push",
      "Cron jobs: auto-gerar invoice + marcar overdue (diários)",
      "Email via Resend",
      "Storage privado para documentos (W9, contratos, timesheets)",
      "Domínio definido: **vertexrestoration.us**",
      "Modo sandbox para testes — dados serão limpos antes da virada para produção",
    ],
  },
];

const NUMBERS = [
  { value: "26", label: "deploys nesta sessão" },
  { value: "18", label: "migrations no banco" },
  { value: "12", label: "áreas do produto melhoradas" },
  { value: "12.000+", label: "registros de teste populados" },
];

export default function ResumoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Branded header band */}
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
              O que foi entregue<br />nesta noite
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              Resumo das funcionalidades, melhorias e infraestrutura adicionadas
              ao app de gestão da Vertex Restoration em uma única sessão de
              desenvolvimento.
            </p>
          </div>
        </div>
      </header>

      {/* Numbers strip */}
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

      {/* Sections */}
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

        {/* What's next */}
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
                Limpar dados de teste e ativar autenticação real (super-admin + assistente)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: brand.colors.accent }}
              />
              <span className="text-white/80">
                Cobertura completa de português em todas as telas internas (parcial hoje)
              </span>
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
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
