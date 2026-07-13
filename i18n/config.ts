export const SUPPORTED_LOCALES = ["es", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE_NAME = "sensa_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const HTML_LANG_BY_LOCALE: Record<Locale, string> = {
  es: "es-MX",
  en: "en",
};

export const OPEN_GRAPH_LOCALE_BY_LOCALE: Record<Locale, string> = {
  es: "es_MX",
  en: "en",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getEnabledLocales(
  value = process.env.ENABLED_LOCALES,
): readonly Locale[] {
  const configured = (value || DEFAULT_LOCALE)
    .split(",")
    .map((locale) => locale.trim().toLowerCase())
    .filter(isLocale);

  return Array.from(new Set<Locale>([DEFAULT_LOCALE, ...configured]));
}

export function isLocaleEnabled(
  locale: Locale,
  enabledLocales: readonly Locale[] = getEnabledLocales(),
) {
  return enabledLocales.includes(locale);
}
