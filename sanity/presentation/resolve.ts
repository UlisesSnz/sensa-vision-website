import {
  defineLocations,
  defineDocuments,
  type PresentationPluginOptions,
} from "sanity/presentation";

import { isLocale, type Locale } from "@/i18n/config";
import { toPublicPath } from "@/i18n/routing";

function localizedPagePath(language: unknown, slug: unknown) {
  const languageCandidate = typeof language === "string" ? language : null;
  const locale: Locale = isLocale(languageCandidate) ? languageCandidate : "es";
  const currentSlug = typeof slug === "string" ? slug : "index";
  const path =
    currentSlug === "index"
      ? "/"
      : currentSlug === "blog"
        ? "/blog"
        : `/${currentSlug}`;
  return toPublicPath(locale, path);
}

function localizedPostPath(language: unknown, slug: unknown) {
  const languageCandidate = typeof language === "string" ? language : null;
  const locale: Locale = isLocale(languageCandidate) ? languageCandidate : "es";
  return toPublicPath(locale, `/blog/${typeof slug === "string" ? slug : ""}`);
}

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    page: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled page",
            href: localizedPagePath(doc?.language, doc?.slug),
          },
        ],
      }),
    }),
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        language: "language",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled post",
            href: localizedPostPath(doc?.language, doc?.slug),
          },
          {
            title: "Blog",
            href: toPublicPath(
              isLocale(doc?.language) ? doc.language : "es",
              "/blog",
            ),
          },
        ],
      }),
    }),
  },
  mainDocuments: defineDocuments([
    {
      route: "/",
      filter: `_type == "page" && language == "es" && slug.current == "index"`,
    },
    {
      route: "/en",
      filter: `_type == "page" && language == "en" && slug.current == "index"`,
    },
    {
      route: "/:slug",
      filter: `_type == "page" && language == "es" && slug.current == $slug`,
    },
    {
      route: "/en/:slug",
      filter: `_type == "page" && language == "en" && slug.current == $slug`,
    },
    {
      route: "/blog/:slug",
      filter: `_type == "post" && language == "es" && slug.current == $slug`,
    },
    {
      route: "/en/blog/:slug",
      filter: `_type == "post" && language == "en" && slug.current == $slug`,
    },
  ]),
};
