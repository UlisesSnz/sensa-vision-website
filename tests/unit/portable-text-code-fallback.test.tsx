import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import PortableTextCodeBlock from "@/components/portable-text-code";
import { codeFixture } from "@/tests/fixtures/portable-text-code";

vi.mock("shiki/core", () => ({ createHighlighterCoreSync: () => { throw new Error("Grammar unavailable"); } }));

it("preserves escaped code and selected lines when the highlighter fails", () => {
  const value = codeFixture({ code: '<script>literal</script>\n  next();\n', highlightedLines: [2] });
  const markup = renderToStaticMarkup(<PortableTextCodeBlock value={value} locale="es" />);
  expect(markup).not.toContain("<script>");
  expect(markup).toContain("&lt;script&gt;literal&lt;/script&gt;");
  expect(markup).toContain('class="line highlighted">  next();');
  expect(markup).toContain("Copiar código");
});
