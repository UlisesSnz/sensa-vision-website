import { cn } from "@/lib/utils";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import ActionLinks from "@/components/ui/action-links";
import type { Locale } from "@/i18n/config";
import type { DesktopDownloadMessages } from "@/components/ui/desktop-download-button";
import type { DesktopReleaseLookup } from "@/lib/desktop-release-content";

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
        <div aria-hidden="true" className="h-8 xl:h-12" />
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
        <ActionLinks
          align={align === "center" ? "center" : "left"}
          links={links}
          desktopReleases={desktopReleases}
          downloadMessages={downloadMessages}
          locale={locale}
        />
      </div>
    </SectionContainer>
  );
}
