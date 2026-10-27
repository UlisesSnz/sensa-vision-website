import { defineField } from "sanity";
import link from "../shared/link";

const hasText = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

// Use the standard fields with validation scoped to this optional link.
// Empty legacy objects stay valid without rewriting stored content.
export const splitLinkField = defineField({
  name: "link",
  title: "Link",
  type: "object",
  initialValue: { _type: "link" },
  description:
    "Optional. Enter text and a URL, or choose a Desktop download. Clear the text and URL to hide the link.",
  options: { collapsible: false },
  fields: link.fields.map((field) => {
    if (field.name === "title") {
      return defineField({
        name: "title",
        title: "Text",
        type: "string",
        validation: (Rule) =>
          Rule.custom((value, { parent }) => {
            const current = parent as
              { href?: string; targetType?: string } | undefined;
            return hasText(value) ||
              !hasText(current?.href) ||
              current?.targetType === "desktopDownload"
              ? true
              : "Enter the link text, or clear the URL.";
          }),
      });
    }
    if (field.name === "href") {
      return defineField({
        ...field,
        title: "URL",
        type: "url",
        validation: (Rule) =>
          Rule.uri({
            allowRelative: true,
            scheme: ["http", "https", "mailto", "tel"],
          }).custom((value, { parent }) => {
            const current = parent as
              { title?: string; targetType?: string } | undefined;
            return current?.targetType === "desktopDownload" ||
              hasText(value) ||
              !hasText(current?.title)
              ? true
              : "Enter a URL, or clear the link text.";
          }),
      });
    }
    return field;
  }),
});
