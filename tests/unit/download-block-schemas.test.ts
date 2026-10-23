import { createSchema, validateDocument, type SanityDocument, type Workspace } from "sanity";
import { describe, expect, it } from "vitest";
import sectionHeader from "@/sanity/schemas/blocks/section-header";
import desktopDownload from "@/sanity/schemas/blocks/desktop-download";
import link from "@/sanity/schemas/blocks/shared/link";
import sectionPadding from "@/sanity/schemas/blocks/shared/section-padding";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { colorVariant } from "@/sanity/schemas/blocks/shared/color-variant";
import { DESKTOP_RELEASE_PLATFORMS } from "@/lib/desktop-release";

const schema = createSchema({ name: "download-blocks", types: [
  sectionHeader, desktopDownload, link, sectionPadding, buttonVariant, colorVariant,
  { name: "block-content", type: "array", of: [{ type: "block" }] },
  { name: "testPage", type: "document", fields: [
    { name: "header", type: "section-header" },
    { name: "download", type: "desktop-download" },
  ] },
] });
const workspace = { schema, getClient: () => { throw new Error("No remote CMS access in schema tests."); } } as unknown as Workspace;

async function errors(fields: Record<string, unknown>) {
  const document: SanityDocument = { _id: "drafts.fixture", _type: "testPage", _rev: "fixture", _createdAt: "2026-10-01T00:00:00Z", _updatedAt: "2026-10-01T00:00:00Z", ...fields };
  return (await validateDocument({ document, workspace, getDocumentExists: async () => true })).filter((marker) => marker.level === "error");
}

describe("download block schema compatibility", () => {
  it("accepts legacy headers and optional URL links without changing the anchor", async () => {
    expect(await errors({ header: { _type: "section-header", title: "Producto", uid: "requisitos" } })).toEqual([]);
    expect(await errors({ header: { _type: "section-header", uid: "requisitos", links: [{ _type: "link", _key: "downloads", title: "Ver descargas", href: "/downloads" }] } })).toEqual([]);
    expect((await errors({ header: { _type: "section-header", links: [{ _type: "link", _key: "invalid", title: "Missing URL" }] } })).map(({ path }) => path)).toContainEqual(["header", "links", { _key: "invalid" }, "href"]);
  });

  it("accepts Android with no architecture or button text and ignores stale desktop fields", async () => {
    for (const architecture of [undefined, "x64", "universal"]) {
      expect(await errors({ download: { _type: "desktop-download", title: "Android", downloadPlatform: "android", downloadArchitecture: architecture } })).toEqual([]);
    }
    expect(DESKTOP_RELEASE_PLATFORMS).not.toContain("android");
  });

  it("requires a visible Android title while preserving desktop validation", async () => {
    expect((await errors({ download: { _type: "desktop-download", title: " ", downloadPlatform: "android" } })).map(({ path }) => path)).toEqual([["download", "title"]]);
    expect((await errors({ download: { _type: "desktop-download", downloadPlatform: "linux", downloadArchitecture: "universal" } })).map(({ path }) => path)).toEqual(expect.arrayContaining([["download", "downloadArchitecture"], ["download", "buttonTitle"]]));
    expect(await errors({ download: { _type: "desktop-download", buttonTitle: "Descargar" } })).toEqual([]);
  });
});
