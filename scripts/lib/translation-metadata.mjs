import { randomUUID } from "node:crypto";

export function getTranslationLanguage(translation) {
  return (
    translation?.language ??
    translation?.document?.language ??
    translation?._key
  );
}

export function getTranslationReference(translation) {
  return translation?.value?._ref ?? translation?.document?._id;
}

export function translationItem(language, reference, existingTranslations = []) {
  const existing = existingTranslations.find(
    (translation) =>
      getTranslationLanguage(translation) === language &&
      getTranslationReference(translation)?.replace(/^drafts\./, "") ===
        reference.replace(/^drafts\./, ""),
  );
  const item = {
    ...existing,
    _key: existing?._key ?? randomUUID().replaceAll("-", ""),
    _type: "internationalizedArrayReferenceValue",
    language,
    value: {
      ...existing?.value,
      _type: "reference",
      _ref: reference,
    },
  };

  // This projection is only for reading legacy metadata, never for storage.
  delete item.document;
  return item;
}
