import { defineField } from "sanity";
import { SECTION_ANCHOR_PATTERN } from "@/lib/section-anchors";

export const sectionAnchorField = defineField({
  name: "uid",
  type: "string",
  title: "Anchor ID",
  description:
    "Optional. A unique name for linking directly to this section, such as design.",
  validation: (Rule) =>
    Rule.custom((value) =>
      !value || SECTION_ANCHOR_PATTERN.test(value)
        ? true
        : "Use lowercase letters, numbers, and hyphens only. Do not include # or spaces.",
    ),
});
