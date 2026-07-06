import { cn } from "@/lib/utils";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";

export default function SectionHeader({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
  uid,
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  stackAlign: "left" | "center";
  sectionWidth: "default" | "narrow";
  tagLine: string;
  title: string;
  description: string;
  uid: string;
}>) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);
  const sectionId = uid ? stegaClean(uid).trim() : undefined;

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
          <h2 className="text-3xl md:text-5xl mb-4">{title}</h2>
        </div>
        {description && <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>}
      </div>
    </SectionContainer>
  );
}
