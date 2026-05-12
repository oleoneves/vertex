import type { TKey } from "./i18n";

export type Industry = {
  slug: string;
  jobCategory: string;
  i18nKey: TKey;
  photo: string;
};

export type CategoryStyle = {
  ring: string;
  tint: string;
  text: string;
  bar: string;
};

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  construction: { ring: "ring-orange-500/30", tint: "bg-orange-500/10",  text: "text-orange-700 dark:text-orange-300",  bar: "bg-orange-500" },
  cleaning:     { ring: "ring-sky-500/30",     tint: "bg-sky-500/10",     text: "text-sky-700 dark:text-sky-300",        bar: "bg-sky-500" },
  restoration:  { ring: "ring-red-500/30",     tint: "bg-red-500/10",     text: "text-red-700 dark:text-red-300",        bar: "bg-red-500" },
  hospitality:  { ring: "ring-violet-500/30",  tint: "bg-violet-500/10",  text: "text-violet-700 dark:text-violet-300",  bar: "bg-violet-500" },
  logistics:    { ring: "ring-emerald-500/30", tint: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300",bar: "bg-emerald-500" },
  food:         { ring: "ring-amber-500/30",   tint: "bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400",    bar: "bg-amber-500" },
  agriculture:  { ring: "ring-lime-500/30",    tint: "bg-lime-500/10",    text: "text-lime-700 dark:text-lime-300",      bar: "bg-lime-500" },
};

const FALLBACK_STYLE: CategoryStyle = {
  ring: "ring-border",
  tint: "bg-muted",
  text: "text-muted-foreground",
  bar: "bg-foreground",
};

export function styleForCategory(category: string | null | undefined): CategoryStyle {
  if (!category) return FALLBACK_STYLE;
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "construction",
    jobCategory: "construction",
    i18nKey: "industries.construction",
    photo: "/photos/construction.jpg",
  },
  {
    slug: "cleaning",
    jobCategory: "cleaning",
    i18nKey: "industries.cleaning",
    photo: "/photos/cleaning-2.jpg",
  },
  {
    slug: "restoration",
    jobCategory: "restoration",
    i18nKey: "industries.restoration",
    photo: "/photos/restoration.jpg",
  },
  {
    slug: "hospitality",
    jobCategory: "hospitality",
    i18nKey: "industries.hospitality",
    photo: "/photos/hospitality-2.jpg",
  },
  {
    slug: "warehouse",
    jobCategory: "logistics",
    i18nKey: "industries.warehouse",
    photo: "/photos/warehouse-2.jpg",
  },
  {
    slug: "food",
    jobCategory: "food",
    i18nKey: "industries.food",
    photo: "/photos/construction-2.jpg",
  },
];
