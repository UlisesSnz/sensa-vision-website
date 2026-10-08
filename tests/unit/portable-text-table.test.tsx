import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  createSchema,
  validateDocument,
  type Workspace,
  type SanityDocument,
} from "sanity";
import { evaluate, parse } from "groq-js";
import { vercelStegaCombine, vercelStegaSplit } from "@vercel/stega";
import PortableTextRenderer from "@/components/portable-text-renderer";
import GridCard from "@/components/ui/grid/grid-card";
import table, { tableCellContent } from "@/sanity/schemas/blocks/shared/table";
import blockContent from "@/sanity/schemas/blocks/shared/block-content";
import { validatePortableTextTable } from "@/lib/portable-text-table";
import {
  tableFixture,
  tableParagraph,
} from "@/tests/fixtures/portable-text-table";
import { PAGE_QUERY } from "@/sanity/queries/page";
import { POST_QUERY } from "@/sanity/queries/post";
import type { PortableTextTable } from "@/types/portable-text-table";

vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ url: () => "/images/placeholder.svg" }),
}));

const render = (value: unknown[], locale: "es" | "en" = "es") =>
  renderToStaticMarkup(
    <PortableTextRenderer
      value={value as PortableTextTable[]}
      locale={locale}
    />,
  );
const schema = createSchema({
  name: "tables",
  types: [
    table,
    tableCellContent,
    blockContent,
    {
      name: "tableTest",
      type: "document",
      fields: [{ name: "body", type: "block-content" }],
    },
  ],
});
const getClient = () => {
  throw new Error("Tests must not access Sanity remotely.");
};
const workspace = { schema, getClient } as unknown as Workspace;

describe("Portable Text table validation", () => {
  it("accepts empty individual cells, optional metadata and JSON reopening", () => {
    const value = tableFixture();
    value.rows[1].cells[0].value = [];
    delete value.caption;
    delete value.headerRows;
    expect(
      validatePortableTextTable(JSON.parse(JSON.stringify(value))),
    ).toEqual([]);
  });

  it.each([
    [
      "missing table key",
      (v: PortableTextTable) => {
        v._key = "";
      },
    ],
    [
      "missing rows",
      (v: PortableTextTable) => {
        v.rows = [];
      },
    ],
    [
      "missing columns",
      (v: PortableTextTable) => {
        v.rows.forEach((row) => {
          row.cells = [];
        });
      },
    ],
    [
      "unequal widths",
      (v: PortableTextTable) => {
        v.rows[1].cells.pop();
      },
    ],
    [
      "duplicate row keys",
      (v: PortableTextTable) => {
        v.rows[1]._key = v.rows[0]._key;
      },
    ],
    [
      "duplicate cell keys",
      (v: PortableTextTable) => {
        v.rows[1].cells[1]._key = v.rows[1].cells[0]._key;
      },
    ],
    [
      "missing header",
      (v: PortableTextTable) => {
        v.rows[0].cells[0].value = [];
      },
    ],
    [
      "invalid header count",
      (v: PortableTextTable) => {
        Object.assign(v, { headerRows: 2 });
      },
    ],
    [
      "null header count",
      (v: PortableTextTable) => {
        Object.assign(v, { headerRows: null });
      },
    ],
    [
      "duplicate block keys",
      (v: PortableTextTable) => {
        v.rows[1].cells[0].value!.push(tableParagraph("Duplicado"));
      },
    ],
    [
      "duplicate span keys",
      (v: PortableTextTable) => {
        const b = v.rows[1].cells[0].value![0];
        b.children.push({ ...b.children[0] });
      },
    ],
    [
      "duplicate annotation keys",
      (v: PortableTextTable) => {
        v.rows[1].cells[0].value![0].markDefs = [0, 1].map(() => ({
          _type: "link",
          _key: "link",
          href: "/features",
        }));
      },
    ],
    [
      "all blank",
      (v: PortableTextTable) => {
        v.headerRows = 0;
        v.rows.forEach((r) =>
          r.cells.forEach((c) => {
            c.value = [tableParagraph(" \n ")];
          }),
        );
      },
    ],
    [
      "nested table",
      (v: PortableTextTable) => {
        Object.assign(v.rows[1].cells[0], { value: [tableFixture()] });
      },
    ],
    [
      "list",
      (v: PortableTextTable) => {
        Object.assign(v.rows[1].cells[0].value![0], { listItem: "bullet" });
      },
    ],
    [
      "heading",
      (v: PortableTextTable) => {
        Object.assign(v.rows[1].cells[0].value![0], { style: "h2" });
      },
    ],
    [
      "unrecognized mark",
      (v: PortableTextTable) => {
        v.rows[1].cells[0].value![0].children[0].marks = ["code"];
      },
    ],
    [
      "missing span key",
      (v: PortableTextTable) => {
        v.rows[1].cells[0].value![0].children[0]._key = "";
      },
    ],
  ])("rejects %s without breaking neighboring content", (_, mutate) => {
    const value = tableFixture();
    mutate(value);
    expect(validatePortableTextTable(value).length).toBeGreaterThan(0);
    const html = render([
      tableParagraph("Antes", "before"),
      value,
      tableParagraph("Después", "after"),
    ]);
    expect(html).not.toContain("<table");
    expect(html).toContain("Antes");
    expect(html).toContain("Después");
  });

  it.each([
    null,
    undefined,
    {},
    { _type: "table", rows: [null] },
    { _type: "table", rows: [{ _type: "row", _key: "row", cells: [null] }] },
  ])("handles incomplete drafts: %j", (value) => {
    expect(validatePortableTextTable(value).length).toBeGreaterThan(0);
  });

  it("reports nested validation paths from a compiled Sanity schema", async () => {
    const value = tableFixture();
    value.rows[1].cells.pop();
    const document = {
      _id: "drafts.local",
      _type: "tableTest",
      _rev: "local",
      _createdAt: "2026-10-07T00:00:00Z",
      _updatedAt: "2026-10-07T00:00:00Z",
      body: [value],
    } as SanityDocument;
    const markers = await validateDocument({
      document,
      workspace,
      getDocumentExists: async () => true,
    });
    expect(
      markers.some(
        (marker) =>
          marker.level === "error" &&
          marker.path.some(
            (segment) =>
              typeof segment === "object" &&
              "_key" in segment &&
              segment._key === "row-1",
          ),
      ),
    ).toBe(true);
    document.body = [tableFixture()];
    expect(
      (
        await validateDocument({
          document,
          workspace,
          getDocumentExists: async () => true,
        })
      ).filter((m) => m.level === "error"),
    ).toEqual([]);
  });
});

describe("Portable Text table rendering", () => {
  it.each(["es", "en"] as const)(
    "renders semantic headers, caption and keyboard scroll region in %s",
    (locale) => {
      const html = render([tableFixture(locale)], locale);
      expect(html).toContain("<thead");
      expect(html.match(/scope="col"/g)).toHaveLength(2);
      expect(html).toContain("<tbody>");
      expect(html).toContain("<caption");
      expect(html).toContain('role="region"');
      expect(html).toContain('tabindex="0"');
      expect(html).toContain("overflow-x-auto");
      expect(html).toContain(
        locale === "es" ? "Comparación de planes" : "Plan comparison",
      );
    },
  );

  it("renders all rows in tbody with headers off and no caption", () => {
    const value = tableFixture();
    value.headerRows = 0;
    delete value.caption;
    const html = render([value]);
    expect(html).not.toContain("<thead");
    expect(html).not.toContain("<caption");
    expect(html.match(/<td /g)).toHaveLength(6);
    expect(html).toContain('aria-label="Tabla de datos"');
  });

  it.each([
    "/features",
    "https://example.com",
    "mailto:hello@example.com",
    "tel:+525512345678",
  ])("renders basic formatting and link %s", (href) => {
    const value = tableFixture();
    const block = value.rows[1].cells[0].value![0];
    block.markDefs = [{ _type: "link", _key: "url", href }];
    block.children = [
      {
        _type: "span",
        _key: "text",
        text: "Texto\nText",
        marks: ["strong", "em", "url"],
      },
    ];
    const html = render([value], "en");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<br/>");
    expect(html).toContain(
      `href="${href === "/features" ? "/en/features" : href}"`,
    );
  });

  it.each([
    "javascript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,hello",
    "https://",
  ])("rejects unsafe or invalid URL %s", (href) => {
    const value = tableFixture();
    value.rows[1].cells[0].value![0].markDefs = [
      { _key: "url", _type: "link", href },
    ];
    expect(validatePortableTextTable(value).length).toBeGreaterThan(0);
    expect(render([value])).toBe("");
  });

  it("keeps draft edit annotations and the same visible output", () => {
    const value = tableFixture();
    const published = render([value]);
    const metadata = {
      origin: "sanity.io",
      href: "https://example.com/studio",
    };
    value.caption = vercelStegaCombine(value.caption!, metadata, false);
    value.rows[1].cells[0].value![0].children[0].text = vercelStegaCombine(
      "Básico",
      metadata,
      false,
    );
    expect(validatePortableTextTable(value)).toEqual([]);
    expect(vercelStegaSplit(render([value])).cleaned).toEqual(published);
  });

  it.each(["es", "en"] as const)(
    "preserves paragraphs, lists, localized links and images around a table (%s)",
    (locale) => {
      const paragraph = tableParagraph("Paragraph", "paragraph");
      paragraph.markDefs = [{ _key: "link", _type: "link", href: "/features" }];
      paragraph.children[0].marks = ["link"];
      const list = {
        ...tableParagraph("Item", "item"),
        listItem: "bullet",
        level: 1,
      };
      const image = {
        _type: "image",
        _key: "image",
        alt: "Example",
        asset: { url: "/images/placeholder.svg" },
      };
      const existing = [paragraph, list, image];
      const baseline = render(existing, locale);
      const combined = render([...existing, tableFixture(locale)], locale);
      expect(combined.startsWith(baseline)).toBe(true);
      expect(combined).toContain("<ul");
      expect(combined).toContain(`href="/${locale}/features"`);
      expect(combined).toContain('alt="Example"');
    },
  );

  it("avoids nested links and focusable tables inside a card link", () => {
    const value = tableFixture();
    value.rows[1].cells[0].value![0].markDefs = [
      { _key: "url", _type: "link", href: "/cell" },
    ];
    value.rows[1].cells[0].value![0].children[0].marks = ["url"];
    const html = renderToStaticMarkup(
      <GridCard
        color="background"
        title="Card"
        image={undefined as never}
        excerpt={[value]}
        link={{ href: "/card", title: "Read more", buttonVariant: "default" }}
      />,
    );
    expect(html.match(/href="\/es\/card"/g)).toHaveLength(2);
    expect(html).toContain('href="/es/cell"');
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*role="region"/);
  });
});

describe("table query projections", () => {
  it.each(["es", "en"] as const)(
    "preserves cells and metadata in page, card, FAQ and post queries (%s)",
    async (locale) => {
      const body = [
        tableParagraph("Before"),
        tableFixture(locale),
        tableParagraph("After", "after"),
      ];
      const cell = (body[1] as PortableTextTable).rows[1].cells[0].value![0];
      cell.markDefs = [{ _type: "link", _key: "url", href: "/features" }];
      cell.children[0].marks = ["strong", "url"];
      cell.children[0].text = vercelStegaCombine(
        cell.children[0].text,
        { origin: "sanity.io", href: "https://example.com/studio" },
        false,
      );
      const dataset = [
        {
          _id: "page",
          _type: "page",
          language: locale,
          slug: { current: "tables" },
          blocks: [
            { _type: "hero-1", body },
            {
              _type: "grid-row",
              columns: [{ _type: "grid-card", excerpt: body }],
            },
            { _type: "faqs", faqs: [{ _type: "reference", _ref: "faq" }] },
          ],
        },
        { _id: "faq", _type: "faq", language: locale, body },
        {
          _id: "post",
          _type: "post",
          language: locale,
          slug: { current: "tables" },
          body,
        },
      ];
      const params = { locale, slug: "tables" };
      const page = await (
        await evaluate(parse(PAGE_QUERY), { dataset, params })
      ).get();
      const post = await (
        await evaluate(parse(POST_QUERY), { dataset, params })
      ).get();
      expect(page.blocks[0].body).toEqual(body);
      expect(page.blocks[1].columns[0].excerpt).toEqual(body);
      expect(page.blocks[2].faqs[0].body).toEqual(body);
      expect(post.body).toEqual(body);
    },
  );
});
