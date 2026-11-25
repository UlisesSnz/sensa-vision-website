import type { ReactNode } from "react";
import Link from "next/link";
import { stegaClean } from "next-sanity";

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
import { getRenderableActionLinkKind } from "@/lib/action-links";
import { cn } from "@/lib/utils";

type ActionLinksProps = {
  links?: (Sanity.Link | null)[] | null;
  desktopReleases?: DesktopReleaseLookup;
  downloadMessages?: DesktopDownloadMessages;
  locale?: Locale;
  align?: "left" | "center";
  className?: string;
};

/**
 * Renders the shared multi-action contract used by editorial blocks.
 * It intentionally remains a server component so actions add no client bundle.
 */
export default function ActionLinks({
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
  align = "left",
  className,
}: ActionLinksProps) {
  const actions = (links ?? []).reduce<ReactNode[]>((items, link, index) => {
    if (!link) return items;

    const kind = getRenderableActionLinkKind(link, Boolean(downloadMessages));
    if (!kind) return items;

    const key = link._key ?? `${stegaClean(link.title) || "link"}-${index}`;

    if (kind === "desktopDownload" && downloadMessages) {
      items.push(
        <DesktopDownloadButton
          key={key}
          messages={downloadMessages}
          release={getDesktopReleaseFromLookup(desktopReleases, link)}
          target={getDesktopReleaseTargetFromContent(link)}
          title={link.title}
          variant={link.buttonVariant}
        />,
      );
      return items;
    }

    const href = stegaClean(link.href)?.trim();
    if (!href) return items;

    items.push(
      <Button key={key} asChild variant={stegaClean(link.buttonVariant)}>
        <Link
          href={localizeHref(href, locale)}
          target={link.target ? "_blank" : undefined}
          rel={link.target ? "noopener noreferrer" : undefined}
        >
          {link.title}
        </Link>
      </Button>,
    );

    return items;
  }, []);

  if (!actions.length) return null;

  return (
    <div
      className={cn(
        className,
        "mt-10 flex flex-wrap gap-4",
        align === "center" ? "justify-center" : undefined,
      )}
    >
      {actions}
    </div>
  );
}
