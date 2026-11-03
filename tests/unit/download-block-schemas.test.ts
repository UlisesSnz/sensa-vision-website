import { createSchema, validateDocument, type SanityDocument, type Workspace } from "sanity";
import { describe, expect, it } from "vitest";
import sectionHeader from "@/sanity/schemas/blocks/section-header";
import desktopDownload from "@/sanity/schemas/blocks/desktop-download";
import desktopRelease from "@/sanity/schemas/documents/desktop-release";
import desktopInstaller from "@/sanity/schemas/objects/desktop-installer";
import link from "@/sanity/schemas/blocks/shared/link";
import sectionPadding from "@/sanity/schemas/blocks/shared/section-padding";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { colorVariant } from "@/sanity/schemas/blocks/shared/color-variant";
import { DESKTOP_RELEASE_PLATFORMS } from "@/lib/desktop-release";

const schema = createSchema({ name: "download-blocks", types: [
  sectionHeader, desktopDownload, desktopRelease, desktopInstaller, link, sectionPadding, buttonVariant, colorVariant,
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
  it("validates installer metadata outside the Next.js server runtime", async () => {
    const markers = await errors({
      _type: "desktopRelease",
      version: "1.2.3",
      releasedAt: "2026-10-01T00:00:00Z",
      channel: "stable",
      platform: "win32",
      architecture: "x64",
      installer: { _type: "desktopInstaller", objectKey: "invalid" },
    });
    expect(markers.map((marker) => marker.path)).toEqual([["installer"]]);
  });

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
