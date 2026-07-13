import { defineField, type ReferenceFilterResolver } from "sanity";

import { DEFAULT_SANITY_LANGUAGE } from "@/sanity/i18n";

export const languageField = defineField({
  name: "language",
  title: "Language",
  type: "string",
  readOnly: true,
  hidden: true,
  initialValue: DEFAULT_SANITY_LANGUAGE,
  validation: (Rule) => Rule.required(),
});

export const localizedReferenceFilter: ReferenceFilterResolver = ({
  document,
}) => {
  const language =
    typeof document?.language === "string"
      ? document.language
      : DEFAULT_SANITY_LANGUAGE;

  return {
    filter: "language == $language",
    params: { language },
  };
};
