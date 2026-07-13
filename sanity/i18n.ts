import type { Locale } from "@/i18n/config";

export const SANITY_LANGUAGES: Array<{ id: Locale; title: string }> = [
  { id: "es", title: "Español" },
  { id: "en", title: "English" },
];

export const TRANSLATED_SCHEMA_TYPES = [
  "page",
  "post",
  "author",
  "category",
  "faq",
  "testimonial",
  "siteSettings",
] as const;

export const DEFAULT_SANITY_LANGUAGE: Locale = "es";
