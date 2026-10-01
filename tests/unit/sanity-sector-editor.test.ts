import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSchema,
  resolveInitialValueForType,
  validateDocument,
  type SanityDocument,
  type Workspace,
} from "sanity";

import gridCard from "@/sanity/schemas/blocks/grid/grid-card";
import blockContent from "@/sanity/schemas/blocks/shared/block-content";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import link from "@/sanity/schemas/blocks/shared/link";
import sectionPadding from "@/sanity/schemas/blocks/shared/section-padding";
import siteSettings from "@/sanity/schemas/documents/site-settings";
import { localizeHref } from "@/i18n/routing";

const schema = createSchema({
  name: "sector-editor-regressions",
  types: [
    gridCard,
    blockContent,
    buttonVariant,
    link,
    siteSettings,
    sectionPadding,
    {
      name: "testPage",
      type: "document",
      fields: [{ name: "card", type: "grid-card" }],
    },
  ],
});
const getClient = () => {
  throw new Error("Schema regression tests must not access the network.");
};
// Validation uses the schema/client; omitted i18n uses Sanity's built-in locale.
const workspace = { schema, getClient } as unknown as Workspace;
const baseDocument = {
  _id: "drafts.test-page",
  _rev: "test-revision",
  _createdAt: "2026-09-30T00:00:00Z",
  _updatedAt: "2026-09-30T00:00:00Z",
};

async function errors(document: SanityDocument) {
  return (
    await validateDocument({
      document,
      workspace,
      getDocumentExists: async () => true,
    })
  ).filter((marker) => marker.level === "error");
}

function page(linkValue?: Record<string, unknown>): SanityDocument {
  return {
    ...baseDocument,
    _type: "testPage",
    card: {
      _type: "grid-card",
      title: "Prepara una campaña y reutilízala",
      ...(linkValue === undefined
        ? {}
        : { link: { _type: "link", ...linkValue } }),
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("optional grid card links", () => {
  it("initializes new cards without materializing an empty link", async () => {
    // Sanity's initial-value scheduler normally runs in the Studio browser.
    vi.stubGlobal("window", {});
    const value = await resolveInitialValueForType(
      schema.get("grid-card")!,
      {},
      5,
      {
        schema,
        projectId: "test",
        dataset: "test",
        currentUser: null,
        getClient,
      },
    );
    expect(value?.link).toBeUndefined();
    expect(await errors(page())).toEqual([]);
  });

  it("requires clearing the legacy empty object while preserving active-link rules", async () => {
    const markers = await errors(page({ buttonVariant: "default" }));
    expect(markers.map(({ path }) => path)).toEqual([
      ["card", "link", "title"],
      ["card", "link", "href"],
    ]);
    expect(await errors(page())).toEqual([]);
  });

  it.each([
    "/es/features",
    "https://example.com",
    "mailto:contact@example.com",
    "tel:+525512345678",
  ])("accepts complete links to %s", async (href) =>
    expect(await errors(page({ title: "Ver más", href }))).toEqual([]),
  );

  it.each([
    [{ title: "Ver más" }, "href"],
    [{ href: "/es/features" }, "title"],
    [{ title: "Ver más", href: "javascript:alert(1)" }, "href"],
  ])("rejects incomplete or invalid links: %j", async (value, field) => {
    expect((await errors(page(value))).map(({ path }) => path)).toContainEqual([
      "card",
      "link",
      field,
    ]);
  });

  it("keeps desktop destinations valid without a URL and rejects incompatible targets", async () => {
    expect(
      await errors(page({ title: "Descargar", targetType: "desktopDownload" })),
    ).toEqual([]);
    expect(
      (
        await errors(
          page({
            title: "Descargar",
            targetType: "desktopDownload",
            downloadPlatform: "win32",
            downloadArchitecture: "universal",
          }),
        )
      ).map(({ path }) => path),
    ).toContainEqual(["card", "link", "downloadArchitecture"]);
  });
});

describe("document-level navigation language", () => {
  it("initializes footer spacing with the existing boolean switches enabled", async () => {
    vi.stubGlobal("window", {});
    const value = await resolveInitialValueForType(
      schema.get("siteSettings")!,
      {},
      5,
      { schema, projectId: "test", dataset: "test", currentUser: null, getClient },
    );
    expect(value?.footerPadding).toMatchObject({ top: true, bottom: true });
  });

  const destinations = [
    "/retail-stores",
    "/pharmacies",
    "/smart-shop-windows",
    "/receptions",
  ];
  const navigation = (language?: string): SanityDocument => ({
    ...baseDocument,
    _type: "siteSettings",
    ...(language ? { language } : {}),
    headerNavigation: [
      {
        _key: "industries",
        _type: "navigationItem",
        label: "Industrias",
        subLinks: destinations.map((href, index) => ({
          _key: `sector-${index}`,
          _type: "navigationSubItem",
          label: `Sector ${index}`,
          href,
        })),
      },
    ],
  });

  it.each(["es", "en"])(
    "uses the %s document language without requiring it on sublinks",
    async (language) => {
      expect(await errors(navigation(language))).toEqual([]);
    },
  );

  it("requires the language on the parent document", async () => {
    expect((await errors(navigation())).map(({ path }) => path)).toEqual([
      ["language"],
    ]);
  });

  it("still rejects incomplete sublinks", async () => {
    const document = navigation("es");
    document.headerNavigation = [
      {
        _key: "industries",
        _type: "navigationItem",
        label: "Industrias",
        subLinks: [{ _key: "empty", _type: "navigationSubItem" }],
      },
    ];
    expect((await errors(document)).map(({ path }) => path.at(-1))).toEqual([
      "label",
      "href",
    ]);
  });

  it("keeps all four destinations under a single Spanish prefix", () => {
    for (const href of destinations) {
      expect(localizeHref(href, "es")).toBe(`/es${href}`);
      expect(localizeHref(`/es${href}`, "es")).toBe(`/es${href}`);
    }
  });
});
