import type { SlugValidationContext } from "sanity";

import { apiVersion } from "@/sanity/env";
import { DEFAULT_SANITY_LANGUAGE } from "@/sanity/i18n";

export async function isUniqueWithinLanguage(
  slug: string,
  context: SlugValidationContext,
) {
  const { document, getClient } = context;
  if (!document) return true;

  const publishedId = document._id.replace(/^drafts\./, "");
  const draftId = `drafts.${publishedId}`;
  const language =
    typeof document.language === "string"
      ? document.language
      : DEFAULT_SANITY_LANGUAGE;

  return getClient({ apiVersion }).fetch<boolean>(
    `!defined(*[
      _type == $type &&
      language == $language &&
      slug.current == $slug &&
      !(_id in [$publishedId, $draftId])
    ][0]._id)`,
    {
      type: document._type,
      language,
      slug,
      publishedId,
      draftId,
    },
  );
}
