import { defineField } from "sanity";
import { SECTION_ANCHOR_PATTERN } from "@/lib/section-anchors";

export const sectionAnchorField = defineField({
  name: "uid",
  type: "string",
  title: "Anchor ID",
  description:
    "Ancla opcional de todo el bloque, incluso si contiene varias unidades. Usa un valor único en la página, como diseno, sin # ni espacios.",
  validation: (Rule) =>
    Rule.custom((value) =>
      !value || SECTION_ANCHOR_PATTERN.test(value)
        ? true
        : "Use lowercase letters, numbers, and hyphens only. Do not include # or spaces.",
    ),
});
