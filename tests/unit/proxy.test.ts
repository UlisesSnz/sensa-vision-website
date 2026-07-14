import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

const originalEnabledLocales = process.env.ENABLED_LOCALES;

afterEach(() => {
  process.env.ENABLED_LOCALES = originalEnabledLocales;
});

function request(
  pathname: string,
  options: { acceptLanguage?: string; cookie?: string } = {},
) {
  const headers = new Headers();
  if (options.acceptLanguage) {
    headers.set("accept-language", options.acceptLanguage);
  }
  if (options.cookie) headers.set("cookie", options.cookie);
  return new NextRequest(`https://sensa.example${pathname}`, { headers });
}

describe("locale proxy", () => {
  it("redirects the root to English when enabled and preferred", () => {
    process.env.ENABLED_LOCALES = "es,en";
    const response = proxy(request("/", { acceptLanguage: "en-US,en" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sensa.example/en");
  });

  it("preserves the query string during root language detection", () => {
    process.env.ENABLED_LOCALES = "es,en";
    const response = proxy(
      request("/?utm_source=campaign", { acceptLanguage: "en-US,en" }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sensa.example/en?utm_source=campaign",
    );
  });

  it("lets the remembered locale override the browser preference", () => {
    process.env.ENABLED_LOCALES = "es,en";
    const response = proxy(
      request("/", {
        acceptLanguage: "en-US,en",
        cookie: "sensa_locale=es",
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sensa.example/es");
  });

  it("permanently redirects legacy unprefixed URLs to Spanish", () => {
    process.env.ENABLED_LOCALES = "es,en";
    const response = proxy(
      request("/about", { cookie: "sensa_locale=en" }),
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://sensa.example/es/about",
    );
  });

  it("preserves the query string when redirecting a legacy URL", () => {
    const response = proxy(request("/blog/post?utm_source=legacy"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://sensa.example/es/blog/post?utm_source=legacy",
    );
  });

  it("keeps explicit English and Spanish paths visible", () => {
    const english = proxy(request("/en/about"));
    expect(english.headers.get("x-middleware-rewrite")).toBeNull();

    const spanish = proxy(
      request("/es/about", { cookie: "sensa_locale=en" }),
    );
    expect(spanish.headers.get("x-middleware-rewrite")).toBeNull();
    expect(spanish.headers.get("location")).toBeNull();
  });

  it("does not expose English detection while English is disabled", () => {
    process.env.ENABLED_LOCALES = "es";
    const response = proxy(request("/", { acceptLanguage: "en" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sensa.example/es");
  });

  it("does not localize API or Studio routes", () => {
    const apiResponse = proxy(request("/api/newsletter"));
    const studioResponse = proxy(request("/studio/structure"));

    expect(apiResponse.headers.get("location")).toBeNull();
    expect(studioResponse.headers.get("location")).toBeNull();
  });
});
