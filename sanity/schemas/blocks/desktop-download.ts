import { Download } from "lucide-react";
import { defineField, defineType } from "sanity";

import { SECTION_WIDTH, STACK_ALIGN } from "./shared/layout-variants";

export default defineType({
  name: "desktop-download",
  title: "Desktop download",
  type: "object",
  icon: Download,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({
      name: "colorVariant",
      title: "Color Variant",
      type: "color-variant",
    }),
    defineField({
      name: "sectionWidth",
      title: "Section Width",
      type: "string",
      options: {
        list: SECTION_WIDTH.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "stackAlign",
      title: "Stack Layout Alignment",
      type: "string",
      options: {
        list: STACK_ALIGN.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({ name: "tagLine", type: "string" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "body", type: "block-content" }),
    defineField({
      name: "buttonTitle",
      title: "Button text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buttonVariant",
      title: "Button Variant",
      type: "button-variant",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: "Desktop download", subtitle: title };
    },
  },
});
