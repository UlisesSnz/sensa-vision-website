import Link from "next/link";
import { notFound } from "next/navigation";

import Blocks from "@/components/blocks";
import SiteShell from "@/components/site-shell";
import PostCard from "@/components/ui/post-card";
import SectionContainer from "@/components/ui/section-container";
import { getDictionary } from "@/i18n/dictionaries";
import { toPublicPath } from "@/i18n/routing";
import { resolveAvailableLocale } from "@/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";
import {
  fetchSanityPageBySlug,
  fetchSanityPosts,
  fetchSiteSettings,
} from "@/sanity/lib/content";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) return { title: "404", robots: "noindex" };
  const page = await fetchSanityPageBySlug(locale, "blog");
  if (!page) return { title: "404", robots: "noindex" };
  return generatePageMetadata({ page, locale });
}

export default async function BlogPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = await resolveAvailableLocale(localeParam);
  if (!locale) notFound();

  const [page, posts, siteSettings] = await Promise.all([
    fetchSanityPageBySlug(locale, "blog"),
    fetchSanityPosts(locale),
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
      {posts.length > 0 ? (
        <SectionContainer padding={{ top: true, bottom: true }}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                className="flex w-full rounded-3xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={toPublicPath(locale, `/blog/${post.slug.current}`)}
              >
                <PostCard
                  title={post.title}
                  excerpt={post.excerpt}
                  image={post.image}
                />
              </Link>
            ))}
          </div>
        </SectionContainer>
      ) : null}
    </SiteShell>
  );
}
