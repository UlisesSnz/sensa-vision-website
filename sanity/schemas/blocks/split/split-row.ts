import { defineType } from "sanity";
import { LayoutList } from "lucide-react";
import { sectionAnchorField } from "../../fields/section-anchor";

export default defineType({
  name: "split-row",
  type: "object",
  title: "Split Row",
  description:
    "Agrupa características con texto e imagen. Cada unidad puede ser horizontal o vertical; el ancla pertenece al bloque completo.",
  icon: LayoutList,
  fields: [
    sectionAnchorField,
    {
      name: "padding",
      type: "section-padding",
    },
    {
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    },
    {
      name: "splitColumns",
      type: "array",
      title: "Características",
      description:
        "Para enlazar una característica de forma independiente, colócala en otro Split Row con su propia ancla.",
      of: [{ type: "split-column" }],
    },
  ],
  preview: {
    select: { columns: "splitColumns" },
    prepare({ columns }) {
      const first = columns?.[0];
      return {
        title: "Split Row",
        subtitle: first
          ? `${first.layout === "vertical" ? "Vertical" : "Horizontal"} · ${first.title || "Sin título"}${columns.length > 1 ? ` (+${columns.length - 1})` : ""}`
          : "Sin características",
      };
    },
  },
});
