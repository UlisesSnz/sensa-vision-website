import { notFound } from "next/navigation";

import Blocks from "@/components/blocks";
import SiteShell from "@/components/site-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveAvailableLocale } from "@/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";
import { fetchSanityPageBySlug, fetchSiteSettings } from "@/sanity/lib/content";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) return { title: "404", robots: "noindex" };
  const page = await fetchSanityPageBySlug(locale, "index");
  if (!page) return { title: "404", robots: "noindex" };
  return generatePageMetadata({ page, locale });
}

export default async function IndexPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) notFound();

  const [page, siteSettings] = await Promise.all([
    fetchSanityPageBySlug(locale, "index"),
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
