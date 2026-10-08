import { describe, expect, it } from "vitest";

import {
  getTranslationLanguage,
  getTranslationReference,
  translationItem,
} from "@/scripts/lib/translation-metadata.mjs";

describe("Sanity translation metadata compatibility", () => {
  it("creates explicit language fields with unique keys independent of the locale", () => {
    const spanish = translationItem("es", "spanish-page");
    const english = translationItem("en", "english-page");

    expect(spanish).toMatchObject({
      _type: "internationalizedArrayReferenceValue",
      language: "es",
      value: { _type: "reference", _ref: "spanish-page" },
    });
    expect(english.language).toBe("en");
    expect(spanish._key).not.toBe("es");
    expect(english._key).not.toBe("en");
    expect(spanish._key).not.toBe(english._key);
  });

  it("reads the new language field before legacy keys and document projections", () => {
    expect(
      getTranslationLanguage({
        language: "en",
        _key: "es",
        document: { language: "es" },
      }),
    ).toBe("en");
    expect(getTranslationLanguage({ _key: "es" })).toBe("es");
    expect(
      getTranslationLanguage({ _key: "opaque-key", document: { language: "en" } }),
    ).toBe("en");
    expect(getTranslationLanguage(undefined)).toBeUndefined();
  });

  it("keeps raw references when an unpublished translation cannot be dereferenced", () => {
    const translation = {
      _key: "existing-key",
      language: "en",
      value: {
        _type: "reference",
        _ref: "custom-english-id",
        _weak: true,
        _strengthenOnPublish: { type: "page" },
      },
      document: null,
    };
    const before = structuredClone(translation);

    expect(getTranslationReference(translation)).toBe("custom-english-id");
    const result = translationItem("en", "custom-english-id", [translation]);
    expect(result._key).toBe("existing-key");
    expect(result.value).toEqual(translation.value);
    expect(result).not.toHaveProperty("document");
    expect(translation).toEqual(before);
  });

  it("reuses legacy keys and preserves references when adding the language field", () => {
    const legacy = {
      _key: "es",
      _type: "internationalizedArrayReferenceValue",
      value: { _type: "reference", _ref: "spanish-page" },
      document: { _id: "spanish-page", language: "es" },
    };
    const result = translationItem("es", "spanish-page", [legacy]);

    expect(result).toEqual({
      _key: "es",
      _type: "internationalizedArrayReferenceValue",
      language: "es",
      value: legacy.value,
    });
    expect(translationItem("es", "spanish-page", [result])).toEqual(result);
  });

  it("keeps keys stable when processing new metadata again", () => {
    const translations = [
      translationItem("es", "spanish-page"),
      translationItem("en", "english-page"),
    ];

    expect(
      translations.map((item) =>
        translationItem(item.language, item.value._ref, translations),
      ),
    ).toEqual(translations);
  });

  it("does not borrow a key or reference attributes from another translation", () => {
    const other = {
      _key: "other-key",
      language: "en",
      value: { _ref: "other-page", _weak: true },
    };
    const result = translationItem("en", "english-page", [other]);

    expect(result._key).not.toBe(other._key);
    expect(result.value).toEqual({ _type: "reference", _ref: "english-page" });
  });
});
