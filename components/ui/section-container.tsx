import { cn } from "@/lib/utils";

export const FULL_SECTION_IMAGE_SIZES =
  "(min-width: 1280px) 1152px, (min-width: 1024px) 960px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";

export interface ISectionPadding {
  top?: boolean | null;
  bottom?: boolean | null;
}

export function hasSectionTopSpacing(
  padding: ISectionPadding | null | undefined,
  compactTop = false,
) {
  return padding?.top === true || compactTop;
}

export function hasSectionBottomSpacing(
  padding: ISectionPadding | null | undefined,
) {
  return padding?.bottom === true;
}

export interface ISectionContainer {
  color?:
    | "primary"
    | "secondary"
    | "card"
    | "accent"
    | "destructive"
    | "background"
    | "transparent";
  children: React.ReactNode;
  className?: string;
  id?: string;
  padding?: ISectionPadding | null | undefined;
  /** Internal renderer hint for a compact Section Header → content join. */
  compactTop?: boolean;
}

export default function SectionContainer({
  color = "background",
  padding,
  children,
  className,
  id,
  compactTop = false,
}: ISectionContainer) {
  return (
    <div
      id={id}
      className={cn(
        `bg-${color} relative`,
        padding?.top === true
          ? "pt-16 xl:pt-20"
          : compactTop
            ? "pt-6"
            : undefined,
        padding?.bottom === true ? "pb-16 xl:pb-20" : undefined,
        className
      )}
    >
      <div className="container">{children}</div>
    </div>
  );
}
