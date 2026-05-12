export const brand = {
  name: "Vertex",
  legalName: "Vertex Labor Service",
  tagline: {
    en: "Real jobs across the United States",
    es: "Trabajos reales en todo Estados Unidos",
    pt: "Vagas reais nos Estados Unidos",
  },
  domain: "vertex.work",
  supportEmail: "hello@vertex.work",
  colors: {
    primary: "#0F172A",
    accent: "#F97316",
  },
  social: {
    instagram: "vertex.work",
    linkedin: "vertex-work",
  },
} as const;

export type Brand = typeof brand;
