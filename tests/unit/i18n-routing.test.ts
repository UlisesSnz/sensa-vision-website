import { describe, expect, it } from "vitest";

import { getEnabledLocales } from "@/i18n/config";
import {
  detectPreferredLocale,
  getDocumentAlternates,
  localizeHref,
  normalizePathname,
  stripLocalePrefix,
  toPublicPath,
} from "@/i18n/routing";

describe("locale configuration", () => {
  it("always keeps Spanish enabled and defaults to it", () => {
    expect(getEnabledLocales(undefined)).toEqual(["es"]);
    expect(getEnabledLocales("en")).toEqual(["es", "en"]);
    expect(getEnabledLocales("fr,en,en")).toEqual(["es", "en"]);
  });

  it("respects Accept-Language quality values", () => {
    expect(detectPreferredLocale("es-MX;q=0.7,en;q=0.9")).toBe("en");
    expect(detectPreferredLocale("fr-FR,es-MX;q=0.8")).toBe("es");
    expect(detectPreferredLocale(null)).toBe("es");
  });
});

describe("localized paths", () => {
  it("prefixes both Spanish and English", () => {
    expect(toPublicPath("es", "/about")).toBe("/es/about");
    expect(toPublicPath("en", "/about")).toBe("/en/about");
    expect(toPublicPath("es", "/")).toBe("/es");
    expect(toPublicPath("en", "/")).toBe("/en");
  });

  it("normalizes locale prefixes without duplicating them", () => {
    expect(normalizePathname("//blog//post/")).toBe("/blog/post");
    expect(stripLocalePrefix("/en/blog/post")).toBe("/blog/post");
    expect(toPublicPath("en", "/en/blog/post")).toBe("/en/blog/post");
  });

  it("localizes only internal root-relative links", () => {
    expect(localizeHref("/contact?source=hero#form", "en")).toBe(
      "/en/contact?source=hero#form",
    );
    expect(localizeHref("https://example.com", "en")).toBe(
      "https://example.com",
    );
    expect(localizeHref("mailto:hola@example.com", "en")).toBe(
      "mailto:hola@example.com",
    );
    expect(localizeHref("#pricing", "en")).toBe("#pricing");
    expect(localizeHref("/contact", "es")).toBe("/es/contact");
  });

  it("builds alternates from translated slugs", () => {
    expect(
      getDocumentAlternates(
        {
          _type: "page",
          language: "es",
          slug: { current: "servicios" },
          translations: [
            {
              _type: "page",
              language: "en",
              slug: { current: "services" },
            },
          ],
        },
        ["es", "en"],
      ),
    ).toEqual({ es: "/es/servicios", en: "/en/services" });
  });
});
