import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import NotFoundPage from "@/app/[locale]/not-found";
import Custom404 from "@/components/404";
import { getDictionary } from "@/i18n/dictionaries";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
}));

describe("not found page", () => {
  it.each(["es", "en"] as const)(
    "centers the %s recovery message and links back to its localized home page",
    (locale) => {
      const dictionary = getDictionary(locale);
      const html = renderToStaticMarkup(
        <Custom404 locale={locale} dictionary={dictionary} />,
      );

      expect(html).toContain(dictionary.notFound.title);
      expect(html).toContain(dictionary.notFound.backHome);
      expect(html).toContain(`href="/${locale}"`);
      expect(html).toContain("min-h-dvh");
      expect(html).toContain("items-center");
      expect(html).toContain("justify-center");
      expect(html).toContain("text-center");
    },
  );

  it("renders a standalone recovery screen without the site chrome", () => {
    const html = renderToStaticMarkup(<NotFoundPage />);

    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).toContain('href="/es"');
  });
});
