import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSchema,
  resolveInitialValueForType,
  unset,
  validateDocument,
  type SanityDocument,
  type Workspace,
} from "sanity";
import { getSplitContent, type SplitColumnContent } from "@/lib/split-content";
import {
  applyEditorPatches,
  initializedEmptyLink,
  splitLinkEditorDocument,
  splitLinkEditorTypes,
} from "@/tests/fixtures/split-link-editor";

const schema = createSchema({
  name: "split-link-tests",
  types: splitLinkEditorTypes,
});
const getClient = () => {
  throw new Error("No CMS access in editor tests.");
};
const workspace = { schema, getClient } as unknown as Workspace;
async function errors(document: SanityDocument) {
  return (
    await validateDocument({
      document,
      workspace,
      getDocumentExists: async () => true,
    })
  ).filter(({ level }) => level === "error");
}
async function initial(type: string) {
  vi.stubGlobal("window", {});
  return resolveInitialValueForType(schema.get(type)!, {}, 5, {
    schema,
    projectId: "localqa",
    dataset: "local",
    currentUser: null,
    getClient,
  });
}
const reopen = (document: SanityDocument): SanityDocument =>
  JSON.parse(JSON.stringify(document));
afterEach(() => vi.unstubAllGlobals());

describe("Split Column optional-link lifecycle", () => {
  it.each(["split-column", "splitLinkEditor", "grid-card"])(
    "initializes %s without requiring a link",
    async (type) => {
      const value = await initial(type);
      const link = value?.link as { title?: string; href?: string } | undefined;
      expect(link?.title).toBeUndefined();
      expect(link?.href).toBeUndefined();
      const document = reopen(splitLinkEditorDocument(value));
      expect(await errors(document)).toEqual([]);
      expect(getSplitContent(document as SplitColumnContent).hasLink).toBe(
        false,
      );
    },
  );

  it("preserves column defaults and the existing link shape", async () => {
    expect(await initial("split-column")).toMatchObject({
      layout: "horizontal",
      position: false,
      headingLevel: "h3",
      imageFit: "cover",
      sectionWidth: "default",
      contentWidth: "narrow",
      stackAlign: "left",
      link: { _type: "link", targetType: "url", buttonVariant: "default" },
    });
  });

  it.each([
    "/features#diseno",
    "https://example.com",
    "mailto:hello@example.com",
    "tel:+525512345678",
  ])("accepts and reopens a complete link to %s", async (href) => {
    const document = reopen({
      ...splitLinkEditorDocument(),
      link: { ...initializedEmptyLink, title: "Ver más", href },
    });
    expect(await errors(document)).toEqual([]);
    expect(getSplitContent(document as SplitColumnContent).hasLink).toBe(true);
  });

  it.each([
    [{ title: "Ver más" }, "href"],
    [{ href: "/features" }, "title"],
    [{ title: "Ver más", href: "javascript:alert(1)" }, "href"],
  ])(
    "keeps validation for an incomplete or invalid link: %j",
    async (value, field) => {
      expect(
        (
          await errors({
            ...splitLinkEditorDocument(),
            link: { ...initializedEmptyLink, ...value },
          })
        ).map(({ path }) => path),
      ).toContainEqual(["link", field]);
    },
  );

  it.each([
    undefined,
    null,
    {},
    initializedEmptyLink,
    { ...initializedEmptyLink, title: "", href: "" },
  ])("accepts an empty link without any action: %j", async (link) => {
    const document = reopen({ ...splitLinkEditorDocument(), link });
    expect(await errors(document)).toEqual([]);
    expect(getSplitContent(document as SplitColumnContent).hasLink).toBe(false);
  });

  it("hides the link after clearing its fields without losing content", async () => {
    const withoutLink = splitLinkEditorDocument();
    const document = {
      ...withoutLink,
      link: { ...initializedEmptyLink, title: "Ver más", href: "/features" },
    };
    const cleared = reopen(
      applyEditorPatches(document, [
        unset(["link", "title"]),
        unset(["link", "href"]),
      ]),
    );
    expect(cleared).toEqual({ ...withoutLink, link: initializedEmptyLink });
    expect(await errors(cleared)).toEqual([]);
    expect(getSplitContent(cleared as SplitColumnContent).hasLink).toBe(false);
  });

  it("accepts legacy empty links at the actual nested row path without changing them", async () => {
    const { uid, ...column } = splitLinkEditorDocument();
    const document: SanityDocument = {
      ...column,
      _type: "splitLinkPage",
      row: {
        _type: "split-row",
        uid,
        splitColumns: [
          {
            ...column,
            _type: "split-column",
            _key: "feature",
            link: initializedEmptyLink,
          },
        ],
      },
    };
    const path = ["row", "splitColumns", { _key: "feature" }, "link"];
    expect(await errors(document)).toEqual([]);
    const cleared = reopen(applyEditorPatches(document, [unset(path)]));
    expect(await errors(cleared)).toEqual([]);
    expect(cleared.row).toMatchObject({
      uid: "diseno",
      splitColumns: [
        { title: column.title, body: column.body, image: column.image },
      ],
    });
  });

  it("preserves CTA and Desktop validation", async () => {
    const document = {
      ...splitLinkEditorDocument(),
      _type: "splitLinkPage",
      cta: {
        _type: "cta-1",
        links: [{ ...initializedEmptyLink, _key: "cta-link" }],
      },
    };
    expect((await errors(document)).map(({ path }) => path)).toEqual([
      ["cta", "links", { _key: "cta-link" }, "title"],
      ["cta", "links", { _key: "cta-link" }, "href"],
    ]);
    const desktop = {
      _type: "link",
      title: "Descargar",
      targetType: "desktopDownload",
      downloadPlatform: "win32",
      downloadArchitecture: "x64",
    };
    expect(
      await errors({ ...splitLinkEditorDocument(), link: desktop }),
    ).toEqual([]);
    expect(
      (
        await errors({
          ...document,
          cta: {
            _type: "cta-1",
            links: [{ ...desktop, _key: "cta-link", title: undefined }],
          },
        })
      ).map(({ path }) => path),
    ).toContainEqual(["cta", "links", { _key: "cta-link" }, "title"]);
    expect(
      (
        await errors({
          ...splitLinkEditorDocument(),
          link: { ...desktop, downloadArchitecture: "universal" },
        })
      ).map(({ path }) => path),
    ).toContainEqual(["link", "downloadArchitecture"]);
  });
});
