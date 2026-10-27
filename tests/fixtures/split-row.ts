import type { SplitColumnContent } from "@/lib/split-content";
import type { ISplitRow } from "@/components/ui/split/split-row";

export const editorAssetId =
  "image-f0336381866609645b1ac1d62a11eb7dfd5240be-3190x1654-png";
export const editorImage = {
  _type: "image",
  alt: "Editor de Sensa Studio con una plantilla de agenda de clases de gimnasio y sus herramientas de diseño.",
  asset: {
    _type: "reference",
    _ref: editorAssetId,
    _id: editorAssetId,
    metadata: {
      dimensions: { width: 3190, height: 1654, aspectRatio: 3190 / 1654 },
    },
  },
} as Sanity.Image;

export const splitParagraph = (text: string, key = "paragraph") => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-text`, text, marks: [] }],
});

// Read-only snapshot of the Spanish product draft; no CMS access in these fixtures.
export const designColumn: SplitColumnContent = {
  _key: "design",
  layout: "vertical",
  imageFit: "contain",
  headingLevel: "h2",
  sectionWidth: "default",
  contentWidth: "narrow",
  stackAlign: "left",
  title: "Diseños con el estilo de tu negocio",
  body: [
    splitParagraph(
      "Parte de una plantilla para presentar productos, compartir avisos o anunciar eventos, y adáptala con el estilo de tu negocio. Combina imágenes, videos, texto y gráficos; prepara distintas páginas y formatos, añade tus colores y organiza cada pieza como quieres que se vea.",
    ),
  ],
  image: editorImage,
};

export const designRow: ISplitRow = {
  uid: "diseno",
  colorVariant: "background",
  padding: { top: true, bottom: true },
  splitColumns: [designColumn],
};

export const followingFeatures = [
  {
    title: "Dale voz a tus mensajes",
    description:
      "Convierte el texto de una promoción o un aviso en audio desde el editor. Elige entre seis voces, escucha sus muestras y añade la que mejor acompañe tu contenido.",
  },
  {
    uid: "programacion",
    title: "El contenido adecuado para cada horario",
    description:
      "Prepara tus mensajes con anticipación y organiza cuándo se muestran. Alterna menús, campañas y avisos durante el día, con una programación que puedes consultar por pantalla.",
  },
];

export const legacyColumn: SplitColumnContent = {
  _key: "legacy",
  position: false,
  title: "Característica horizontal",
  tagLine: "Producto",
  body: [splitParagraph("Descripción de la característica.")],
  image: editorImage,
  link: {
    title: "Ver producto",
    href: "/features#diseno",
    buttonVariant: "outline",
  },
};
