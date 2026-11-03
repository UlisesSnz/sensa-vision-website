import { Button } from "@/components/ui/button";
import type { PortableTextProps } from "@portabletext/react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";
import { DEFAULT_DESKTOP_RELEASE_TARGET } from "@/lib/desktop-release";
import { cn } from "@/lib/utils";
import { FULL_SECTION_IMAGE_SIZES } from "@/components/ui/section-container";
import styles from "./layout.module.css";
import {
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";

export default function Hero1({
  layout,
  tagLine,
  title,
  body,
  image,
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
  isFirstBlock = false,
}: Partial<{
  layout: Sanity.HeroLayout | null;
  tagLine: string;
  title: string;
  body: PortableTextProps["value"];
  image: Sanity.Image;
  links: Sanity.Link[];
  desktopReleases: DesktopReleaseLookup;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
  isFirstBlock: boolean;
}>) {
  const textAbove = stegaClean(layout) === "vertical";
  return (
    <div className="container dark:bg-background py-20 lg:pt-40">
      <div
        className={
          textAbove ? styles.textAbove : "grid grid-cols-1 lg:grid-cols-2 gap-10"
        }
      >
        <div className={cn(styles.intro, "flex min-w-0 flex-col justify-center")}>
          {tagLine && (
            <span className="text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground">
              {tagLine}
            </span>
          )}
          {title && <h1 className="mt-4 font-bold leading-[1.1]">{title}</h1>}
          {body && (
            <div className="text-lg text-muted-foreground mt-6 leading-relaxed">
              <PortableTextRenderer value={body} locale={locale} />
            </div>
          )}
          {links && links.length > 0 && (
            <div className={cn(styles.actions, "mt-10 flex flex-wrap gap-4")}>
              {links.map((link, index) => {
                const key = link._key || `${link.title}-${index}`;

                if (link.targetType === "desktopDownload" && downloadMessages) {
                  const target =
                    getDesktopReleaseTargetFromContent(link) ||
                    DEFAULT_DESKTOP_RELEASE_TARGET;

                  return (
                    <DesktopDownloadButton
                      key={key}
                      messages={downloadMessages}
                      release={getDesktopReleaseFromLookup(
                        desktopReleases,
                        link,
                      )}
                      target={target}
                      title={link.title}
                      variant={link.buttonVariant}
                    />
                  );
                }

                if (!link.href) return null;

                return (
                  <Button
                    asChild
                    key={key}
                    variant={stegaClean(link.buttonVariant)}
                  >
                    <Link
                      href={localizeHref(link.href, locale)}
                      rel={link.target ? "noopener noreferrer" : undefined}
                      target={link.target ? "_blank" : undefined}
                    >
                      {link.title}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          {image && image.asset?._id && (
            <Image
              className={cn("rounded-xl", textAbove && "h-auto w-full")}
              src={urlFor(image.asset).url()}
              alt={image.alt || ""}
              width={image.asset?.metadata?.dimensions?.width || 800}
              height={image.asset?.metadata?.dimensions?.height || 800}
              sizes={textAbove ? FULL_SECTION_IMAGE_SIZES : undefined}
              loading={isFirstBlock ? "eager" : "lazy"}
              fetchPriority={isFirstBlock ? "high" : undefined}
              placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ""}
              quality={100}
            />
          )}
        </div>
      </div>
    </div>
  );
}
