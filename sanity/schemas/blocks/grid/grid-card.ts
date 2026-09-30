import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";
import OptionalLinkInput from "@/sanity/components/optional-link-input";

export default defineType({
  name: "grid-card",
  type: "object",
  icon: LayoutGrid,
  // Override nested link defaults so a new card can remain unlinked.
  initialValue: { link: undefined },
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "excerpt",
      type: "block-content",
    }),
    defineField({
      name: "image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "link",
      type: "link",
      components: { input: OptionalLinkInput },
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title: "Grid Card",
        subtitle: title || "No title",
        media,
      };
    },
  },
});
