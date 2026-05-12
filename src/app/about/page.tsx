import { brand } from "@/lib/brand";
import { getLocale } from "@/lib/i18n-server";

const COPY = {
  en: {
    title: "About Vertex",
    body: `Vertex connects workers in the United States with verified employers across hospitality, construction, agriculture, logistics and more. We screen every employer before they post and translate the application process into English, Spanish and Portuguese so language is never the barrier between you and a paycheck.`,
  },
  es: {
    title: "Sobre Vertex",
    body: `Vertex conecta a trabajadores en Estados Unidos con empleadores verificados en hostelería, construcción, agricultura, logística y más. Verificamos a cada empleador antes de que publique y traducimos el proceso de solicitud al inglés, español y portugués para que el idioma no sea una barrera entre tú y un salario.`,
  },
  pt: {
    title: "Sobre a Vertex",
    body: `A Vertex conecta trabalhadores nos Estados Unidos a empregadores verificados em hospitalidade, construção, agricultura, logística e mais. Verificamos cada empregador antes da publicação e traduzimos o processo de candidatura para inglês, espanhol e português, para que o idioma nunca seja a barreira entre você e o salário.`,
  },
} as const;

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted-foreground">
        {copy.body}
      </p>
      <p className="mt-10 text-sm text-muted-foreground">
        Reach us at{" "}
        <a className="text-accent hover:underline" href={`mailto:${brand.supportEmail}`}>
          {brand.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
