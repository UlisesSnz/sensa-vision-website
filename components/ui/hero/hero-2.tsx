import type { PortableTextProps } from "@portabletext/react";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import DesktopDownloadButton from "@/components/ui/desktop-download-button";
import SectionContainer from "@/components/ui/section-container";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizeHref } from "@/i18n/routing";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";
import {
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";
import {
  DEFAULT_HERO_SCENE,
  isHeroScene,
  type HeroScene,
  type HeroScreenImage,
  type ScreenSlide,
} from "@/lib/hero-screen";
import ScreenCarousel from "./screen-carousel";
import ScreenRooms from "./screen-rooms";
import styles from "./layout.module.css";

type Props = {
  layout?: Sanity.HeroLayout | null;
  tagLine?: string;
  title?: string;
  body?: PortableTextProps["value"];
  links?: (Sanity.Link | null)[];
  baseScene?: HeroScene;
  slides?: (HeroScreenImage | null)[];
  desktopReleases?: DesktopReleaseLookup;
  locale?: Locale;
  isFirstBlock?: boolean;
};

function templateUrl(assetRef?: string | null) {
  if (!assetRef) return;
  try {
    return urlFor({ _ref: assetRef }).url();
  } catch {
    // A partially edited reference must not prevent the rest of the page from rendering.
    return;
  }
}

export default function Hero2({
  layout,
  tagLine,
  title,
  body,
  links,
  baseScene,
  slides,
  desktopReleases,
  locale = "es",
  isFirstBlock = false,
}: Props) {
  const textAbove = stegaClean(layout) === "vertical";
  const desktopSizes = textAbove
    ? "(min-width: 1280px) 841px, (min-width: 1024px) 701px"
    : "(min-width: 1280px) 474px, (min-width: 1024px) 392px";
  const screenSizes = `${desktopSizes}, (min-width: 768px) 514px, (min-width: 640px) 421px, calc(75vw - 24px)`;
  const dictionary = getDictionary(locale);
  const base = stegaClean(baseScene);
  const scene = isHeroScene(base) ? base : DEFAULT_HERO_SCENE;
  const images: ScreenSlide[] = (slides ?? []).flatMap((slide) => {
    if (!slide?._key) return [];
    const src = templateUrl(stegaClean(slide.assetRef));
    if (!src) return [];
    const override = stegaClean(slide.scene);
    return [
      {
        key: slide._key,
        src,
        alt: stegaClean(slide.alt)?.trim() || "",
        scene: isHeroScene(override) ? override : scene,
      },
    ];
  });
  const buttons = (links ?? []).map((link, index) => {
    if (!link) return null;
    const key = link._key ?? index;
    if (stegaClean(link.targetType) === "desktopDownload") {
      return (
        <DesktopDownloadButton
          key={key}
          title={link.title}
          variant={link.buttonVariant}
          target={getDesktopReleaseTargetFromContent(link)}
          release={getDesktopReleaseFromLookup(desktopReleases, link)}
          messages={dictionary.downloads}
        />
      );
    }
    const href = stegaClean(link.href)?.trim();
    if (!href || !stegaClean(link.title)?.trim()) return null;
    return (
      <Button key={key} asChild variant={stegaClean(link.buttonVariant)}>
        <Link
          href={localizeHref(href, locale)}
          target={link.target ? "_blank" : undefined}
          rel={link.target ? "noopener noreferrer" : undefined}
        >
          {link.title}
        </Link>
      </Button>
    );
  });

  return (
    <SectionContainer className="py-14 sm:py-20 lg:py-28">
      <div
        className={
          textAbove
            ? styles.textAbove
            : "grid items-center gap-8 lg:grid-cols-[5fr_7fr] lg:gap-10"
        }
      >
        <div className={cn(styles.intro, "min-w-0")}>
          {tagLine && (
            <span className="font-pixel text-base font-semibold uppercase tracking-wide text-muted-foreground">
              {tagLine}
            </span>
          )}
          {title && (
            <h1 className="mt-4 text-balance font-bold leading-[1.1]">
              {title}
            </h1>
          )}
          {body && (
            <div className="mt-6 leading-relaxed">
              <PortableTextRenderer value={body} locale={locale} />
            </div>
          )}
          {buttons.some(Boolean) && (
            <div className={cn(styles.actions, "mt-8 flex flex-wrap gap-4")}>
              {buttons}
            </div>
          )}
        </div>
        <ScreenCarousel
          sizes={screenSizes}
          slides={images}
          baseScene={scene}
          messages={dictionary.heroScreen}
          isFirstBlock={isFirstBlock}
        >
          <ScreenRooms
            scenes={Array.from(
              new Set([scene, ...images.map((slide) => slide.scene)]),
            )}
          />
        </ScreenCarousel>
      </div>
    </SectionContainer>
  );
}
