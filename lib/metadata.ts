import type { Metadata } from "next";

import {
  getEnabledLocales,
  HTML_LANG_BY_LOCALE,
  OPEN_GRAPH_LOCALE_BY_LOCALE,
  type Locale,
} from "@/i18n/config";
import {
  getDocumentAlternates,
  getDocumentBasePath,
  toPublicPath,
} from "@/i18n/routing";
import { urlFor } from "@/sanity/lib/image";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export function generatePageMetadata({
  page,
  locale,
}: {
  page: Sanity.Page | Sanity.Post;
  locale: Locale;
}): Metadata {
  const enabledLocales = getEnabledLocales();
  const path = getDocumentBasePath(page) || "/";
  const canonical = toPublicPath(locale, path);
  const alternates = getDocumentAlternates(page, enabledLocales);
  const languages: Record<string, string> = {};

  if (alternates.es) {
    languages[HTML_LANG_BY_LOCALE.es] = alternates.es;
    languages["x-default"] = alternates.es;
  }
  if (alternates.en) languages[HTML_LANG_BY_LOCALE.en] = alternates.en;

  return {
    title: page.meta_title || page.title,
    description: page.meta_description,
    openGraph: {
      url: canonical,
      images: [
        {
          url: page.ogImage
            ? urlFor(page.ogImage).auto("format").fit("max").quality(100).url()
            : `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.png`,
          width: page.ogImage?.asset?.metadata?.dimensions?.width || 1200,
          height: page.ogImage?.asset?.metadata?.dimensions?.height || 630,
        },
      ],
      locale: OPEN_GRAPH_LOCALE_BY_LOCALE[locale],
      alternateLocale: enabledLocales
        .filter(
          (candidate) => candidate !== locale && Boolean(alternates[candidate]),
        )
        .map((candidate) => OPEN_GRAPH_LOCALE_BY_LOCALE[candidate]),
      type: "website",
    },
    robots: !isProduction
      ? "noindex, nofollow"
      : page.noindex
        ? "noindex"
        : "index, follow",
    alternates: {
      canonical,
      languages,
    },
  };
}
