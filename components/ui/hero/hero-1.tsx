import Image from "next/image";
import { stegaClean } from "next-sanity";
import { FULL_SECTION_IMAGE_SIZES } from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import HeroLayout, { type HeroContentProps } from "./hero-layout";

export default function Hero1({
  layout,
  image,
  isFirstBlock = false,
  ...content
}: HeroContentProps & {
  layout?: Sanity.HeroLayout | null;
  image?: Sanity.Image;
  isFirstBlock?: boolean;
}) {
  const textAbove = stegaClean(layout) === "vertical";
  return (
    <HeroLayout {...content} textAbove={textAbove}>
      {image?.asset?._id && (
        <Image
          className={cn("rounded-xl", textAbove && "h-auto w-full")}
          src={urlFor(image.asset).url()}
          alt={image.alt || ""}
          width={image.asset.metadata?.dimensions?.width || 800}
          height={image.asset.metadata?.dimensions?.height || 800}
          sizes={textAbove ? FULL_SECTION_IMAGE_SIZES : undefined}
          loading={isFirstBlock ? "eager" : "lazy"}
          fetchPriority={isFirstBlock ? "high" : undefined}
          placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
          blurDataURL={image.asset.metadata?.lqip || ""}
          quality={100}
        />
      )}
    </HeroLayout>
  );
}
