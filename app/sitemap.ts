import type { MetadataRoute } from "next";
import { groq } from "next-sanity";

import {
  getEnabledLocales,
  HTML_LANG_BY_LOCALE,
  type Locale,
} from "@/i18n/config";
import {
  getDocumentAlternates,
  getDocumentBasePath,
  toPublicPath,
  type DocumentWithTranslations,
} from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/live";

type SitemapDocument = DocumentWithTranslations & {
  _updatedAt: string;
  noindex?: boolean;
};

const SITEMAP_QUERY = groq`
  *[
    _type in ["page", "post"] &&
    language in $locales &&
    defined(slug.current) &&
    noindex != true
  ] | order(_updatedAt desc){
    _id,
    _type,
    _updatedAt,
    slug,
    language,
    "translations": *[
      _type == "translation.metadata" && references(^._id)
    ][0].translations[].value->{
      _id,
      _type,
      slug,
      language,
      noindex
    }
  }
`;

function absoluteUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const enabledLocales = getEnabledLocales();
  const { data } = await sanityFetch({
    query: SITEMAP_QUERY,
    params: { locales: enabledLocales },
    perspective: "published",
    stega: false,
  });

  return ((data || []) as SitemapDocument[]).flatMap((document) => {
    const locale = document.language;
    if (!locale || !enabledLocales.includes(locale)) return [];
    const basePath = getDocumentBasePath(document);
    if (!basePath) return [];

    const alternates = getDocumentAlternates(document, enabledLocales);
    const languages: Record<string, string> = {};

    (Object.keys(alternates) as Locale[]).forEach((candidate) => {
      const path = alternates[candidate];
      if (path) languages[HTML_LANG_BY_LOCALE[candidate]] = absoluteUrl(path);
    });

    if (alternates.es) languages["x-default"] = absoluteUrl(alternates.es);

    return [
      {
        url: absoluteUrl(toPublicPath(locale, basePath)),
        lastModified: document._updatedAt,
        changeFrequency: document._type === "post" ? "weekly" : "daily",
        priority:
          document._type === "page" && document.slug?.current === "index"
            ? 1
            : document._type === "post"
              ? 0.7
              : 0.5,
        alternates: { languages },
      } satisfies MetadataRoute.Sitemap[number],
    ];
  });
}
