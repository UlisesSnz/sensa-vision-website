import { defineField, defineType } from "sanity";
import { SECTION_WIDTH, STACK_ALIGN } from "../shared/layout-variants";

export default defineType({
  name: "split-column",
  type: "object",
  title: "Split Column",
  fields: [
    defineField({
      name: "layout",
      title: "Disposición",
      type: "string",
      description:
        "Horizontal conserva las dos columnas actuales. Vertical coloca el texto encima de la imagen.",
      initialValue: "horizontal",
      options: {
        layout: "radio",
        list: [
          { title: "Horizontal", value: "horizontal" },
          { title: "Vertical", value: "vertical" },
        ],
      },
    }),
    defineField({
      name: "position",
      title: "Position",
      type: "boolean",
      description: "Check this box if text content should be on the left side.",
      initialValue: false,
      hidden: ({ parent }) => parent?.layout === "vertical",
    }),
    defineField({
      name: "sectionWidth",
      title: "Ancho del conjunto",
      type: "string",
      description:
        "Normal ocupa el contenedor. Estrecho centra texto e imagen en un máximo de 48 rem. Solo se aplica a la disposición vertical.",
      initialValue: "default",
      options: { layout: "radio", list: SECTION_WIDTH },
      hidden: ({ parent }) => parent?.layout !== "vertical",
    }),
    defineField({
      name: "contentWidth",
      title: "Ancho del texto",
      type: "string",
      description:
        "Estrecho (predeterminado) centra el texto en un máximo de 48 rem sin reducir la imagen. Normal utiliza todo el ancho del conjunto.",
      initialValue: "narrow",
      options: { layout: "radio", list: SECTION_WIDTH },
      hidden: ({ parent }) => parent?.layout !== "vertical",
    }),
    defineField({
      name: "stackAlign",
      title: "Alineación del texto",
      type: "string",
      description:
        "Izquierda por defecto. Centrar el texto no cambia los anchos del texto ni de la imagen.",
      initialValue: "left",
      options: { layout: "radio", list: STACK_ALIGN },
      hidden: ({ parent }) => parent?.layout !== "vertical",
    }),
    defineField({
      name: "tagLine",
      title: "Tag Line",
      type: "string",
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "headingLevel",
      title: "Nivel del encabezado",
      type: "string",
      description:
        "H3 conserva la jerarquía actual. Elige H2 cuando esta característica sea una sección principal de la página.",
      initialValue: "h3",
      options: {
        layout: "radio",
        list: [
          { title: "H3 · Subsección", value: "h3" },
          { title: "H2 · Sección principal", value: "h2" },
        ],
      },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
        }),
      ],
    }),
    defineField({
      name: "imageFit",
      title: "Ajuste de imagen",
      type: "string",
      description:
        "Recortar conserva las alturas actuales. Imagen completa muestra el asset original sin recorte ni deformación, ideal para capturas de pantalla; no aplica el recorte ni el hotspot del editor.",
      initialValue: "cover",
      options: {
        layout: "radio",
        list: [
          { title: "Recortar para llenar", value: "cover" },
          { title: "Imagen completa", value: "contain" },
        ],
      },
    }),
    defineField({
      name: "link",
      type: "link",
      description:
        "Link to a page or external URL. Leave empty to hide the link.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      layout: "layout",
    },
    prepare({ title, media, layout }) {
      return {
        title: title || "Característica sin título",
        subtitle: layout === "vertical" ? "Vertical" : "Horizontal",
        media,
      };
    },
  },
});
