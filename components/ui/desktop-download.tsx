import { stegaClean } from "next-sanity";

import PortableTextRenderer from "@/components/portable-text-renderer";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";
import SectionContainer, {
  type ISectionContainer,
  type ISectionPadding,
} from "@/components/ui/section-container";
import type { ButtonProps } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export default function DesktopDownload({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  body,
  buttonTitle,
  buttonVariant,
  desktopRelease,
  downloadMessages,
  locale = "es",
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  sectionWidth: "default" | "narrow";
  stackAlign: "left" | "center";
  tagLine: string;
  title: string;
  body: any;
  buttonTitle: string;
  buttonVariant: ButtonProps["variant"];
  desktopRelease: Sanity.DesktopRelease | null;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
}>) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);

  if (!downloadMessages) return null;

  return (
    <SectionContainer color={color} padding={padding}>
      <div
        className={cn(
          align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
          isNarrow ? "max-w-[48rem] mx-auto" : undefined,
        )}
      >
        <div className={cn(color === "primary" ? "text-background" : undefined)}>
          {tagLine && (
            <span className="block text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground mb-4">
              {tagLine}
            </span>
          )}
          {title && <h2 className="mb-4">{title}</h2>}
          {body && <PortableTextRenderer locale={locale} value={body} />}
        </div>
        <div
          className={cn(
            "mt-10 flex flex-wrap gap-4",
            align === "center" ? "justify-center" : undefined,
          )}
        >
          <DesktopDownloadButton
            messages={downloadMessages}
            release={desktopRelease}
            title={buttonTitle}
            variant={buttonVariant}
          />
        </div>
      </div>
    </SectionContainer>
  );
}
