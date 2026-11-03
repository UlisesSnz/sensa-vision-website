import { cn } from "@/lib/utils";

export const FULL_SECTION_IMAGE_SIZES =
  "(min-width: 1280px) 1152px, (min-width: 1024px) 960px, (min-width: 768px) 704px, (min-width: 640px) 576px, calc(100vw - 2rem)";

export const DEFAULT_PADDING = {
  top: true,
  bottom: true,
};

export interface ISectionPadding {
  top: boolean;
  bottom: boolean;
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
}

export default function SectionContainer({
  color = "background",
  padding,
  children,
  className,
  id,
}: ISectionContainer) {
  return (
    <div
      id={id}
      className={cn(
        `bg-${color} relative`,
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
        className
      )}
    >
      <div className="container">{children}</div>
    </div>
  );
}
