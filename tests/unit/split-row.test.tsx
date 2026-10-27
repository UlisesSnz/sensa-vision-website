import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { vercelStegaCombine, vercelStegaSplit } from "@vercel/stega";
import SplitRow from "@/components/ui/split/split-row";
import SplitColumn from "@/components/ui/split/split-column";
import SectionHeader from "@/components/ui/section-header";
import Blocks from "@/components/blocks";
import { getDictionary } from "@/i18n/dictionaries";
import { withUniqueSectionAnchors } from "@/lib/section-anchors";
import { getSplitOptions, type SplitColumnContent } from "@/lib/split-content";
import { urlFor } from "@/sanity/lib/image";
import {
  designColumn,
  designRow,
  editorImage,
  legacyColumn,
  splitParagraph,
} from "@/tests/fixtures/split-row";
import { tableFixture } from "@/tests/fixtures/portable-text-table";

vi.mock("@/sanity/lib/image", () => ({
  urlFor: vi.fn(() => ({ url: () => "/images/placeholder.svg" })),
}));
vi.mock("@/sanity/lib/content", () => ({
  fetchLatestDesktopRelease: vi.fn().mockResolvedValue(null),
}));

const renderColumn = (props: SplitColumnContent) =>
  renderToStaticMarkup(<SplitColumn {...props} />);
const annotate = (text: string) =>
  vercelStegaCombine(
    text,
    { origin: "sanity.io", href: "https://example.test/studio" },
    false,
  );

describe("Split rendering and compatibility", () => {
  it.each([false, true])(
    "preserves the legacy horizontal presentation, position=%s",
    (position) => {
      const html = renderColumn({ ...legacyColumn, position });
      expect(html).toContain("lg:grid-cols-2");
      expect(html).toContain(
        "h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[30rem]",
      );
      expect(html).toContain("object-cover");
      expect(html).toContain('data-nimg="fill"');
      expect(html).toContain("px-4 py-6 lg:px-16 xl:px-20");
      expect(html).toMatch(/<h3[^>]*>Característica horizontal<\/h3>/);
      expect(html.indexOf("<img")).toBeLessThan(html.indexOf("<h3"));
      expect(html.includes("lg:order-1")).toBe(position);
      expect(html).toContain('href="/es/features#diseno"');
    },
  );

  it("renders a complete image after its H2 and description with the original asset", () => {
    const image = {
      ...editorImage,
      crop: { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 },
    };
    const html = renderColumn({ ...designColumn, image, position: true });
    expect(html.indexOf("<h2")).toBeLessThan(html.indexOf("<p"));
    expect(html.indexOf("</p>")).toBeLessThan(html.indexOf("<img"));
    expect(html).toContain('width="3190"');
    expect(html).toContain('height="1654"');
    expect(html).toContain('alt="' + editorImage.alt + '"');
    expect(html).toContain("object-contain block w-full h-auto");
    expect(html).toContain("text-3xl md:text-5xl");
    expect(html).toContain("text-lg leading-relaxed");
    expect(html).not.toContain("lg:order-1");
    expect(html).not.toContain("h-[15rem]");
    expect(urlFor).toHaveBeenLastCalledWith(image.asset);
  });

  it.each([
    undefined,
    { width: 0, height: 1654 },
    { width: 3190, height: NaN },
    { width: 3190.5, height: 1654 },
  ])("contains without stretching when dimensions are %j", (dimensions) => {
    const image = {
      ...editorImage,
      asset: { ...editorImage.asset, metadata: { dimensions } },
    } as Sanity.Image;
    const html = renderColumn({ ...designColumn, image });
    expect(html).toContain('data-nimg="fill"');
    expect(html).toContain("object-contain");
    expect(html).toContain("h-[15rem]");
    expect(html).not.toContain("object-cover");
  });

  it("supports contain horizontally and cover vertically without implicitly changing the heading", () => {
    expect(renderColumn({ ...legacyColumn, imageFit: "contain" })).toContain(
      'width="3190"',
    );
    const html = renderColumn({ ...legacyColumn, layout: "vertical" });
    expect(html).toContain("<h3");
    expect(html).toContain("object-cover");
    expect(html.indexOf("<h3")).toBeLessThan(html.indexOf("<img"));
  });

  it("normalizes missing, null and unsupported options to the same defaults", () => {
    const expected = getSplitOptions({});
    for (const value of [null, "unsupported"]) {
      const options = Object.fromEntries(
        Object.keys(expected).map((key) => [key, value]),
      ) as SplitColumnContent;
      expect(getSplitOptions(options)).toEqual(expected);
      expect(renderColumn({ ...legacyColumn, ...options })).toEqual(
        renderColumn(legacyColumn),
      );
    }
  });

  it("preserves preview annotations in text while cleaning options, the anchor and URLs", () => {
    const column = {
      ...designColumn,
      ...Object.fromEntries(
        Object.entries(getSplitOptions(designColumn)).map(([key, value]) => [
          key,
          annotate(value),
        ]),
      ),
      title: annotate(designColumn.title!),
      body: [splitParagraph(annotate("Texto editable"))],
      link: {
        href: annotate("/es/features?source=split#diseno"),
        title: annotate("Ver más"),
        target: true,
      },
    } as SplitColumnContent;
    const html = renderToStaticMarkup(
      <SplitRow
        {...designRow}
        uid={annotate("diseno")}
        splitColumns={[column]}
        locale="en"
      />,
    );
    expect(html).toContain(column.title);
    expect(html).toContain('id="diseno"');
    expect(html).toContain('href="/en/features?source=split#diseno"');
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(vercelStegaSplit(html).cleaned).toContain("Texto editable");
  });

  it.each([undefined, null, "", " \n ", annotate(" ")])(
    "omits empty headings and links: %j",
    (empty) => {
      const html = renderColumn({
        ...designColumn,
        title: empty,
        tagLine: empty,
        link: { title: empty ?? undefined, href: "/features" },
      });
      expect(html).not.toMatch(/<h[23]\b/);
      expect(html).not.toContain("<a ");
      expect(html).toContain("<img");
      expect(
        renderColumn({
          title: empty,
          body: [splitParagraph(empty ?? "")],
          link: { title: "Title", href: empty ?? undefined },
        }),
      ).toBe("");
    },
  );

  it("uses the available width for image-only, text-only and link-only units", () => {
    const imageOnly = renderColumn({ image: editorImage });
    expect(imageOnly).not.toContain("lg:grid-cols-2");
    expect(imageOnly).not.toContain("px-4");
    expect(imageOnly).not.toMatch(/<h[23]/);
    const textOnly = renderColumn({ title: "Solo texto" });
    expect(textOnly).not.toContain("lg:grid-cols-2");
    expect(textOnly).not.toContain("<img");
    expect(
      renderColumn({ link: { href: "/features", title: "Ver más" } }),
    ).toContain("<a ");
    expect(
      renderToStaticMarkup(
        <SplitRow
          uid="empty"
          padding={{ top: true, bottom: true }}
          splitColumns={[null, {}, { body: [] }]}
        />,
      ),
    ).toBe("");
  });

  it("preserves lists, formatting and inline links in Portable Text", () => {
    const paragraph = splitParagraph("Texto con formato");
    const body = [
      {
        ...paragraph,
        listItem: "bullet",
        level: 1,
        children: [{ ...paragraph.children[0], marks: ["strong", "url"] }],
        markDefs: [{ _type: "link", _key: "url", href: "/features" }],
      },
    ];
    const html = renderColumn({ ...designColumn, body });
    expect(html).toContain("<ul");
    expect(html).toContain("<strong>");
    expect(html).toContain('href="/es/features"');
  });

  it("keeps body-only media, code and tables with empty cells visible", () => {
    const table = tableFixture();
    table.rows[1].cells[0].value = [];
    expect(renderColumn({ body: [table] })).toContain("<table");
    expect(
      renderColumn({
        body: [{ _type: "image", _key: "image", ...editorImage }],
      }),
    ).toContain("<img");
    expect(
      renderColumn({
        body: [
          {
            _type: "code",
            _key: "code",
            code: "const screen = 1;",
            language: "text",
          },
        ],
      }),
    ).toContain("const screen = 1;");
  });

  it("keeps the blur placeholder and legacy row spacing, opting into vertical spacing only for visible units", () => {
    const image = {
      ...editorImage,
      asset: {
        ...editorImage.asset,
        metadata: {
          ...editorImage.asset?.metadata,
          lqip: "data:image/png;base64,YQ==",
        },
      },
    } as Sanity.Image;
    expect(renderColumn({ ...designColumn, image })).toContain(
      "background-image:",
    );
    expect(
      renderToStaticMarkup(
        <SplitRow splitColumns={[legacyColumn, { layout: "vertical" }]} />,
      ),
    ).toContain("gap-6 xl:gap-16");
    expect(
      renderToStaticMarkup(
        <SplitRow splitColumns={[legacyColumn, designColumn]} />,
      ),
    ).toContain("gap-16 xl:gap-20");
  });
});

describe("Section anchor allocation", () => {
  it.each([
    undefined,
    "",
    "   ",
    "#diseno",
    "Diseño",
    "two words",
    annotate(" "),
  ])("omits invalid or empty ID %j in both renderers", (uid) => {
    expect(
      renderToStaticMarkup(<SplitRow {...designRow} uid={uid} />),
    ).not.toContain('id="');
    expect(
      renderToStaticMarkup(<SectionHeader title="Title" uid={uid} />),
    ).not.toContain('id="');
  });

  it("allocates one ID to the whole row, cleans surrounding whitespace and clears duplicates without mutation", () => {
    const blocks = [
      { _type: "split-row", _key: "empty", uid: "diseno", splitColumns: [] },
      { _type: "split-row", _key: "design", ...designRow, uid: " diseno " },
      {
        _type: "section-header",
        _key: "duplicate",
        uid: "diseno",
        title: "Later",
      },
    ];
    const resolved = withUniqueSectionAnchors(blocks);
    expect(resolved).toHaveLength(2);
    expect(resolved.map(({ uid }) => uid)).toEqual(["diseno", undefined]);
    expect(blocks[1].uid).toBe(" diseno ");
    expect(withUniqueSectionAnchors(blocks)).toEqual(resolved);
    const html = renderToStaticMarkup(
      <SplitRow {...designRow} splitColumns={[designColumn, legacyColumn]} />,
    );
    expect(html.match(/id="diseno"/g)).toHaveLength(1);
    expect(html).toContain("scroll-mt-20");
  });

  it.each([false, true])(
    "applies duplicate protection in the actual Blocks renderer, header first=%s",
    async (headerFirst) => {
      const header = {
        _type: "section-header",
        _key: "header",
        uid: "diseno",
        title: "Another heading",
      };
      const row = { _type: "split-row", _key: "row", ...designRow };
      const blocks = (
        headerFirst ? [header, row] : [row, header]
      ) as Sanity.Block[];
      const html = renderToStaticMarkup(
        await Blocks({ blocks, locale: "es", dictionary: getDictionary("es") }),
      );
      expect(html.match(/id="diseno"/g)).toHaveLength(1);
      expect(html).toContain("Another heading");
      expect(html).toContain(designColumn.title);
    },
  );
});
