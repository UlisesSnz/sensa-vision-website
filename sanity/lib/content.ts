import { cache } from "react";

import type { Locale } from "@/i18n/config";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { POST_QUERY } from "@/sanity/queries/post";
import { POSTS_QUERY, POSTS_SLUGS_QUERY } from "@/sanity/queries/posts";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries/site-settings";

import { sanityFetch } from "./live";

export const fetchSanityPageBySlug = cache(
  async (locale: Locale, slug: string): Promise<Sanity.Page | null> => {
    const { data } = await sanityFetch({
      query: PAGE_QUERY,
      params: { locale, slug },
    });

    return data;
  },
);

export const fetchSanityPostBySlug = cache(
  async (locale: Locale, slug: string): Promise<Sanity.Post | null> => {
    const { data } = await sanityFetch({
      query: POST_QUERY,
      params: { locale, slug },
    });

    return data;
  },
);

export const fetchSanityPosts = cache(
  async (locale: Locale): Promise<Sanity.Post[]> => {
    const { data } = await sanityFetch({
      query: POSTS_QUERY,
      params: { locale },
    });

    return data || [];
  },
);

export const fetchSiteSettings = cache(
  async (locale: Locale): Promise<Sanity.SiteSettings | null> => {
    const { data } = await sanityFetch({
      query: SITE_SETTINGS_QUERY,
      params: { locale },
    });

    return data;
  },
);

export async function fetchSanityPageStaticParams(locales: readonly Locale[]) {
  const { data } = await sanityFetch({
    query: PAGES_SLUGS_QUERY,
    params: { locales },
    perspective: "published",
    stega: false,
  });

  return (data || []) as Array<Pick<Sanity.Page, "language" | "slug">>;
}

export async function fetchSanityPostStaticParams(locales: readonly Locale[]) {
  const { data } = await sanityFetch({
    query: POSTS_SLUGS_QUERY,
    params: { locales },
    perspective: "published",
    stega: false,
  });

  return (data || []) as Array<Pick<Sanity.Post, "language" | "slug">>;
}
