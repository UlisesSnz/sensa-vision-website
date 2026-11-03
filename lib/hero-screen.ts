export const HERO_SCENES = [
  { value: "office", title: "Office or reception" },
  { value: "store", title: "Store" },
  { value: "pharmacy", title: "Pharmacy" },
  { value: "restaurant", title: "Restaurant or café" },
  { value: "window", title: "Shop window" },
] as const;

export type HeroScene = (typeof HERO_SCENES)[number]["value"];
export const DEFAULT_HERO_SCENE: HeroScene = "office";

export function isHeroScene(value: unknown): value is HeroScene {
  return HERO_SCENES.some((scene) => scene.value === value);
}

/** A projected Sanity image can still be incomplete in a draft. */
export type HeroScreenImage = {
  _key: string;
  assetRef?: string | null;
  alt?: string | null;
  scene?: HeroScene | null;
};

export type ScreenSlide = {
  key: string;
  src: string;
  alt: string;
  scene: HeroScene;
};
