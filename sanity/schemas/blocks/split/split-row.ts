import { defineType } from "sanity";
import { LayoutList } from "lucide-react";
import { sectionAnchorField } from "../../fields/section-anchor";

export default defineType({
  name: "split-row",
  type: "object",
  title: "Split Row",
  description:
    "Present features with text and images, side by side or stacked.",
  icon: LayoutList,
  fields: [
    sectionAnchorField,
    {
      name: "padding",
      type: "section-padding",
      title: "Spacing",
      description: "Add space above or below this section.",
    },
    {
      name: "colorVariant",
      type: "color-variant",
      title: "Background",
      description: "Choose a background for this section.",
    },
    {
      name: "splitColumns",
      type: "array",
      title: "Features",
      description:
        "Add features in the order they should appear.",
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
          ? `${first.layout === "vertical" ? "Vertical" : "Horizontal"} · ${first.title || "Untitled"}${columns.length > 1 ? ` (+${columns.length - 1})` : ""}`
          : "No features",
      };
    },
  },
});
