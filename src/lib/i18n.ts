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

  // Worker portal
  "w.nav.today":    { en: "Today",    es: "Hoy",       pt: "Hoje" },
  "w.nav.shifts":   { en: "Shifts",   es: "Turnos",    pt: "Turnos" },
  "w.nav.hours":    { en: "Hours",    es: "Horas",     pt: "Horas" },
  "w.nav.pay":      { en: "Pay",      es: "Pago",      pt: "Pagamento" },
  "w.nav.docs":     { en: "Docs",     es: "Documentos", pt: "Documentos" },
  "w.nav.profile":  { en: "Profile",  es: "Perfil",    pt: "Perfil" },

  "w.greeting.morning":   { en: "Good morning",   es: "Buenos días",  pt: "Bom dia" },
  "w.greeting.afternoon": { en: "Good afternoon", es: "Buenas tardes", pt: "Boa tarde" },
  "w.greeting.evening":   { en: "Good evening",   es: "Buenas noches", pt: "Boa noite" },

  "w.today.on_the_clock":    { en: "You're on the clock",      es: "Estás trabajando",     pt: "Você está no horário" },
  "w.today.ready":           { en: "Ready to start your day?", es: "¿Listo para empezar?", pt: "Pronto para começar?" },
  "w.today.on_clock_since":  { en: "On the clock since",       es: "Trabajando desde",     pt: "No turno desde" },
  "w.today.break_minutes":   { en: "Break minutes today",      es: "Minutos de descanso hoy", pt: "Minutos de pausa hoje" },
  "w.today.break_hint":      {
    en: "Total unpaid break time during this shift.",
    es: "Tiempo de descanso no pagado durante este turno.",
    pt: "Tempo de pausa não pago durante este turno.",
  },
  "w.today.clock_in":  { en: "Clock in",  es: "Entrar",    pt: "Entrar" },
  "w.today.clock_out": { en: "Clock out", es: "Salir",     pt: "Sair" },
  "w.today.where":     {
    en: "Where are you working today?",
    es: "¿Dónde trabajas hoy?",
    pt: "Onde você está trabalhando hoje?",
  },
  "w.today.no_placements_title": {
    en: "No active placements yet",
    es: "Aún no tienes asignaciones activas",
    pt: "Sem alocações ativas ainda",
  },
  "w.today.no_placements_body": {
    en: "Vertex will assign you to an employer soon. You'll see your shifts here when ready.",
    es: "Vertex te asignará un empleador pronto. Verás tus turnos aquí cuando estén listos.",
    pt: "A Vertex vai te alocar com um empregador em breve. Você verá seus turnos aqui quando prontos.",
  },
  "w.today.hours_week":      { en: "Hours this week",      es: "Horas esta semana",   pt: "Horas nesta semana" },
  "w.today.shifts_week":     { en: "Shifts this week",     es: "Turnos esta semana",  pt: "Turnos nesta semana" },
  "w.today.active_placements": { en: "Active placements",  es: "Asignaciones activas", pt: "Alocações ativas" },
  "w.today.this_week":       { en: "This week",            es: "Esta semana",         pt: "Esta semana" },
  "w.today.view_all":        { en: "View all",             es: "Ver todos",           pt: "Ver todos" },

  "w.shifts.title":         { en: "Your shifts",            es: "Tus turnos",          pt: "Seus turnos" },
  "w.shifts.subtitle":      { en: "Schedule for the next several days.", es: "Horario para los próximos días.", pt: "Programação dos próximos dias." },
  "w.shifts.no_upcoming":   { en: "No upcoming shifts scheduled.", es: "No hay turnos próximos.", pt: "Nenhum turno próximo agendado." },
  "w.shifts.today_badge":   { en: "Today", es: "Hoy", pt: "Hoje" },

  "w.hours.title":          { en: "Your hours",      es: "Tus horas",     pt: "Suas horas" },
  "w.hours.approved":       { en: "Approved",        es: "Aprobado",      pt: "Aprovado" },
  "w.hours.pending_review": { en: "Pending review",  es: "Revisión pendiente", pt: "Revisão pendente" },
  "w.hours.no_entries":     { en: "No time entries yet.", es: "Aún no hay registros.", pt: "Ainda sem registros." },
  "w.hours.in_progress":    { en: "in progress",     es: "en progreso",   pt: "em andamento" },

  "w.pay.title":            { en: "Pay stubs",       es: "Comprobantes de pago", pt: "Comprovantes de pagamento" },
  "w.pay.subtitle":         {
    en: "Weekly earnings statements. Download a PDF copy for your records.",
    es: "Comprobantes semanales. Descarga una copia en PDF para tus registros.",
    pt: "Comprovantes semanais. Baixe uma cópia em PDF para seus registros.",
  },
  "w.pay.26w_gross":        { en: "Last 26 weeks · gross", es: "Últimas 26 semanas · bruto", pt: "Últimas 26 semanas · bruto" },
  "w.pay.26w_hours":        { en: "Last 26 weeks · hours", es: "Últimas 26 semanas · horas", pt: "Últimas 26 semanas · horas" },
  "w.pay.none":             { en: "No pay stubs yet.", es: "Aún no hay comprobantes.", pt: "Ainda sem comprovantes." },
  "w.pay.approved_will_appear": {
    en: "Approved hours will roll up into a weekly stub here.",
    es: "Las horas aprobadas aparecerán como comprobante semanal aquí.",
    pt: "Horas aprovadas serão consolidadas como comprovante semanal aqui.",
  },
  "w.pay.paid":             { en: "paid",            es: "pagado",         pt: "pago" },
  "w.pay.pending":          { en: "pending",         es: "pendiente",      pt: "pendente" },

  "w.docs.title":           { en: "Documents",       es: "Documentos",     pt: "Documentos" },
  "w.docs.subtitle":        {
    en: "Upload your compliance documents. Vertex reviews them within 1 business day.",
    es: "Sube tus documentos. Vertex los revisa en 1 día hábil.",
    pt: "Envie seus documentos. A Vertex revisa em 1 dia útil.",
  },
  "w.docs.required":        { en: "Required", es: "Obligatorios", pt: "Obrigatórios" },
  "w.docs.optional":        { en: "Optional / role-specific", es: "Opcionales / por rol", pt: "Opcionais / por função" },
  "w.docs.all_uploaded":    {
    en: "All required documents uploaded",
    es: "Todos los documentos obligatorios subidos",
    pt: "Todos os documentos obrigatórios enviados",
  },
  "w.docs.missing":         {
    en: "required document(s) missing",
    es: "documento(s) obligatorio(s) faltante(s)",
    pt: "documento(s) obrigatório(s) faltando",
  },
  "w.docs.upload":          { en: "Upload a document", es: "Subir un documento", pt: "Enviar um documento" },
  "w.docs.not_uploaded":    { en: "Not uploaded",    es: "No subido",      pt: "Não enviado" },
  "w.docs.pending":         { en: "Pending",         es: "Pendiente",      pt: "Pendente" },
  "w.docs.approved":        { en: "Approved",        es: "Aprobado",       pt: "Aprovado" },
  "w.docs.rejected":        { en: "Rejected",        es: "Rechazado",      pt: "Rejeitado" },
  "w.docs.expired":         { en: "Expired",         es: "Vencido",        pt: "Expirado" },

  "w.profile.title":        { en: "Your profile",    es: "Tu perfil",      pt: "Seu perfil" },
  "w.profile.subtitle":     {
    en: "Keep your contact and payment details current so we can reach you and pay you.",
    es: "Mantén tus datos de contacto y pago actualizados para que podamos contactarte y pagarte.",
    pt: "Mantenha seus dados de contato e pagamento atualizados para que possamos contatar e pagar você.",
  },
  "w.profile.identity":     { en: "Identity",        es: "Identidad",      pt: "Identidade" },
  "w.profile.contact":      { en: "Contact & payment", es: "Contacto y pago", pt: "Contato e pagamento" },
  "w.profile.name":         { en: "Name",            es: "Nombre",         pt: "Nome" },
  "w.profile.code":         { en: "Employee code",   es: "Código",         pt: "Código" },
  "w.profile.status":       { en: "Status",          es: "Estado",         pt: "Status" },
  "w.profile.rate":         { en: "Default rate",    es: "Tarifa",         pt: "Tarifa" },
  "w.profile.contact_to_change": {
    en: "To change your name or code, contact Vertex.",
    es: "Para cambiar tu nombre o código, contacta a Vertex.",
    pt: "Para mudar seu nome ou código, fale com a Vertex.",
  },
  "w.profile.email":          { en: "Email",          es: "Correo",         pt: "Email" },
  "w.profile.phone":          { en: "Phone",          es: "Teléfono",       pt: "Telefone" },
  "w.profile.payment_method": { en: "Payment method", es: "Método de pago", pt: "Método de pagamento" },
  "w.profile.ach_note": {
    en: "ACH is fastest. For ACH or Zelle, contact Vertex to register your account details.",
    es: "ACH es lo más rápido. Para ACH o Zelle, contacta a Vertex para registrar los datos de tu cuenta.",
    pt: "ACH é o mais rápido. Para ACH ou Zelle, fale com a Vertex para registrar os dados da sua conta.",
  },
  "w.profile.save":         { en: "Save changes",    es: "Guardar cambios", pt: "Salvar mudanças" },
} as const;

export type TKey = keyof typeof dict;

export function t(locale: Locale, key: TKey): string {
  return dict[key]?.[locale] ?? dict[key]?.[DEFAULT_LOCALE] ?? key;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
