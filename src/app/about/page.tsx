import Link from "next/link";
import { ShieldCheck, Languages, Zap } from "lucide-react";
import { brand } from "@/lib/brand";
import { getLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, {
  eyebrow: string;
  title: string;
  body: string;
  mission_title: string;
  mission_body: string;
  values_title: string;
  values: { title: string; body: string }[];
  cta: string;
}> = {
  en: {
    eyebrow: "ABOUT VERTEX",
    title: "Connecting real workers with verified employers — without the fees.",
    body: "Vertex was founded to fix a broken labor market. Across hospitality, construction, agriculture, cleaning and restoration, workers spend hours filling out paper forms, waiting on staffing agencies that take a cut, or replying to scam listings that never become real jobs. We built Vertex to be the opposite of that.",
    mission_title: "Our mission",
    mission_body: "Every worker deserves a fast, dignified path to a paycheck — in the language they speak, with employers who pay on time. Vertex never charges workers. We earn by helping employers fill roles reliably, and we only succeed when our workers do.",
    values_title: "What we believe",
    values: [
      {
        title: "Verified employers",
        body: "We screen every employer before they post. No scams, no surprises, no \"register and pay\" gimmicks.",
      },
      {
        title: "Your language",
        body: "English, Spanish and Portuguese — apply in the one you're most comfortable in.",
      },
      {
        title: "Fast and fair",
        body: "60-second application. AI helps match you to roles. No hidden fees ever.",
      },
    ],
    cta: "See open jobs",
  },
  es: {
    eyebrow: "SOBRE VERTEX",
    title: "Conectamos trabajadores reales con empleadores verificados — sin cuotas.",
    body: "Vertex nació para arreglar un mercado laboral roto. En hostelería, construcción, agricultura, limpieza y restauración, los trabajadores pierden horas llenando formularios en papel, esperando agencias que se llevan parte del sueldo, o respondiendo a anuncios falsos. Creamos Vertex para ser lo opuesto.",
    mission_title: "Nuestra misión",
    mission_body: "Cada trabajador merece un camino rápido y digno hacia un cheque — en su idioma, con empleadores que pagan a tiempo. Vertex nunca cobra a los trabajadores. Ganamos cuando ayudamos a empleadores a cubrir vacantes con confianza.",
    values_title: "Lo que creemos",
    values: [
      {
        title: "Empleadores verificados",
        body: "Verificamos a cada empleador antes de publicar. Sin estafas, sin sorpresas.",
      },
      {
        title: "Tu idioma",
        body: "Inglés, español y portugués — aplica en el que mejor te sirva.",
      },
      {
        title: "Rápido y justo",
        body: "Aplicación en 60 segundos. IA combina tu perfil con vacantes. Sin cuotas ocultas.",
      },
    ],
    cta: "Ver empleos abiertos",
  },
  pt: {
    eyebrow: "SOBRE A VERTEX",
    title: "Conectamos trabalhadores reais a empregadores verificados — sem taxas.",
    body: "A Vertex nasceu para consertar um mercado de trabalho quebrado. Em hospitalidade, construção, agricultura, limpeza e restoration, trabalhadores perdem horas preenchendo formulários em papel, esperando agências que ficam com parte do salário ou respondendo a anúncios falsos. Criamos a Vertex para ser o oposto.",
    mission_title: "Nossa missão",
    mission_body: "Todo trabalhador merece um caminho rápido e digno até o pagamento — no seu idioma, com empregadores que pagam em dia. A Vertex nunca cobra dos trabalhadores. Ganhamos quando ajudamos empregadores a preencher vagas com confiança.",
    values_title: "No que acreditamos",
    values: [
      {
        title: "Empregadores verificados",
        body: "Verificamos cada empregador antes da publicação. Sem golpes, sem surpresas.",
      },
      {
        title: "Seu idioma",
        body: "Inglês, espanhol e português — candidate-se no idioma que preferir.",
      },
      {
        title: "Rápido e justo",
        body: "Candidatura em 60 segundos. IA combina seu perfil com vagas. Zero taxas ocultas.",
      },
    ],
    cta: "Ver vagas abertas",
  },
};

const ICONS = [ShieldCheck, Languages, Zap];

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <article>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl">
            {copy.body}
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 sm:grid-cols-[1fr_2fr]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {copy.mission_title}
          </h2>
          <p className="text-lg leading-8">{copy.mission_body}</p>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {copy.values_title}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {copy.values.map((v, i) => {
              const Icon = ICONS[i] ?? ShieldCheck;
              return (
                <div key={v.title} className="rounded-xl border border-border bg-background p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-base text-muted-foreground">
            Questions? Reach a real person at{" "}
            <a className="text-accent hover:underline" href={`mailto:${brand.supportEmail}`}>
              {brand.supportEmail}
            </a>
            .
          </p>
          <Link
            href="/jobs"
            className="inline-flex h-12 items-center rounded-md bg-accent px-6 text-base font-extrabold text-accent-foreground hover:opacity-90"
          >
            {copy.cta} →
          </Link>
        </div>
      </section>
    </article>
  );
}
