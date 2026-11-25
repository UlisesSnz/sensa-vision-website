import SectionContainer, {
  hasSectionBottomSpacing,
  hasSectionTopSpacing,
  type ISectionContainer,
  type ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import SplitColumn from "@/components/ui/split/split-column";
import type { Locale } from "@/i18n/config";
import {
  getRenderableSplitColumns,
  isSplitSectionHeading,
  type SplitColumnContent,
} from "@/lib/split-content";
import { normalizeSectionAnchor } from "@/lib/section-anchors";
import type { DesktopReleaseLookup } from "@/lib/desktop-release-content";
import type { DesktopDownloadMessages } from "@/components/ui/desktop-download-button";

export interface ISplitRow {
  uid?: string | null;
  padding?: ISectionPadding | null;
  colorVariant?: ISectionContainer["color"] | null;
  splitColumns?: (SplitColumnContent | null)[] | null;
  locale?: Locale;
  desktopReleases?: DesktopReleaseLookup;
  downloadMessages?: DesktopDownloadMessages;
  /** Internal renderer hint for a compact Section Header → Split Row join. */
  compactTop?: boolean;
  /** The previous section already owns the visible leading spacing. */
  trimTopInset?: boolean;
}

export default function SplitRow({
  uid,
  padding,
  colorVariant,
  splitColumns,
  desktopReleases,
  downloadMessages,
  compactTop = false,
  trimTopInset = false,
  locale = "es",
}: ISplitRow) {
  const columns = getRenderableSplitColumns(splitColumns);
  if (!columns.length) return null;
  const sectionId = normalizeSectionAnchor(uid);
  const hasTopSpacing =
    hasSectionTopSpacing(padding, compactTop) || trimTopInset;
  const hasBottomSpacing = hasSectionBottomSpacing(padding);

  return (
    <SectionContainer
      id={sectionId}
      color={stegaClean(colorVariant) ?? undefined}
      padding={padding}
      compactTop={compactTop}
      className={sectionId ? "scroll-mt-20" : undefined}
    >
      <div className="grid grid-cols-1">
        {columns.map((column, index) => {
          const nextColumn = columns[index + 1];
          const isSectionBoundary =
            Boolean(nextColumn) &&
            (isSplitSectionHeading(column) ||
              isSplitSectionHeading(nextColumn));

          return (
            <SplitColumn
              {...column}
              key={column._key || index}
              className={
                nextColumn
                  ? isSectionBoundary
                    ? "mb-32 xl:mb-40"
                    : "mb-16 xl:mb-20"
                  : undefined
              }
              colorVariant={colorVariant}
              locale={locale}
              desktopReleases={desktopReleases}
              downloadMessages={downloadMessages}
              trimTopInset={index === 0 && hasTopSpacing}
              trimBottomInset={index === columns.length - 1 && hasBottomSpacing}
            />
          );
        })}
      </div>
    </SectionContainer>
  );
}
