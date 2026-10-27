import {
  createSchema,
  validateDocument,
  type SanityDocument,
  type Workspace,
} from "sanity";
import { evaluate, parse } from "groq-js";
import { describe, expect, it, vi } from "vitest";
import splitRow from "@/sanity/schemas/blocks/split/split-row";
import splitColumn from "@/sanity/schemas/blocks/split/split-column";
import sectionHeader from "@/sanity/schemas/blocks/section-header";
import pageSchema from "@/sanity/schemas/documents/page";
import link from "@/sanity/schemas/blocks/shared/link";
import sectionPadding from "@/sanity/schemas/blocks/shared/section-padding";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { colorVariant } from "@/sanity/schemas/blocks/shared/color-variant";
import { PAGE_QUERY } from "@/sanity/queries/page";
import {
  designColumn,
  editorAssetId,
  editorImage,
  legacyColumn,
} from "@/tests/fixtures/split-row";

vi.mock("@/sanity/schemas/fields/localized-slug", () => ({
  isUniqueWithinLanguage: vi.fn(),
}));

const blocksField = pageSchema.fields.find(({ name }) => name === "blocks")!;
const schema = createSchema({
  name: "split",
  types: [
    splitRow,
    splitColumn,
    sectionHeader,
    link,
    sectionPadding,
    buttonVariant,
    colorVariant,
    { name: "block-content", type: "array", of: [{ type: "block" }] },
    {
      name: "testPage",
      type: "document",
      groups: pageSchema.groups,
      fields: [
        {
          ...blocksField,
          of: [{ type: "section-header" }, { type: "split-row" }],
        },
      ],
    },
  ],
});
const workspace = {
  schema,
  getClient: () => {
    throw new Error("No CMS access in schema tests.");
  },
} as unknown as Workspace;
async function errors(blocks: unknown[]) {
  const document = {
    _id: "drafts.fixture",
    _type: "testPage",
    _rev: "fixture",
    _createdAt: "2026-10-26T00:00:00Z",
    _updatedAt: "2026-10-26T00:00:00Z",
    blocks,
  } as SanityDocument;
  return (
    await validateDocument({
      document,
      workspace,
      getDocumentExists: async () => true,
    })
  ).filter(({ level }) => level === "error");
}
const row = (column: object = {}, uid?: string) => ({
  _type: "split-row",
  _key: "split",
  uid,
  splitColumns: [
    { ...column, _type: "split-column", _key: "column", image: undefined },
  ],
});

describe("Split schema contract", () => {
  it("accepts legacy rows, the complete vertical variant, optional fields and null options", async () => {
    for (const column of [
      {},
      legacyColumn,
      designColumn,
      { layout: null, imageFit: null, headingLevel: null },
    ]) {
      expect(await errors([row(column)])).toEqual([]);
    }
  });

  it.each([
    "layout",
    "imageFit",
    "headingLevel",
    "sectionWidth",
    "contentWidth",
    "stackAlign",
  ])("rejects an invalid visible %s option", async (field) => {
    const markers = await errors([
      row({ ...designColumn, [field]: "invalid" }),
    ]);
    expect(markers.map(({ path }) => path)).toContainEqual([
      "blocks",
      { _key: "split" },
      "splitColumns",
      { _key: "column" },
      field,
    ]);
  });

  it("retains valid vertical settings when switching back to horizontal", async () => {
    expect(
      await errors([
        row({
          layout: "horizontal",
          stackAlign: "center",
          contentWidth: "narrow",
          sectionWidth: "narrow",
        }),
      ]),
    ).toEqual([]);
  });

  it("shows only the position or the vertical composition controls for the selected layout", () => {
    for (const name of [
      "position",
      "sectionWidth",
      "contentWidth",
      "stackAlign",
    ]) {
      const field = splitColumn.fields.find((field) => field.name === name);
      const hidden = field && "hidden" in field ? field.hidden : undefined;
      if (typeof hidden !== "function")
        throw new Error(`Missing visibility rule for ${name}`);
      expect(
        hidden({ parent: { layout: "vertical" } } as Parameters<
          typeof hidden
        >[0]),
      ).toBe(name === "position");
      expect(
        hidden({ parent: { layout: "horizontal" } } as Parameters<
          typeof hidden
        >[0]),
      ).toBe(name !== "position");
    }
  });

  it.each(["#diseno", "Diseno", "con espacios", "   ", "diseno_"])(
    "rejects anchor format %s",
    async (uid) => {
      expect(
        (await errors([row({}, uid)])).map(({ path }) => path),
      ).toContainEqual(["blocks", { _key: "split" }, "uid"]);
    },
  );

  it("marks both conflicting IDs across rows and headers, while separate pages may reuse an ID", async () => {
    const first = row({ title: "First" }, "diseno");
    for (const second of [
      { ...first, _key: "second" },
      {
        _type: "section-header",
        _key: "second",
        title: "Header",
        uid: "diseno",
      },
    ]) {
      const paths = (await errors([first, second])).map(({ path }) => path);
      expect(paths).toContainEqual(["blocks", { _key: "split" }, "uid"]);
      expect(paths).toContainEqual(["blocks", { _key: "second" }, "uid"]);
      expect(await errors([second])).toEqual([]);
    }
    expect(await errors([first])).toEqual([]);
    expect(
      await errors([first, { ...first, _key: "another", uid: "another" }]),
    ).toEqual([]);
  });
});

describe("Split query contract", () => {
  it("projects stable keys, options, original asset metadata, alternate text and optional content", async () => {
    const asset = {
      _id: editorAssetId,
      _type: "sanity.imageAsset",
      url: "https://cdn.sanity.io/editor.png",
      metadata: {
        ...editorImage.asset?.metadata,
        lqip: "data:image/png;base64,YQ==",
      },
    };
    const column = {
      _type: "split-column",
      ...designColumn,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: editorAssetId },
        alt: editorImage.alt,
      },
      link: { title: "Ver más", href: "/features#diseno" },
    };
    const blocks = [
      {
        _type: "split-row",
        _key: "design",
        uid: "diseno",
        splitColumns: [column, { _type: "split-column", _key: "optional" }],
      },
    ];
    const dataset = [
      {
        _id: "page",
        _type: "page",
        language: "es",
        slug: { current: "features" },
        blocks,
      },
      asset,
    ];
    const page = await (
      await evaluate(parse(PAGE_QUERY), {
        dataset,
        params: { locale: "es", slug: "features" },
      })
    ).get();
    expect(page.blocks[0]).toMatchObject({ _key: "design", uid: "diseno" });
    expect(page.blocks[0].splitColumns[0]).toMatchObject({
      ...designColumn,
      image: {
        alt: editorImage.alt,
        asset: {
          _id: asset._id,
          url: asset.url,
          metadata: {
            lqip: asset.metadata.lqip,
            dimensions: { width: 3190, height: 1654 },
          },
        },
      },
      link: column.link,
    });
    expect(
      page.blocks[0].splitColumns.map((item: { _key: string }) => item._key),
    ).toEqual(["design", "optional"]);
    expect(page.blocks[0].splitColumns[1].layout).toBeNull();
  });
});
