import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import type { ReactNode } from "react";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import {
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";

export type HeroContentProps = {
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
  tagLine,
  title,
  body,
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
  children,
}: HeroContentProps & { textAbove: boolean; children: ReactNode }) {
  const buttons = (links ?? []).map((link, index) => {
    if (!link) return null;
    const key = link._key ?? index;
    if (stegaClean(link.targetType) === "desktopDownload" && downloadMessages) {
      return (
        <DesktopDownloadButton
          key={key}
          title={link.title}
          variant={link.buttonVariant}
          target={getDesktopReleaseTargetFromContent(link)}
          release={getDesktopReleaseFromLookup(desktopReleases, link)}
          messages={downloadMessages}
        />
      );
    }
    const href = stegaClean(link.href)?.trim();
    if (!href || !stegaClean(link.title)?.trim()) return null;
    return (
      <Button key={key} asChild variant={stegaClean(link.buttonVariant)}>
        <Link
          href={localizeHref(href, locale)}
          target={link.target ? "_blank" : undefined}
          rel={link.target ? "noopener noreferrer" : undefined}
        >
          {link.title}
        </Link>
      </Button>
    );
  });

  return (
    <div className="container dark:bg-background py-20 lg:pt-40">
      <div
        data-hero-content=""
        className={
          textAbove ? styles.textAbove : "grid grid-cols-1 gap-10 lg:grid-cols-2"
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
          {buttons.some(Boolean) && (
            <div className={cn(styles.actions, "mt-10 flex flex-wrap gap-4")}>
              {buttons}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}
