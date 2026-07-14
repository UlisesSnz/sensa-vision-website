import { defineField, defineType } from "sanity";

export default defineType({
  name: "link",
  type: "object",
  title: "Link",
  fields: [
    defineField({
      name: "targetType",
      title: "Destination",
      type: "string",
      initialValue: "url",
      options: {
        layout: "radio",
        list: [
          { title: "URL", value: "url" },
          { title: "SensaVision Desktop", value: "desktopDownload" },
        ],
      },
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "href",
      type: "url",
      hidden: ({ parent }) => parent?.targetType === "desktopDownload",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }).custom((value, context) => {
          const parent = context.parent as { targetType?: string } | undefined;

          return parent?.targetType === "desktopDownload" || value
            ? true
            : "La URL es obligatoria.";
        }),
    }),
    defineField({
      name: "target",
      type: "boolean",
      title: "Open in new tab",
      hidden: ({ parent }) => parent?.targetType === "desktopDownload",
    }),
    defineField({
      name: "buttonVariant",
      type: "button-variant",
      title: "Button Variant",
    }),
  ],
});
