import { type HeroScene } from "@/lib/hero-screen";

const catalog = [
  ["reception", "Agenda de recepción", "office"],
  ["market", "Frutas de temporada", "store"],
  ["botica", "Horario de la farmacia", "pharmacy"],
  ["coffee", "Café de la casa", "restaurant"],
  ["atelier", "Nueva colección de lino", "window"],
  ["turno", "Turno de atención", "pharmacy"],
  ["servicios", "Servicios de la farmacia", "pharmacy"],
] as const;

// The .png references look like real Sanity assets. The browser fixture serves
// the corresponding local vector artwork through its image loader.
export const templates = catalog.map(([name, alt, scene]) => ({
  name,
  alt,
  scene,
  _id: `image-${name.padEnd(40, "0")}-960x540-png`,
  _type: "sanity.imageAsset",
  url: `https://cdn.sanity.io/images/localqa/local/${name.padEnd(40, "0")}-960x540.png`,
}));

export function slide(asset: (typeof templates)[number], scene?: HeroScene) {
  return {
    _type: "slide",
    _key: `slide-${asset.name}`,
    alt: asset.alt,
    scene,
    asset: { _type: "reference", _ref: asset._id },
  };
}

export const pharmacySlides = [templates[2], templates[5], templates[6]].map(
  (asset) => slide(asset),
);
export const tourSlides = templates
  .slice(0, 5)
  .map((asset) => slide(asset, asset.scene));
