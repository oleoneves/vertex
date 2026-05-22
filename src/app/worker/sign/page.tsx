import { redirect } from "next/navigation";
import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { getCurrentWorker } from "@/lib/workforce";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signDocument } from "../actions";

export const dynamic = "force-dynamic";

type SigRow = { document: string; version: string; signed_at: string };

export default async function SignPage() {
  const worker = await getCurrentWorker();
  if (!worker) redirect("/worker/login?next=/worker/sign");
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("worker_signatures")
    .select("document, version, signed_at")
    .eq("worker_id", worker.id);
  const sigs = (data as SigRow[]) ?? [];
  const ppeSigned = sigs.find((s) => s.document === "ppe");
  const termsSigned = sigs.find((s) => s.document === "terms");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <ShieldCheck className="inline h-6 w-6 text-accent" /> Assinaturas obrigatórias
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Você precisa ler e aceitar os dois documentos abaixo antes de fazer clock-in.
        </p>
      </header>

      {/* PPE */}
      <section
        className={`rounded-2xl border-2 p-5 ${
          ppeSigned ? "border-green-500/30 bg-green-500/5" : "border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/20"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">Termo de uso de EPI</h2>
          {ppeSigned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" /> Assinado
            </span>
          )}
        </div>
        <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong>1. Equipamentos obrigatórios.</strong> Comprometo-me a usar capacete, óculos de
            proteção, luvas, botas com biqueira de aço e demais EPIs aplicáveis ao tipo de trabalho
            durante todo o tempo em serviço.
          </p>
          <p className="mt-2">
            <strong>2. Inspeção diária.</strong> Vou inspecionar meus EPIs antes de cada turno e
            comunicar imediatamente qualquer defeito ou desgaste à Vertex Restoration.
          </p>
          <p className="mt-2">
            <strong>3. Reposição.</strong> Em caso de extravio ou dano por má conservação, posso ser
            responsabilizado pelo custo de reposição.
          </p>
          <p className="mt-2">
            <strong>4. Treinamento.</strong> Declaro ter recebido orientação sobre o uso correto de
            cada EPI fornecido.
          </p>
          <p className="mt-2">
            <strong>5. Penalidades.</strong> O descumprimento pode resultar em advertência, suspensão
            ou desligamento sem aviso prévio.
          </p>
        </div>
        {!ppeSigned && (
          <form action={signDocument} className="mt-4 space-y-3">
            <input type="hidden" name="document" value="ppe" />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agreed"
                value="1"
                required
                className="mt-1 h-4 w-4 accent-yellow-400"
              />
              <span>
                Li e aceito o Termo de uso de EPI. Concordo em usar os equipamentos obrigatórios
                durante todo o tempo de trabalho.
              </span>
            </label>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
            >
              Assinar agora
            </button>
          </form>
        )}
      </section>

      {/* Terms */}
      <section
        className={`rounded-2xl border-2 p-5 ${
          termsSigned ? "border-green-500/30 bg-green-500/5" : "border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/20"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">
            <FileText className="inline h-5 w-5" /> Termos de uso da plataforma
          </h2>
          {termsSigned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" /> Assinado
            </span>
          )}
        </div>
        <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong>1. Cadastro.</strong> Os dados fornecidos (nome, SSN, Zelle, telefone) são
            verdadeiros e mantidos atualizados pelo trabalhador.
          </p>
          <p className="mt-2">
            <strong>2. Clock in / out.</strong> O sistema registra horários com geolocalização. O
            trabalhador concorda em usar o aplicativo de forma honesta e não compartilhar suas
            credenciais.
          </p>
          <p className="mt-2">
            <strong>3. Pagamentos.</strong> Pagamentos são feitos com base nas horas aprovadas pela
            Vertex e podem demorar até 7 dias úteis após o fechamento da semana.
          </p>
          <p className="mt-2">
            <strong>4. Privacidade.</strong> Vertex armazena dados pessoais em servidores seguros e
            não compartilha com terceiros exceto para fins de pagamento ou exigência legal.
          </p>
          <p className="mt-2">
            <strong>5. Rescisão.</strong> Ambas as partes podem encerrar a relação a qualquer
            momento, com pagamento de todas as horas trabalhadas até a data.
          </p>
        </div>
        {!termsSigned && (
          <form action={signDocument} className="mt-4 space-y-3">
            <input type="hidden" name="document" value="terms" />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agreed"
                value="1"
                required
                className="mt-1 h-4 w-4 accent-yellow-400"
              />
              <span>Li e aceito os Termos de uso da plataforma Vertex.</span>
            </label>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-extrabold text-accent-foreground hover:opacity-90"
            >
              Assinar agora
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
