import { notFound } from "next/navigation";

import SiteShell from "@/components/site-shell";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import PostHero from "@/components/ui/post/hero";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { getEnabledLocales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { toPublicPath } from "@/i18n/routing";
import { resolveAvailableLocale } from "@/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";
import {
  fetchSanityPostBySlug,
  fetchSanityPostStaticParams,
  fetchSiteSettings,
} from "@/sanity/lib/content";
import type { BreadcrumbLink } from "@/types";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await fetchSanityPostStaticParams(getEnabledLocales());
  return posts.map((post) => ({
    locale: post.language,
    slug: post.slug.current,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) return { title: "404", robots: "noindex" };
  const post = await fetchSanityPostBySlug(locale, slug);
  if (!post) return { title: "404", robots: "noindex" };
  return generatePageMetadata({ page: post, locale });
}

export default async function PostPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) notFound();

  const [post, siteSettings] = await Promise.all([
    fetchSanityPostBySlug(locale, slug),
    fetchSiteSettings(locale),
  ]);
  if (!post) notFound();

  const dictionary = getDictionary(locale);
  const links: BreadcrumbLink[] = [
    { label: dictionary.blog.home, href: toPublicPath(locale, "/") },
    { label: dictionary.blog.blog, href: toPublicPath(locale, "/blog") },
    { label: post.title || "", href: "#" },
  ];

  return (
    <SiteShell locale={locale} document={post} siteSettings={siteSettings}>
      <section>
        <div className="container py-16 xl:py-20">
          <article className="mx-auto max-w-3xl">
            <Breadcrumbs links={links} />
            <PostHero {...post} locale={locale} messages={dictionary.share} />
            {post.body ? (
              <PortableTextRenderer value={post.body} locale={locale} />
            ) : null}
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
