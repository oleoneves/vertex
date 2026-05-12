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

  "hero.eyebrow": {
    en: "WORK ACROSS THE USA",
    es: "TRABAJO EN TODO EE. UU.",
    pt: "TRABALHO EM TODOS OS EUA",
  },
  "hero.title": {
    en: "Real jobs. Verified employers. No fees.",
    es: "Empleos reales. Empleadores verificados. Sin costos.",
    pt: "Vagas reais. Empregadores verificados. Sem taxas.",
  },
  "hero.subtitle": {
    en: "Construction, cleaning, restoration, hospitality, warehousing. Apply in 60 seconds — in English, Spanish or Portuguese.",
    es: "Construcción, limpieza, restauración, hostelería, almacenes. Aplica en 60 segundos — en inglés, español o portugués.",
    pt: "Construção, limpeza, restoration, hospitalidade, logística. Candidate-se em 60 segundos — em inglês, espanhol ou português.",
  },
  "hero.cta.jobs": { en: "Browse jobs", es: "Ver empleos", pt: "Ver vagas" },
  "hero.cta.apply": { en: "Apply now", es: "Aplicar ahora", pt: "Candidatar-se" },

  "stats.workers": { en: "workers placed", es: "trabajadores colocados", pt: "trabalhadores colocados" },
  "stats.employers": { en: "verified employers", es: "empleadores verificados", pt: "empregadores verificados" },
  "stats.states": { en: "states", es: "estados", pt: "estados" },
  "stats.fill": { en: "fill rate", es: "tasa de cobertura", pt: "taxa de preenchimento" },

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

  "industries.title": { en: "Industries we hire for", es: "Sectores donde contratamos", pt: "Setores onde contratamos" },
  "industries.construction": { en: "Construction", es: "Construcción", pt: "Construção" },
  "industries.cleaning": { en: "Cleaning & Janitorial", es: "Limpieza", pt: "Limpeza" },
  "industries.restoration": { en: "Disaster Restoration", es: "Restauración", pt: "Restoration" },
  "industries.hospitality": { en: "Hospitality", es: "Hostelería", pt: "Hospitalidade" },
  "industries.warehouse": { en: "Warehouse & Logistics", es: "Almacén y logística", pt: "Logística e armazém" },
  "industries.food": { en: "Food Service", es: "Servicio de comida", pt: "Alimentação" },

  "how.title": { en: "How it works", es: "Cómo funciona", pt: "Como funciona" },
  "how.step1.title": { en: "Find a job", es: "Encuentra un empleo", pt: "Encontre uma vaga" },
  "how.step1.body": {
    en: "Browse verified roles by city, state or industry.",
    es: "Explora vacantes verificadas por ciudad, estado o sector.",
    pt: "Explore vagas verificadas por cidade, estado ou setor.",
  },
  "how.step2.title": { en: "Apply in 60 seconds", es: "Aplica en 60 segundos", pt: "Candidate-se em 60 segundos" },
  "how.step2.body": {
    en: "Name, phone, optional CV. No long forms, no fees.",
    es: "Nombre, teléfono, CV opcional. Sin formularios largos ni cuotas.",
    pt: "Nome, telefone, CV opcional. Sem formulários longos, sem taxas.",
  },
  "how.step3.title": { en: "Get hired", es: "Sé contratado", pt: "Seja contratado" },
  "how.step3.body": {
    en: "AI matches you with employers. We call when there's a fit.",
    es: "La IA te empareja con empleadores. Te llamamos si hay match.",
    pt: "A IA combina você com empregadores. Ligamos quando dá match.",
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
  "jobs.featured": { en: "Featured jobs", es: "Empleos destacados", pt: "Vagas em destaque" },
  "jobs.see_all": { en: "See all jobs", es: "Ver todos", pt: "Ver todas" },

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

  "cta.bottom.title": {
    en: "Ready to work?",
    es: "¿Listo para trabajar?",
    pt: "Pronto pra trabalhar?",
  },
  "cta.bottom.body": {
    en: "Apply once. Get matched with employers across the country.",
    es: "Aplica una vez. Conecta con empleadores en todo el país.",
    pt: "Candidate-se uma vez. Conecte-se com empregadores em todo o país.",
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
