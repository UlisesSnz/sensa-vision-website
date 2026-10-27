import SectionContainer, {
  type ISectionContainer,
  type ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import SplitColumn from "@/components/ui/split/split-column";
import type { Locale } from "@/i18n/config";
import {
  getRenderableSplitColumns,
  getSplitOptions,
  type SplitColumnContent,
} from "@/lib/split-content";
import { normalizeSectionAnchor } from "@/lib/section-anchors";
import { cn } from "@/lib/utils";

export interface ISplitRow {
  uid?: string | null;
  padding?: ISectionPadding | null;
  colorVariant?: ISectionContainer["color"] | null;
  splitColumns?: (SplitColumnContent | null)[] | null;
  locale?: Locale;
}

export default function SplitRow({
  uid,
  padding,
  colorVariant,
  splitColumns,
  locale = "es",
}: ISplitRow) {
  const columns = getRenderableSplitColumns(splitColumns);
  if (!columns.length) return null;
  const sectionId = normalizeSectionAnchor(uid);
  const hasVertical = columns.some(
    (column) => getSplitOptions(column).layout === "vertical",
  );

  return (
    <SectionContainer
      id={sectionId}
      color={stegaClean(colorVariant) ?? undefined}
      padding={padding}
      className={sectionId ? "scroll-mt-20" : undefined}
    >
      <div
        className={cn(
          "grid grid-cols-1",
          hasVertical ? "gap-16 xl:gap-20" : "gap-6 xl:gap-16",
        )}
      >
        {columns.map((column, index) => (
          <SplitColumn
            {...column}
            key={column._key || index}
            colorVariant={colorVariant}
            locale={locale}
          />
        ))}
      </div>
    </SectionContainer>
  );
}
