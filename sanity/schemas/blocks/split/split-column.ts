import { defineField, defineType } from "sanity";
import { SECTION_WIDTH, STACK_ALIGN } from "../shared/layout-variants";
import { splitLinkField } from "./split-link";

export default defineType({
  name: "split-column",
  type: "object",
  title: "Split Column",
  fields: [
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      description: "Place the text beside the image or above it.",
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
      title: "Text on the left",
      type: "boolean",
      description: "Turn off to place the text on the right.",
      initialValue: false,
      hidden: ({ parent }) => parent?.layout === "vertical",
    }),
    defineField({
      name: "sectionWidth",
      title: "Section width",
      type: "string",
      description: "Choose how wide the text and image appear together.",
      initialValue: "default",
      options: { layout: "radio", list: SECTION_WIDTH },
      hidden: ({ parent }) => parent?.layout !== "vertical",
    }),
    defineField({
      name: "contentWidth",
      title: "Text width",
      type: "string",
      description: "Keep the text easy to read without shrinking the image.",
      initialValue: "narrow",
      options: { layout: "radio", list: SECTION_WIDTH },
      hidden: ({ parent }) => parent?.layout !== "vertical",
    }),
    defineField({
      name: "stackAlign",
      title: "Text alignment",
      type: "string",
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
      title: "Heading",
      type: "string",
      description: "Use a section heading for a main feature.",
      initialValue: "h3",
      options: {
        layout: "radio",
        list: [
          { title: "Subheading", value: "h3" },
          { title: "Section heading", value: "h2" },
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
      title: "Image display",
      type: "string",
      description: "Show the whole image to keep all its details visible.",
      initialValue: "cover",
      options: {
        layout: "radio",
        list: [
          { title: "Fill the space", value: "cover" },
          { title: "Show the whole image", value: "contain" },
        ],
      },
    }),
    splitLinkField,
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      layout: "layout",
    },
    prepare({ title, media, layout }) {
      return {
        title: title || "Untitled feature",
        subtitle: layout === "vertical" ? "Vertical" : "Horizontal",
        media,
      };
    },
  },
});
