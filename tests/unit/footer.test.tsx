import { renderToStaticMarkup } from "react-dom/server";
import { evaluate, parse } from "groq-js";
import { describe, expect, it, vi } from "vitest";

import Footer from "@/components/footer";
import SiteShell from "@/components/site-shell";
import SectionContainer from "@/components/ui/section-container";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries/site-settings";

vi.mock("next/headers", () => ({ draftMode: vi.fn() }));
vi.mock("@/components/header", () => ({ default: () => null }));
vi.mock("@/sanity/lib/live", () => ({ SanityLive: () => null }));
vi.mock("@/sanity/lib/live-action", () => ({ sanityLiveAction: vi.fn() }));
vi.mock("next-sanity/visual-editing", () => ({ VisualEditing: () => null }));
vi.mock("@/components/disable-draft-mode", () => ({ DisableDraftMode: () => null }));
vi.mock("@/public/logo.png", () => ({
  default: { src: "/logo.png", width: 100, height: 100 },
}));

function footerClass(html: string) {
  return html.match(/<footer class="([^"]+)"/)?.[1] ?? "";
}

describe("footer spacing", () => {
  it.each([undefined, null, {}, { top: null, bottom: null }])(
    "provides internal spacing for legacy/unset settings: %j",
    (padding) => {
      const html = renderToStaticMarkup(
        <Footer locale="es" dictionary={getDictionary("es")} padding={padding} />,
      );
      expect(footerClass(html)).toContain("bg-background");
      expect(footerClass(html)).toContain("pt-8 xl:pt-12");
      expect(footerClass(html)).toContain("pb-5");
    },
  );

  it.each([
    [{ top: false }, false, true],
    [{ bottom: false }, true, false],
    [{ top: false, bottom: false }, false, false],
    [{ top: true, bottom: true }, true, true],
  ] as const)("honors independent switches: %j", (padding, top, bottom) => {
    const html = renderToStaticMarkup(
      <>
        <SectionContainer padding={{ top: true, bottom: true }}>CTA</SectionContainer>
        <Footer locale="es" dictionary={getDictionary("es")} padding={padding} />
      </>,
    );
    expect(footerClass(html).includes("pt-8 xl:pt-12")).toBe(top);
    expect(footerClass(html).includes("pb-5")).toBe(bottom);
    expect(html).toContain("pt-16 xl:pt-20 pb-16 xl:pb-20");
  });

  it.each(["es", "en"] as const)(
    "passes the queried %s switches through SiteShell in published and preview mode",
    async (locale) => {
      const { draftMode } = await import("next/headers");
      const dictionary = getDictionary(locale);
      const value = await evaluate(parse(SITE_SETTINGS_QUERY), {
        params: { locale },
        dataset: ["es", "en"].map((language) => ({
          _id: `settings-${language}`, _type: "siteSettings", language,
          footerPadding: { top: language === "en", bottom: language === "es" },
        })),
      });
      const siteSettings = await value.get();
      const output = [];
      for (const isEnabled of [false, true]) {
        vi.mocked(draftMode).mockResolvedValue({ isEnabled } as Awaited<ReturnType<typeof draftMode>>);
        const html = renderToStaticMarkup(await SiteShell({
          locale, siteSettings, children: "Page content",
        }));
        expect(footerClass(html).includes("pt-8 xl:pt-12")).toBe(locale === "en");
        expect(footerClass(html).includes("pb-5")).toBe(locale === "es");
        expect(html).toContain(`href="/${locale}/about"`);
        expect(html).toContain(dictionary.footer.about);
        expect(html).toContain(dictionary.footer.rights);
        expect(html).toContain('alt="Sensa Vision Logo"');
        for (const social of ["Facebook", "Instagram", "TikTok", "WhatsApp"]) {
          expect(html).toContain(`aria-label="${social}"`);
        }
        output.push(footerClass(html));
      }
      expect(output[0]).toBe(output[1]);
    },
  );
});
