import { stegaClean } from "next-sanity";
import { getDictionary } from "@/i18n/dictionaries";
import { urlFor } from "@/sanity/lib/image";
import {
  DEFAULT_HERO_SCENE,
  isHeroScene,
  type HeroScene,
  type HeroScreenImage,
  type ScreenSlide,
} from "@/lib/hero-screen";
import ScreenCarousel from "./screen-carousel";
import ScreenRooms from "./screen-rooms";
import HeroLayout, { type HeroContentProps } from "./hero-layout";

type Props = HeroContentProps & {
  layout?: Sanity.HeroLayout | null;
  baseScene?: HeroScene;
  slides?: (HeroScreenImage | null)[];
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
  baseScene,
  slides,
  locale = "es",
  isFirstBlock = false,
  ...content
}: Props) {
  const textAbove = stegaClean(layout) === "vertical";
  const desktopSizes = textAbove
    ? "(min-width: 1280px) 841px, (min-width: 1024px) 701px"
    : "(min-width: 1280px) 406px, (min-width: 1024px) 336px";
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

  return (
    <HeroLayout
      {...content}
      textAbove={textAbove}
      locale={locale}
      downloadMessages={dictionary.downloads}
    >
      <ScreenCarousel
        sizes={screenSizes}
        slides={images}
        baseScene={scene}
        messages={dictionary.heroScreen}
        isFirstBlock={isFirstBlock}
      >
        <ScreenRooms
          scenes={Array.from(new Set([scene, ...images.map((slide) => slide.scene)]))}
        />
      </ScreenCarousel>
    </HeroLayout>
  );
}
