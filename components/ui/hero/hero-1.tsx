import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import DesktopDownloadButton, {
  type DesktopDownloadMessages,
} from "@/components/ui/desktop-download-button";

export default function Hero1({
  tagLine,
  title,
  body,
  image,
  links,
  desktopRelease,
  downloadMessages,
  locale = "es",
}: Partial<{
  tagLine: string;
  title: string;
  body: any;
  image: Sanity.Image;
  links: Sanity.Link[];
  desktopRelease: Sanity.DesktopRelease | null;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
}>) {
  return (
    <div className="container dark:bg-background py-20 lg:pt-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="flex flex-col justify-center">
          {tagLine && (
            <span className="text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground">
              {tagLine}
            </span>
          )}
          {title && <h1 className="mt-4 font-bold leading-[1.1]">{title}</h1>}
          {body && (
            <div className="text-lg text-muted-foreground mt-6 leading-relaxed">
              <PortableTextRenderer value={body} locale={locale} />
            </div>
          )}
          {links && links.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-4">
              {links.map((link, index) => {
                const key = link._key || `${link.title}-${index}`;

                if (link.targetType === "desktopDownload" && downloadMessages) {
                  return (
                    <DesktopDownloadButton
                      key={key}
                      messages={downloadMessages}
                      release={desktopRelease}
                      title={link.title}
                      variant={link.buttonVariant}
                    />
                  );
                }

                if (!link.href) return null;

                return (
                  <Button
                    asChild
                    key={key}
                    variant={stegaClean(link.buttonVariant)}
                  >
                    <Link
                      href={localizeHref(link.href, locale)}
                      rel={link.target ? "noopener noreferrer" : undefined}
                      target={link.target ? "_blank" : undefined}
                    >
                      {link.title}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          {image && image.asset?._id && (
            <Image
              className="rounded-xl"
              src={urlFor(image.asset).url()}
              alt={image.alt || ""}
              width={image.asset?.metadata?.dimensions?.width || 800}
              height={image.asset?.metadata?.dimensions?.height || 800}
              placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ""}
              quality={100}
            />
          )}
        </div>
      </div>
    </div>
  );
}
