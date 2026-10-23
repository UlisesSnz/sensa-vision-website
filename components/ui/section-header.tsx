import { cn } from "@/lib/utils";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { vercelStegaSplit } from "@vercel/stega";
import Link from "next/link";
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

export default function SectionHeader({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
  uid,
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
  description: string;
  uid: string;
  links: Sanity.Link[];
  desktopReleases: DesktopReleaseLookup;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
}>) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);
  const sectionId = uid ? stegaClean(uid).trim() : undefined;
  const visibleLinks = (links || []).filter((link) =>
    stegaClean(link.targetType) === "desktopDownload"
      ? Boolean(downloadMessages)
      : Boolean(stegaClean(link.href)?.trim() && stegaClean(link.title)?.trim()),
  );
  // Keep Sanity's edit annotations on every paragraph after splitting the text.
  const { cleaned, encoded } = vercelStegaSplit(description ?? "");
  const paragraphs = cleaned
    .replace(/\r\n?/g, "\n")
    .split(/\n(?:[ \t]*\n)+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <SectionContainer
      id={sectionId}
      color={color}
      padding={padding}
      className={sectionId ? "scroll-mt-20" : undefined}
    >
      <div
        className={cn(
          align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
          isNarrow ? "max-w-[48rem] mx-auto" : undefined
        )}
      >
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {tagLine && (
            <span className="block text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground mb-4">{tagLine}</span>
          )}
          {stegaClean(title)?.trim() && (
            <h2 className="text-3xl md:text-5xl mb-4">{title}</h2>
          )}
        </div>
        {paragraphs.length > 0 && (
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line"
              >
                {paragraph + encoded}
              </p>
            ))}
          </div>
        )}
        {visibleLinks.length > 0 && (
          <div
            className={cn(
              "mt-10 flex flex-wrap gap-4",
              align === "center" ? "justify-center" : undefined,
            )}
          >
            {visibleLinks.map((link, index) => {
              const key = link._key || `${link.title}-${index}`;

              if (stegaClean(link.targetType) === "desktopDownload" && downloadMessages) {
                return (
                  <DesktopDownloadButton
                    key={key}
                    messages={downloadMessages}
                    release={getDesktopReleaseFromLookup(desktopReleases, link)}
                    target={getDesktopReleaseTargetFromContent(link)}
                    title={link.title}
                    variant={link.buttonVariant}
                  />
                );
              }

              return (
                <Button asChild key={key} variant={stegaClean(link.buttonVariant)}>
                  <Link
                    href={localizeHref(stegaClean(link.href!), locale)}
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
