import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { ReactNode } from "react";
import PortableTextRenderer from "@/components/portable-text-renderer";
import ActionLinks from "@/components/ui/action-links";
import type { DesktopDownloadMessages } from "@/components/ui/desktop-download-button";
import type { Locale } from "@/i18n/config";
import type { DesktopReleaseLookup } from "@/lib/desktop-release-content";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";

export type HeroContentProps = {
  contentWidth?: "default" | "narrow" | null;
  tagLine?: string;
  title?: string;
  body?: PortableTextProps["value"];
  links?: (Sanity.Link | null)[] | null;
  desktopReleases?: DesktopReleaseLookup;
  downloadMessages?: DesktopDownloadMessages;
  locale?: Locale;
};

export default function HeroLayout({
  textAbove,
  contentWidth,
  tagLine,
  title,
  body,
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
  isFirstBlock = false,
  mediaKind,
  children,
}: HeroContentProps & {
  textAbove: boolean;
  isFirstBlock?: boolean;
  mediaKind?: "screen";
  children: ReactNode;
}) {
  const isNarrow =
    textAbove && stegaClean(contentWidth) === "narrow";

  return (
    <div
      className={cn(
        "container dark:bg-background",
        isFirstBlock ? "pt-16 pb-20 xl:pt-20" : "py-20 lg:pt-40",
      )}
    >
      <div
        data-hero-content={textAbove ? "vertical" : "horizontal"}
        className={
          textAbove
            ? cn(styles.textAbove, isNarrow && styles.textAboveNarrow)
            : "grid grid-cols-1 gap-10 lg:grid-cols-2"
        }
      >
        <div className={cn(styles.intro, "flex min-w-0 flex-col justify-center")}>
          {tagLine && (
            <span className="font-pixel text-base font-semibold uppercase tracking-wide text-muted-foreground">
              {tagLine}
            </span>
          )}
          {title && <h1 className="mt-4 font-bold leading-[1.1]">{title}</h1>}
          {body && (
            <div className="mt-6 text-lg leading-relaxed text-muted-foreground">
              <PortableTextRenderer value={body} locale={locale} />
            </div>
          )}
          <ActionLinks
            className={styles.actions}
            links={links}
            desktopReleases={desktopReleases}
            downloadMessages={downloadMessages}
            locale={locale}
          />
        </div>
        <div
          data-hero-media={mediaKind}
          className="flex min-w-0 flex-col justify-center"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
