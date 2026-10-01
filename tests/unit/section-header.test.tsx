import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  vercelStegaCombine,
  vercelStegaDecode,
  vercelStegaSplit,
} from "@vercel/stega";
import { describe, expect, it } from "vitest";

import SectionHeader from "@/components/ui/section-header";

function renderDescription(description?: string) {
  return renderToStaticMarkup(
    createElement(SectionHeader, { title: "Producto", description }),
  );
}

function getParagraphs(html: string) {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g), (match) => match[1]);
}

const editMetadata = {
  origin: "sanity.io",
  href: "https://example.com/studio/intent/edit/id=page;path=blocks[0].description",
};

describe("SectionHeader descriptions", () => {
  it.each(["\n", "\r\n", "\r"])(
    "renders three paragraphs with %j line endings",
    (lineEnding) => {
      const html = renderDescription(
        ["Primero.", "Segundo.", "Tercero."].join(lineEnding.repeat(2)),
      );

      expect(getParagraphs(html)).toEqual(["Primero.", "Segundo.", "Tercero."]);
      expect(html).toContain('class="space-y-4"');
    },
  );

  it.each(["\n", "\r\n", "\r"])(
    "preserves a single %j line break within its paragraph",
    (lineEnding) => {
      const html = renderDescription(`Primera línea.${lineEnding}Segunda línea.`);

      expect(getParagraphs(html)).toEqual(["Primera línea.\nSegunda línea."]);
      expect(html).toContain("whitespace-pre-line");
    },
  );

  it("ignores extra blank lines and trims outer paragraph whitespace", () => {
    const html = renderDescription(
      " \r\n\t\r\n  Primero. \r\n \t\r\n\r\n  Segundo.\r\n\r\n \t\r\n",
    );

    expect(getParagraphs(html)).toEqual(["Primero.", "Segundo."]);
  });

  it.each([undefined, "", "   \t", "\r\n \t\r\n\n"])(
    "omits paragraphs and their wrapper for an empty description: %j",
    (description) => {
      const html = renderDescription(description);

      expect(getParagraphs(html)).toEqual([]);
      expect(html).not.toContain("space-y-4");
    },
  );

  it("preserves text and typography for a description without line breaks", () => {
    const html = renderDescription("Una descripción sin saltos.");

    expect(getParagraphs(html)).toEqual(["Una descripción sin saltos."]);
    expect(html).toContain("text-muted-foreground text-lg leading-relaxed");
  });

  it("renders HTML as safe literal text", () => {
    const html = renderDescription("<strong>Texto</strong>\n\n<script>alert(1)</script>");

    expect(getParagraphs(html)).toEqual([
      "&lt;strong&gt;Texto&lt;/strong&gt;",
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    ]);
    expect(html).not.toContain("<strong>");
    expect(html).not.toContain("<script>");
  });

  it("preserves the same visible text and edit metadata on every preview paragraph", () => {
    const description = "\r\nPrimera línea.\r\nSegunda línea.\r\n \t\r\nOtro párrafo.\r\n\r\n";
    const publishedParagraphs = getParagraphs(renderDescription(description));
    const previewParagraphs = getParagraphs(
      renderDescription(vercelStegaCombine(description, editMetadata, false)),
    );

    expect(previewParagraphs.map((paragraph) => vercelStegaSplit(paragraph).cleaned))
      .toEqual(publishedParagraphs);
    expect(previewParagraphs).toHaveLength(2);
    for (const paragraph of previewParagraphs) {
      expect(vercelStegaDecode(paragraph)).toEqual(editMetadata);
    }
  });

  it("does not render an empty description containing only preview annotations", () => {
    const html = renderDescription(
      vercelStegaCombine("\r\n \t\r\n", editMetadata, false),
    );

    expect(getParagraphs(html)).toEqual([]);
    expect(html).not.toContain("space-y-4");
  });
});
