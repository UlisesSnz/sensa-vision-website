import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ url: () => "/images/placeholder.svg" }),
}));

import Cta1 from "@/components/ui/cta/cta-1";

type CtaRenderProps = {
  body?: unknown[];
  sectionWidth?: "default" | "narrow";
  stackAlign?: "left" | "center";
};

const bodyWithSpacer = [
  {
    _type: "block",
    _key: "description",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "description-text",
        text: "El espacio donde creas contenido.",
        marks: [],
      },
    ],
  },
  {
    _type: "block",
    _key: "spacer",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "spacer-text", text: " ", marks: [] },
    ],
  },
  {
    _type: "image",
    _key: "preview",
    alt: "Vista de Sensa Studio",
    asset: {
      url: "/images/placeholder.svg",
      metadata: { dimensions: { width: 800, height: 600 } },
    },
  },
];

function renderCta({
  body,
  sectionWidth = "default",
  stackAlign = "left",
}: CtaRenderProps = {}) {
  return renderToStaticMarkup(
    createElement(Cta1, {
      body,
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

  it("matches section description styling and preserves empty Portable Text blocks", () => {
    const html = renderCta({ body: bodyWithSpacer });

    expect(html).toContain(
      '<p class="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">El espacio donde creas contenido.</p>',
    );
    expect(html).toContain('aria-hidden="true" class="h-7"');
    expect(html).toContain("space-y-4");
    expect(html.indexOf("Vista de Sensa Studio")).toBeGreaterThan(
      html.indexOf('aria-hidden="true"'),
    );
  });
});
