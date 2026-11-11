import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/portable-text-renderer", () => ({
  default: () => null,
}));

import Cta1 from "@/components/ui/cta/cta-1";

function renderCta({
  sectionWidth = "default",
  stackAlign = "left",
}: {
  sectionWidth?: "default" | "narrow";
  stackAlign?: "left" | "center";
} = {}) {
  return renderToStaticMarkup(
    createElement(Cta1, {
      title: "Explora las herramientas",
      sectionWidth,
      stackAlign,
    }),
  );
}

describe("CTA1 layout", () => {
  it("keeps the default width with left-aligned content", () => {
    const html = renderCta();

    expect(html).not.toContain("max-w-[48rem]");
    expect(html).not.toContain("text-center");
  });

  it("keeps the default width when content is centered", () => {
    const html = renderCta({ stackAlign: "center" });

    expect(html).toContain('class="text-center"');
    expect(html).not.toContain("max-w-[48rem]");
  });

  it("limits narrow content while keeping left alignment", () => {
    const html = renderCta({ sectionWidth: "narrow" });

    expect(html).toContain('class="max-w-[48rem] mx-auto"');
    expect(html).not.toContain("text-center");
  });

  it("combines narrow width and centered content", () => {
    const html = renderCta({ sectionWidth: "narrow", stackAlign: "center" });

    expect(html).toContain('class="text-center max-w-[48rem] mx-auto"');
  });

  it("uses the section heading scale", () => {
    const html = renderCta();

    expect(html).toContain(
      '<h2 class="text-3xl md:text-5xl mb-4">Explora las herramientas</h2>',
    );
  });
});
