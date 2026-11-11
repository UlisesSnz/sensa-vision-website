import { cn } from "@/lib/utils";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import { Button } from "@/components/ui/button";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";
import { DEFAULT_DESKTOP_RELEASE_TARGET } from "@/lib/desktop-release";
import {
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";

function isEmptyPortableTextBlock(value: PortableTextBlock) {
  return value.children.every(
    (child) =>
      child._type === "span" && !stegaClean(child.text).trim(),
  );
}

const ctaBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children, value }) =>
      isEmptyPortableTextBlock(value) ? (
        <div aria-hidden="true" className="h-7" />
      ) : (
        <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
          {children}
        </p>
      ),
  },
};

export default function Cta1({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  body,
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  stackAlign: "left" | "center";
  sectionWidth: "default" | "narrow";
  tagLine: string;
  title: string;
  body: any;
  links: Sanity.Link[];
  desktopReleases: DesktopReleaseLookup;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
}>) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);

  return (
    <SectionContainer color={color} padding={padding}>
      <div
        className={cn(
          align === "center" ? "text-center" : undefined,
          isNarrow ? "max-w-[48rem] mx-auto" : undefined,
        )}
      >
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {tagLine && (
            <span className="block text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground mb-4">
              {tagLine}
            </span>
          )}
          <h2 className="text-3xl md:text-5xl mb-4">{title}</h2>
          {body && (
            <div className="space-y-4 [&>img]:block">
              <PortableTextRenderer
                value={body}
                locale={locale}
                components={ctaBodyComponents}
              />
            </div>
          )}
        </div>
        {links && links.length > 0 && (
          <div
            className={cn(
              "mt-10 flex flex-wrap gap-4",
              align === "center" ? "justify-center" : undefined,
            )}
          >
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
                    release={getDesktopReleaseFromLookup(desktopReleases, link)}
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
    </SectionContainer>
  );
}
