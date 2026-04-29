import { Navigation } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const navigationSubItem = defineArrayMember({
  name: "navigationSubItem",
  title: "Sub Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(48),
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }),
    }),
    defineField({
      name: "target",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "label",
      subtitle: "href",
    },
  },
});

const navigationItem = defineArrayMember({
  name: "navigationItem",
  title: "Navigation Item",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(48),
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }).custom((value, context) => {
          const parent = context.parent as { subLinks?: unknown[] } | undefined;
          const hasSubLinks =
            Array.isArray(parent?.subLinks) && parent.subLinks.length > 0;

          if (hasSubLinks) {
            return true;
          }

          if (!value) {
            return "URL is required when this item has no sub links.";
          }

          return true;
        }),
    }),
    defineField({
      name: "target",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "subLinks",
      title: "Sub Links",
      description:
        "Optional dropdown links shown when users open this item in the header.",
      type: "array",
      of: [navigationSubItem],
      validation: (Rule) => Rule.max(12),
    }),
  ],
  preview: {
    select: {
      title: "label",
      subtitle: "href",
      subLinks: "subLinks",
    },
    prepare({ title, subtitle, subLinks }) {
      const subLinksCount = Array.isArray(subLinks) ? subLinks.length : 0;

      return {
        title: title || "Untitled link",
        subtitle:
          subLinksCount > 0
            ? `${subtitle || "Dropdown only"} - ${subLinksCount} sub links`
            : subtitle || "No URL",
      };
    },
  },
});

export default defineType({
  name: "siteSettings",
  type: "document",
  title: "Site Settings",
  icon: Navigation,
  fields: [
    defineField({
      name: "headerNavigation",
      title: "Header Navigation",
      description:
        "Main links shown in the header. Add sub links to create dropdown menus.",
      type: "array",
      of: [navigationItem],
      validation: (Rule) => Rule.required().min(1).max(12),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Site Settings",
      };
    },
  },
});