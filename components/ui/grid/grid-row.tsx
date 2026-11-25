import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
// import only the components you need
import GridCard from "./grid-card";
import PricingCard from "./pricing-card";
import GridPost from "./grid-post";
import type { Locale } from "@/i18n/config";

interface Grid1Props {
  padding: {
    top: boolean;
    bottom: boolean;
  };
  colorVariant:
    | "primary"
    | "secondary"
    | "card"
    | "accent"
    | "destructive"
    | "background"
    | "transparent";
  gridColumns: "grid-cols-2" | "grid-cols-3" | "grid-cols-4";
  columns: Sanity.Block[];
  locale: Locale;
  pricingMessages: { monthly: string; annual: string };
  /** Internal renderer hint for a compact Section Header → Grid Row join. */
  compactTop?: boolean;
}

// map all components you need
const componentMap: { [key: string]: React.ComponentType<any> } = {
  "grid-card": GridCard,
  "pricing-card": PricingCard,
  "grid-post": GridPost,
};

function getGridCardImageSizes(gridColumns?: Grid1Props["gridColumns"]) {
  const columnCount =
    gridColumns === "grid-cols-2"
      ? 2
      : gridColumns === "grid-cols-3"
        ? 3
        : gridColumns === "grid-cols-4"
          ? 4
          : 1;
  // SectionContainer content widths, gap-6, and p-4 + 1px card borders.
  const imageWidth = (contentWidth: number) =>
    (contentWidth - 24 * (columnCount - 1)) / columnCount - 34;

  return [
    `(min-width: 1280px) ${imageWidth(1152)}px`,
    `(min-width: 1024px) ${imageWidth(960)}px`,
    "(min-width: 768px) 670px",
    "(min-width: 640px) 542px",
    "calc(100vw - 4rem - 2px)",
  ].join(", ");
}

export default function GridRow({
  padding,
  colorVariant,
  gridColumns,
  columns,
  locale = "es",
  pricingMessages,
  compactTop = false,
}: Partial<Grid1Props>) {
  const color = stegaClean(colorVariant);
  const cleanGridColumns = stegaClean(gridColumns);
  const imageSizes = getGridCardImageSizes(cleanGridColumns);

  return (
    <SectionContainer color={color} padding={padding} compactTop={compactTop}>
      {columns && columns?.length > 0 && (
        <div
          className={cn(
            `grid grid-cols-1 gap-6`,
            cleanGridColumns ? `lg:${cleanGridColumns}` : undefined,
          )}
        >
          {columns.map((block: Sanity.Block) => {
            const Component = componentMap[block._type];
            if (!Component) {
              // Fallback for unknown block types to debug
              return <div data-type={block._type} key={block._key} />;
            }
            return (
              <Component
                {...block}
                {...(block._type === "grid-card" ? { imageSizes } : {})}
                color={color}
                key={block._key}
                locale={locale}
                pricingMessages={pricingMessages}
              />
            );
          })}
        </div>
      )}
    </SectionContainer>
  );
}
