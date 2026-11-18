import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createSchema, validateDocument, type Workspace, type SanityDocument } from "sanity";
import { codeSchema } from "@sanity/code-input";
import { vercelStegaCombine } from "@vercel/stega";
import PortableTextRenderer from "@/components/portable-text-renderer";
import PortableTextCodeBlock from "@/components/portable-text-code";
import GridCard from "@/components/ui/grid/grid-card";
import { codeFixture } from "@/tests/fixtures/portable-text-code";
import { cleanCodeText, codeLanguages } from "@/lib/portable-text-code";
import { highlightCode } from "@/lib/highlight-code";
import table, { tableCellContent } from "@/sanity/schemas/blocks/shared/table";
import blockContent from "@/sanity/schemas/blocks/shared/block-content";

vi.mock("@/sanity/lib/image", () => ({ urlFor: () => ({ url: () => "/images/placeholder.svg" }) }));
const render = (value = codeFixture(), locale: "es" | "en" = "es") =>
  renderToStaticMarkup(<PortableTextRenderer value={[value]} locale={locale} />);

describe("Portable Text code rendering", () => {
  it("renders one highlighted tree with two themes, filename and selected lines", () => {
    const markup = render();
    expect(markup.match(/<pre/g)).toHaveLength(1);
    expect(markup).toContain("--shiki-light");
    expect(markup).toContain("--shiki-dark");
    expect(markup).toContain("saludo.ts");
    expect(markup.match(/class="line highlighted"/g)).toHaveLength(2);
    expect(markup).toContain('role="region"');
    expect(markup).toContain("Copiar código");
    expect(render(codeFixture(), "en")).toContain("Copy code");
  });

  it("renders literal HTML as text and never creates executable markup", () => {
    const markup = render(codeFixture({ code: '<script>alert("x")</script>\n<img src=x onerror=alert(1)>', language: "alien" }));
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img");
    expect(markup).toMatch(/(?:&lt;|&#x3C;)script(?:>|&gt;)/);
    expect(markup).toContain("alien");
  });

  it.each(codeLanguages.map(language => language.value))("supports %s without fallback", language => {
    expect(highlightCode("const result = 1", language)).toContain('class="shiki');
  });

  it("treats package manager commands as shell", () => {
    const command = "npm install @sanity/code-input";
    expect(highlightCode(command, "npm")).toBe(highlightCode(command, "bash"));
  });

  it("removes Sanity annotations while preserving all original whitespace", () => {
    const original = "\tconst value = 1;  \n\n";
    const annotated = vercelStegaCombine(original, { origin: "sanity.io", href: "https://example.com" });
    expect(cleanCodeText(annotated)).toBe(original);
    const markup = render(codeFixture({ code: annotated, filename: vercelStegaCombine("file.ts", { origin: "sanity.io" }) }));
    expect(markup).not.toContain("\u200b");
    expect(markup).not.toContain("https://example.com");
  });

  it.each([undefined, "", " \n\t"])("omits incomplete code %j during editing", code => {
    expect(render(codeFixture({ code }))).toBe("");
  });

  it("keeps copy buttons outside linked cards", () => {
    const markup = renderToStaticMarkup(<GridCard title="Example" color="background"
      image={null as unknown as Sanity.Image} excerpt={[codeFixture()]}
      link={{ href: "/features", title: "Read more", buttonVariant: "default" }} />);
    expect(markup).toContain("/es/features");
    expect(markup).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<button/);
  });
});

describe("Portable Text media styling", () => {
  it("uses the shared editorial media radius for embedded images", () => {
    const markup = renderToStaticMarkup(
      <PortableTextRenderer
        locale="es"
        value={[
          {
            _type: "image",
            _key: "editorial-image",
            alt: "Imagen editorial",
            asset: {
              url: "/images/placeholder.svg",
              metadata: { dimensions: { width: 800, height: 600 } },
            },
          },
        ]}
      />,
    );

    expect(markup).toContain('class="rounded-2xl"');
    expect(markup).not.toContain("border-radius");
  });
});

describe("native Sanity code schema", () => {
  const schema = createSchema({ name: "code-test", types: [codeSchema, table, tableCellContent, blockContent,
    { name: "codeTest", type: "document", fields: [{ name: "body", type: "block-content" }] },
  ] });
  const getClient = () => { throw new Error("No remote access in unit tests"); };
  const workspace = { schema, getClient } as unknown as Workspace;
  const validate = (code: string) => validateDocument({
    document: { _id: "qa", _type: "codeTest", _rev: "qa", _createdAt: "2026-10-19T00:00:00Z",
      _updatedAt: "2026-10-19T00:00:00Z", body: [codeFixture({ code })] } as SanityDocument,
    workspace, getDocumentExists: async () => true,
  });

  it("blocks publishing an empty code object", async () => {
    const markers = await validate(" \n ");
    expect(markers.some(marker => marker.level === "error" && marker.message.includes("Escribe código"))).toBe(true);
  });
  it("accepts native fields after saving and reopening JSON", async () => {
    expect((await validate(codeFixture().code!)).filter(marker => marker.level === "error")).toEqual([]);
    const reopened = JSON.parse(JSON.stringify(codeFixture()));
    expect(renderToStaticMarkup(<PortableTextCodeBlock value={reopened} locale="es" />)).toContain("saludo.ts");
  });
});
