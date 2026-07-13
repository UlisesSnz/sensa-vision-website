import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

const FILE_EXTENSION_PATTERN = /\.[a-z0-9]+$/i;

export type LocalizedDocumentSummary = {
  _id?: string;
  _type: "page" | "post" | string;
  language?: Locale;
  slug?: { current?: string | null } | null;
};

export type DocumentWithTranslations = LocalizedDocumentSummary & {
  translations?: LocalizedDocumentSummary[] | null;
};

export type LocaleAlternates = Partial<Record<Locale, string>>;

export function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");
  return normalized.length > 1 ? normalized.replace(/\/$/, "") : normalized;
}

export function stripLocalePrefix(pathname: string) {
  const normalized = normalizePathname(pathname);
  const [, possibleLocale, ...rest] = normalized.split("/");

  if (!isLocale(possibleLocale)) return normalized;
  return normalizePathname(`/${rest.join("/")}`);
}

export function toPublicPath(locale: Locale, pathname: string) {
  const normalized = stripLocalePrefix(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function localizeHref(href: string, locale: Locale) {
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(trimmed)
  ) {
    return href;
  }

  if (!trimmed.startsWith("/")) return href;

  const [pathWithQuery, hash = ""] = trimmed.split("#", 2);
  const [pathname, query = ""] = pathWithQuery.split("?", 2);
  const localized = toPublicPath(locale, pathname);
  return `${localized}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export function getDocumentBasePath(document: LocalizedDocumentSummary) {
  const slug = document.slug?.current?.trim();
  if (!slug) return null;

  if (document._type === "post") return `/blog/${slug}`;
  if (document._type !== "page") return null;
  if (slug === "index") return "/";
  if (slug === "blog") return "/blog";
  return `/${slug}`;
}

export function getDocumentAlternates(
  document: DocumentWithTranslations,
  enabledLocales: readonly Locale[],
): LocaleAlternates {
  const alternates: LocaleAlternates = {};
  const candidates = [document, ...(document.translations || [])];

  for (const candidate of candidates) {
    if (!candidate.language || !enabledLocales.includes(candidate.language))
      continue;
    const path = getDocumentBasePath(candidate);
    if (!path) continue;
    alternates[candidate.language] = toPublicPath(candidate.language, path);
  }

  return alternates;
}

export function detectPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;

      return {
        locale: tag.toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index,
    );

  for (const preference of preferences) {
    if (isLocale(preference.locale)) return preference.locale;
  }

  return DEFAULT_LOCALE;
}

export function isPublicFilePath(pathname: string) {
  return FILE_EXTENSION_PATTERN.test(pathname);
}
