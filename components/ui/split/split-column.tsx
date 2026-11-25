import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FULL_SECTION_IMAGE_SIZES,
  type ISectionContainer,
} from "../section-container";
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
  className?: string;
  colorVariant?: ISectionContainer["color"] | null;
  locale?: Locale;
  desktopReleases?: DesktopReleaseLookup;
  downloadMessages?: DesktopDownloadMessages;
  /** Removes text-only section-edge space when the parent owns that edge. */
  trimTopInset?: boolean;
  /** Removes text-only section-edge space when the parent owns that edge. */
  trimBottomInset?: boolean;
}

const narrowImageSizes =
  "(min-width: 1024px) 768px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";
const halfImageSizes =
  "(min-width: 1280px) 536px, (min-width: 1024px) 448px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";

export default function SplitColumn(props: ISplitColumn) {
  const {
    className,
    colorVariant,
    position,
    tagLine,
    title,
    image,
    link,
    desktopReleases,
    downloadMessages,
    trimTopInset = false,
    trimBottomInset = false,
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
          "relative min-w-0 rounded-2xl overflow-hidden",
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
                : FULL_SECTION_IMAGE_SIZES
          }
          quality={100}
        />
      </div>
    ) : null;

  const bodyContent = body.length ? (
    <div
      className={cn(
        "text-lg leading-relaxed [&>*:last-child]:mb-0",
        color === "primary" ? "text-background/80" : "text-muted-foreground",
      )}
    >
      <PortableTextRenderer value={body} locale={locale} />
    </div>
  ) : null;

  const content = hasText ? (
    <div
      className={cn(
        "min-w-0",
        vertical
          ? "w-full"
          : twoColumns && natural
            ? "py-6 lg:py-0"
            : twoColumns
              ? "py-6 lg:py-0 flex flex-col justify-center"
              : cn(
                  "px-4 lg:px-16 xl:px-20 flex flex-col justify-center",
                  trimTopInset ? "pt-0" : "pt-6",
                  trimBottomInset ? "pb-0" : "pb-6",
                ),
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
                  !vertical && (hasTitle || body.length > 0) ? "mb-4" : undefined,
                )}
              >
                {tagLine}
              </span>
            ) : null}
            {hasTitle ? (
              <Heading
                className={cn(
                  Heading === "h2" ? "text-3xl md:text-5xl" : "font-semibold",
                  !vertical && body.length > 0 ? "mb-4" : undefined,
                )}
              >
                {title}
              </Heading>
            ) : null}
            {bodyContent}
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
        twoColumns ? "lg:grid-cols-2 lg:gap-16 xl:gap-20" : undefined,
        twoColumns && natural ? "lg:items-center" : undefined,
        vertical ? "w-full gap-16 xl:gap-20" : undefined,
        vertical && options.sectionWidth === "narrow"
          ? "max-w-[48rem] mx-auto"
          : undefined,
        className,
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
