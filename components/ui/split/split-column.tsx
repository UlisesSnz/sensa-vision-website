import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ISectionContainer } from "../section-container";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";
import {
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";
import {
  getSplitContent,
  getSplitOptions,
  type SplitColumnContent,
} from "@/lib/split-content";

export interface ISplitColumn extends SplitColumnContent {
  colorVariant?: ISectionContainer["color"] | null;
  locale?: Locale;
  desktopReleases?: DesktopReleaseLookup;
  downloadMessages?: DesktopDownloadMessages;
}

const fullImageSizes =
  "(min-width: 1280px) 1152px, (min-width: 1024px) 960px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";
const narrowImageSizes =
  "(min-width: 1024px) 768px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";
const halfImageSizes =
  "(min-width: 1280px) 576px, (min-width: 1024px) 480px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";

export default function SplitColumn(props: ISplitColumn) {
  const {
    colorVariant,
    position,
    tagLine,
    title,
    image,
    link,
    desktopReleases,
    downloadMessages,
    locale = "es",
  } = props;
  const options = getSplitOptions(props);
  const {
    body,
    hasTitle,
    hasTagLine,
    href,
    hasLink,
    isDesktopDownload,
    hasImage,
    hasText,
  } = getSplitContent(props);
  if (!hasImage && !hasText) return null;
  const vertical = options.layout === "vertical";
  const twoColumns = !vertical && hasImage && hasText;
  const color = stegaClean(colorVariant);
  const Heading = options.headingLevel;
  const dimensions = image?.asset?.metadata?.dimensions;
  const natural =
    options.imageFit === "contain" &&
    dimensions &&
    Number.isInteger(dimensions.width) &&
    dimensions.width > 0 &&
    Number.isInteger(dimensions.height) &&
    dimensions.height > 0;
  const lqip = image?.asset?.metadata?.lqip;

  const picture =
    hasImage && image ? (
      <div
        className={cn(
          "relative min-w-0 rounded-lg overflow-hidden",
          !natural
            ? "h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[30rem]"
            : undefined,
          twoColumns && position ? "lg:order-1" : undefined,
        )}
      >
        <Image
          src={
            image.asset?._id === "static"
              ? "/images/placeholder.svg"
              : urlFor(image.asset).url()
          }
          alt={image.alt || ""}
          {...(natural
            ? { width: dimensions.width, height: dimensions.height }
            : { fill: true })}
          placeholder={lqip ? "blur" : undefined}
          blurDataURL={lqip || ""}
          className={cn(
            options.imageFit === "contain" ? "object-contain" : "object-cover",
            natural ? "block w-full h-auto" : undefined,
          )}
          sizes={
            twoColumns
              ? halfImageSizes
              : vertical && options.sectionWidth === "narrow"
                ? narrowImageSizes
                : fullImageSizes
          }
          quality={100}
        />
      </div>
    ) : null;

  const content = hasText ? (
    <div
      className={cn(
        "min-w-0",
        vertical
          ? "w-full"
          : twoColumns && natural
            ? "px-4 py-6 lg:py-0 lg:px-16 xl:px-20"
            : "px-4 py-6 lg:px-16 xl:px-20 flex flex-col justify-center",
        vertical && options.contentWidth === "narrow"
          ? "max-w-[48rem] mx-auto"
          : undefined,
        vertical && options.stackAlign === "center" ? "text-center" : undefined,
      )}
    >
      <div
        className={cn(
          vertical ? "space-y-4" : undefined,
          twoColumns && natural
            ? "lg:flex lg:flex-col lg:items-start"
            : undefined,
        )}
      >
        {hasTitle || hasTagLine || body.length ? (
          <div
            className={cn(
              color === "primary" ? "text-background" : undefined,
              vertical ? "space-y-4" : undefined,
              twoColumns && natural && !hasLink
                ? "lg:[&>*:last-child]:mb-0"
                : undefined,
            )}
          >
            {hasTagLine ? (
              <span
                className={cn(
                  "block text-base font-semibold font-pixel tracking-wide uppercase",
                  color === "primary" && vertical
                    ? "text-background/80"
                    : "text-muted-foreground",
                  !vertical ? "mb-4" : undefined,
                )}
              >
                {tagLine}
              </span>
            ) : null}
            {hasTitle ? (
              <Heading
                className={cn(
                  Heading === "h2" ? "text-3xl md:text-5xl" : "font-semibold",
                  !vertical ? "mb-4" : undefined,
                )}
              >
                {title}
              </Heading>
            ) : null}
            {body.length ? (
              vertical ? (
                <div
                  className={cn(
                    "text-lg leading-relaxed [&>*:last-child]:mb-0",
                    color === "primary"
                      ? "text-background/80"
                      : "text-muted-foreground",
                  )}
                >
                  <PortableTextRenderer value={body} locale={locale} />
                </div>
              ) : (
                <PortableTextRenderer value={body} locale={locale} />
              )
            ) : null}
          </div>
        ) : null}
        {hasLink && isDesktopDownload && downloadMessages && link ? (
          <div
            className={cn(
              "flex",
              !vertical ? "mt-2" : undefined,
              vertical && options.stackAlign === "center"
                ? "justify-center"
                : undefined,
            )}
          >
            <DesktopDownloadButton
              messages={downloadMessages}
              release={getDesktopReleaseFromLookup(desktopReleases, link)}
              target={getDesktopReleaseTargetFromContent(link)}
              title={link.title}
              variant={link.buttonVariant}
            />
          </div>
        ) : hasLink && !isDesktopDownload ? (
          <Button
            className={!vertical ? "mt-2" : undefined}
            variant={stegaClean(link?.buttonVariant)}
            asChild
          >
            <Link
              href={localizeHref(href, locale)}
              target={link?.target ? "_blank" : undefined}
              rel={link?.target ? "noopener noreferrer" : undefined}
            >
              {link?.title}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 min-w-0",
        twoColumns ? "lg:grid-cols-2" : undefined,
        twoColumns && natural ? "lg:items-center" : undefined,
        vertical ? "w-full gap-6 lg:gap-8" : undefined,
        vertical && options.sectionWidth === "narrow"
          ? "max-w-[48rem] mx-auto"
          : undefined,
      )}
    >
      {vertical ? (
        <>
          {content}
          {picture}
        </>
      ) : (
        <>
          {picture}
          {content}
        </>
      )}
    </div>
  );
}
