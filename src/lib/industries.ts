import type { TKey } from "./i18n";

export type Industry = {
  slug: string;
  jobCategory: string;
  i18nKey: TKey;
  photo: string;
};

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
