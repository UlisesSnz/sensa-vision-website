import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ISectionContainer } from "../section-container";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";

export interface ISplitColumn {
  colorVariant: ISectionContainer["color"];
  position: boolean;
  title: string;
  body: any;
  tagLine: string | null;
  image: Sanity.Image;
  link: {
    title: string;
    href: string;
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
  locale: Locale;
}

export default function SplitColumn({
  colorVariant,
  position,
  tagLine,
  title,
  body,
  image,
  link,
  locale = "es",
}: Partial<ISplitColumn>) {
  const color = stegaClean(colorVariant);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      {image && image.asset?._id && (
        <div
          className={cn(
            "relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[30rem] rounded-lg overflow-hidden",
            position ? "lg:order-1" : undefined,
          )}
        >
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
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            quality={100}
          />
        </div>
      )}
      <div className="px-4 py-6 lg:px-16 xl:px-20 flex flex-col justify-center">
        <div>
          <div
            className={cn(color === "primary" ? "text-background" : undefined)}
          >
            {tagLine && (
              <span className="block text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground mb-4">
                {tagLine}
              </span>
            )}
            <h3 className="mb-4 font-semibold">{title}</h3>
            {body && <PortableTextRenderer value={body} locale={locale} />}
          </div>
          {link?.href && (
            <Button
              className="mt-2"
              variant={stegaClean(link?.buttonVariant)}
              asChild
            >
              <Link
                href={localizeHref(link.href, locale)}
                target={link.target ? "_blank" : undefined}
              >
                {link.title}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
