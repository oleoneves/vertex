export const LOCALES = ["en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "vertex_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

const dict = {
  "nav.jobs": { en: "Jobs", es: "Empleos", pt: "Vagas" },
  "nav.apply": { en: "Apply", es: "Aplicar", pt: "Candidatar-se" },
  "nav.about": { en: "About", es: "Nosotros", pt: "Sobre" },
  "nav.contact": { en: "Contact", es: "Contacto", pt: "Contato" },

  "hero.title": {
    en: "Find real work across the United States.",
    es: "Encuentra trabajo real en todo Estados Unidos.",
    pt: "Encontre trabalho real em todos os Estados Unidos.",
  },
  "hero.subtitle": {
    en: "Vertex connects workers with verified employers — hospitality, construction, agriculture, logistics and more.",
    es: "Vertex conecta trabajadores con empleadores verificados — hostelería, construcción, agricultura, logística y más.",
    pt: "Vertex conecta trabalhadores com empregadores verificados — hospitalidade, construção, agricultura, logística e mais.",
  },
  "hero.cta.jobs": { en: "Browse jobs", es: "Ver empleos", pt: "Ver vagas" },
  "hero.cta.apply": { en: "Apply now", es: "Aplicar ahora", pt: "Candidatar-se" },

  "value.verified.title": { en: "Verified employers", es: "Empleadores verificados", pt: "Empregadores verificados" },
  "value.verified.body": {
    en: "Every employer is vetted. No scams, no surprises.",
    es: "Cada empleador es verificado. Sin estafas, sin sorpresas.",
    pt: "Cada empregador é verificado. Sem golpes, sem surpresas.",
  },
  "value.lang.title": { en: "Your language", es: "Tu idioma", pt: "Seu idioma" },
  "value.lang.body": {
    en: "Apply in English, Spanish or Portuguese. We translate the rest.",
    es: "Aplica en inglés, español o portugués. Traducimos el resto.",
    pt: "Candidate-se em inglês, espanhol ou português. Traduzimos o resto.",
  },
  "value.fast.title": { en: "Fast matching", es: "Match rápido", pt: "Match rápido" },
  "value.fast.body": {
    en: "AI matches your profile with open roles in seconds.",
    es: "La IA empareja tu perfil con vacantes abiertas en segundos.",
    pt: "IA combina seu perfil com vagas abertas em segundos.",
  },

  "jobs.title": { en: "Open jobs", es: "Empleos disponibles", pt: "Vagas abertas" },
  "jobs.empty": {
    en: "No jobs match your filters right now. Check back soon.",
    es: "No hay empleos que coincidan con tus filtros. Vuelve pronto.",
    pt: "Nenhuma vaga corresponde aos filtros. Volte em breve.",
  },
  "jobs.search.placeholder": {
    en: "Search role, city or employer…",
    es: "Buscar rol, ciudad o empleador…",
    pt: "Buscar cargo, cidade ou empregador…",
  },
  "jobs.filter.state": { en: "State", es: "Estado", pt: "Estado" },
  "jobs.filter.category": { en: "Category", es: "Categoría", pt: "Categoria" },
  "jobs.filter.all": { en: "All", es: "Todos", pt: "Todos" },
  "jobs.hourly": { en: "/hour", es: "/hora", pt: "/hora" },
  "jobs.apply": { en: "Apply", es: "Aplicar", pt: "Candidatar-se" },
  "jobs.details": { en: "Job details", es: "Detalles del empleo", pt: "Detalhes da vaga" },
  "jobs.requirements": { en: "Requirements", es: "Requisitos", pt: "Requisitos" },

  "apply.title": { en: "Submit your application", es: "Envía tu solicitud", pt: "Envie sua candidatura" },
  "apply.name": { en: "Full name", es: "Nombre completo", pt: "Nome completo" },
  "apply.email": { en: "Email", es: "Correo", pt: "Email" },
  "apply.phone": { en: "Phone", es: "Teléfono", pt: "Telefone" },
  "apply.experience": { en: "Brief experience", es: "Experiencia breve", pt: "Experiência resumida" },
  "apply.cv": { en: "Upload CV (PDF)", es: "Sube tu CV (PDF)", pt: "Envie seu CV (PDF)" },
  "apply.submit": { en: "Submit application", es: "Enviar solicitud", pt: "Enviar candidatura" },
  "apply.success": {
    en: "Application received. We will be in touch.",
    es: "Solicitud recibida. Te contactaremos.",
    pt: "Candidatura recebida. Entraremos em contato.",
  },
  "apply.error": {
    en: "Something went wrong. Please try again.",
    es: "Algo salió mal. Inténtalo de nuevo.",
    pt: "Algo deu errado. Tente novamente.",
  },

  "footer.rights": {
    en: "All rights reserved.",
    es: "Todos los derechos reservados.",
    pt: "Todos os direitos reservados.",
  },
  "footer.privacy": { en: "Privacy", es: "Privacidad", pt: "Privacidade" },
  "footer.terms": { en: "Terms", es: "Términos", pt: "Termos" },
} as const;

export type TKey = keyof typeof dict;

export function t(locale: Locale, key: TKey): string {
  return dict[key]?.[locale] ?? dict[key]?.[DEFAULT_LOCALE] ?? key;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
