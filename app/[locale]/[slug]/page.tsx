import { notFound } from "next/navigation";

import Blocks from "@/components/blocks";
import SiteShell from "@/components/site-shell";
import { getEnabledLocales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveAvailableLocale } from "@/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";
import {
  fetchSanityPageBySlug,
  fetchSanityPageStaticParams,
  fetchSiteSettings,
} from "@/sanity/lib/content";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const pages = await fetchSanityPageStaticParams(getEnabledLocales());
  return pages
    .filter((page) => !["index", "blog"].includes(page.slug.current))
    .map((page) => ({ locale: page.language, slug: page.slug.current }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) return { title: "404", robots: "noindex" };
  const page = await fetchSanityPageBySlug(locale, slug);
  if (!page) return { title: "404", robots: "noindex" };
  return generatePageMetadata({ page, locale });
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) notFound();

  const [page, siteSettings] = await Promise.all([
    fetchSanityPageBySlug(locale, slug),
    fetchSiteSettings(locale),
  ]);
  if (!page) notFound();

  return (
    <SiteShell locale={locale} document={page} siteSettings={siteSettings}>
      <Blocks
        blocks={page.blocks}
        locale={locale}
        dictionary={getDictionary(locale)}
      />
    </SiteShell>
  );
}
