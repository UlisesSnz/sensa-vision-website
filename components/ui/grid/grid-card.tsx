import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import type { PortableTextProps } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";

interface GridCardProps {
  color:
    | "primary"
    | "secondary"
    | "card"
    | "accent"
    | "destructive"
    | "background"
    | "transparent";
  title: string;
  excerpt?: PortableTextProps["value"] | string;
  image: Sanity.Image;
  link?: {
    title?: string;
    href?: string;
    target?: boolean;
    buttonVariant:
      | "default"
      | "secondary"
      | "link"
      | "destructive"
      | "outline"
      | "ghost"
      | null
      | undefined;
  };
  locale?: Locale;
}

export default function GridCard({
  color,
  title,
  excerpt,
  image,
  link,
  locale = "es",
}: GridCardProps) {
  const linkHref = typeof link?.href === "string" ? link.href.trim() : "";
  const hasLink = linkHref.length > 0;
  const hasButtonTitle =
    hasLink && typeof link?.title === "string" && link.title.trim().length > 0;

  const excerptBlocks = Array.isArray(excerpt) ? excerpt : undefined;
  const excerptText = typeof excerpt === "string" ? excerpt.trim() : "";
  const hasExcerpt = (excerptBlocks?.length ?? 0) > 0 || excerptText.length > 0;

  const cardContent = (
    <div
      className={cn(
        "flex w-full flex-col justify-between overflow-hidden transition ease-in-out border rounded-3xl p-4",
        hasLink
          ? color === "primary"
            ? "group-hover:border-primary-foreground/50"
            : "group-hover:border-primary"
          : undefined,
      )}
    >
      <div>
        {image && image.asset?._id && (
          <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[12rem] rounded-2xl overflow-hidden">
            <Image
              src={
                image.asset?._id === "static"
                  ? "/images/placeholder.svg"
                  : urlFor(image.asset).url()
              }
              alt={image.alt || ""}
              placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ""}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              quality={100}
            />
          </div>
        )}
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {title && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-2xl">{title}</h3>
            </div>
          )}
          {hasExcerpt && (
            <div className="text-muted-foreground leading-relaxed">
              {excerptBlocks ? (
                <PortableTextRenderer value={excerptBlocks} locale={locale} />
              ) : (
                <p>{excerptText}</p>
              )}
            </div>
          )}
        </div>
      </div>
      {hasButtonTitle && (
        <Button
          className="mt-6"
          size="lg"
          variant={stegaClean(link?.buttonVariant)}
          asChild
        >
          <div>{link?.title}</div>
        </Button>
      )}
    </div>
  );

  if (hasLink) {
    return (
      <Link
        className="flex w-full rounded-3xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
        href={localizeHref(linkHref, locale)}
        target={link?.target ? "_blank" : undefined}
      >
        {cardContent}
      </Link>
    );
  }

  return <div className="flex w-full rounded-3xl">{cardContent}</div>;
}
