export const brand = {
  name: "Vertex",
  legalName: "Vertex Restoration",
  tagline: {
    en: "Disaster restoration & recovery services",
    es: "Servicios de restauración y recuperación",
    pt: "Serviços de restauração e recuperação",
  },
  domain: "vertexrestoration.us",
  supportEmail: "hello@vertexrestoration.us",
  colors: {
    primary: "#1F2A3D",        // navy
    accent: "#EDB23E",         // amber/yellow
    accentForeground: "#1F2A3D",
  },
  social: {
    instagram: "vertex.restoration",
    linkedin: "vertex-restoration",
  },
} as const;

export type Brand = typeof brand;
