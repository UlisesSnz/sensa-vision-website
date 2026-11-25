import { renderToStaticMarkup } from "react-dom/server";
import { createSchema, validateDocument, type Workspace } from "sanity";
import { evaluate, parse } from "groq-js";
import { describe, expect, it, vi } from "vitest";
import Blocks from "@/components/blocks";
import { getDictionary } from "@/i18n/dictionaries";
import { PAGE_QUERY } from "@/sanity/queries/page";
import pageSchema from "@/sanity/schemas/documents/page";
import hero1 from "@/sanity/schemas/blocks/hero/hero-1";
import hero2 from "@/sanity/schemas/blocks/hero/hero-2";
import link from "@/sanity/schemas/blocks/shared/link";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { fetchLatestDesktopRelease } from "@/sanity/lib/content";
import { pharmacySlides, templates } from "@/tests/fixtures/hero-screen";
import { releaseFixture } from "@/tests/fixtures/downloads";

vi.mock("@/sanity/schemas/fields/localized-slug", () => ({
  isUniqueWithinLanguage: vi.fn(),
}));
vi.mock("@/sanity/lib/content", () => ({ fetchLatestDesktopRelease: vi.fn() }));
vi.mock("@/sanity/env", () => ({
  projectId: "localqa",
  dataset: "local",
  apiVersion: "2024-10-31",
  useCdn: false,
}));
const blocksField = pageSchema.fields.find((field) => field.name === "blocks")!;
const workspace = {
  schema: createSchema({
    name: "local",
    types: [
      hero1,
      hero2,
      link,
      buttonVariant,
      { name: "block-content", type: "array", of: [{ type: "block" }] },
      {
        name: "testPage",
        type: "document",
        groups: pageSchema.groups,
        fields: [
          { ...blocksField, of: [{ type: "hero-1" }, { type: "hero-2" }] },
        ],
      },
    ],
  }),
  getClient: () => {
    throw new Error("Unexpected CMS access");
  },
} as unknown as Workspace;
const legacy = { _type: "hero-1", _key: "older", title: "Hero original" };
const screen = {
  _type: "hero-2",
  _key: "screen",
  title: "Nueva pantalla",
  slides: pharmacySlides,
};

async function validationPaths(blocks: object[]) {
  const markers = await validateDocument({
    workspace,
    getDocumentExists: async () => true,
    document: {
      _id: "local",
      _type: "testPage",
      _rev: "1",
      _createdAt: "",
      _updatedAt: "",
      blocks,
    },
  });
  return markers
    .filter((marker) => marker.level === "error")
    .map((marker) => marker.path);
}
async function project(blocks: object[]) {
  const page = {
    _id: "local",
    _type: "page",
    language: "en",
    slug: { current: "index" },
    blocks,
  };
  const result = await evaluate(parse(PAGE_QUERY), {
    dataset: [page],
    params: { locale: "en", slug: "index" },
  });
  return (await result.get()).blocks;
}
async function html(blocks: Sanity.Block[]) {
  return renderToStaticMarkup(
    await Blocks({ blocks, locale: "en", dictionary: getDictionary("en") }),
  );
}

describe("Hero con pantalla", () => {
  it("offers both independent blocks and validates only the images in the new hero", async () => {
    expect(
      "of" in blocksField && blocksField.of?.map((item) => item.type),
    ).toEqual(expect.arrayContaining(["hero-1", "hero-2"]));
    expect(await validationPaths([legacy, screen])).toEqual([]);
    const paths = await validationPaths([
      {
        ...screen,
        baseScene: "invalid",
        links: [1, 2, 3].map((n) => ({
          _type: "link",
          _key: String(n),
          href: "/",
          title: "Link",
        })),
        slides: [{ _type: "slide", _key: "bad", alt: "   ", scene: "invalid" }],
      },
    ]);
    const root = ["blocks", { _key: "screen" }];
    expect(paths).toEqual(
      expect.arrayContaining([
        [...root, "links"],
        [...root, "baseScene"],
        [...root, "slides", { _key: "bad" }],
        [...root, "slides", { _key: "bad" }, "alt"],
        [...root, "slides", { _key: "bad" }, "scene"],
      ]),
    );
    expect(await validationPaths([{ ...screen, slides: [] }])).toContainEqual([
      ...root,
      "slides",
    ]);
  });

  it("projects the ordered slide keys, overrides and asset references without resolving asset documents", async () => {
    const slides = [
      { ...pharmacySlides[2], scene: "restaurant" },
      pharmacySlides[0],
    ];
    const [old, projected] = await project([
      legacy,
      { ...screen, baseScene: "pharmacy", slides },
    ]);
    expect(old).toMatchObject({ _key: legacy._key, title: legacy.title });
    expect(projected).toMatchObject({
      _key: screen._key,
      baseScene: "pharmacy",
      slides: [
        {
          _key: slides[0]._key,
          alt: slides[0].alt,
          scene: "restaurant",
          assetRef: templates[6]._id,
        },
        { _key: slides[1]._key, assetRef: templates[2]._id },
      ],
    });
    expect(await html([old])).toContain("Hero original");
  });

  it.each(["home", "education", "manufacturing", "healthcare"])(
    "can open on %s as an inherited scene or a template override",
    async (scene) => {
      for (const override of [false, true]) {
        const block = {
          ...screen,
          baseScene: override ? "office" : scene,
          slides: [{ ...pharmacySlides[0], scene: override ? scene : undefined }, pharmacySlides[1]],
        };
        expect(await validationPaths([block])).toEqual([]);
        const output = await html(await project([block]));
        expect(output).toContain(`data-scene="${scene}"`);
        expect(output).toContain(`data-room="${scene}" data-active="true"`);
        expect(output).toContain(`alt="${pharmacySlides[0].alt}"`);
      }
    },
  );

  it.each([legacy, screen])(
    "preserves layout and text-width choices while accepting older $_type blocks",
    async (block) => {
      expect(await validationPaths([
        block,
        {
          ...block,
          _key: "stacked",
          layout: "vertical",
          contentWidth: "narrow",
        },
      ])).toEqual([]);
      for (const layout of ["horizontal", "vertical"]) {
        const [projected] = await project([
          { ...block, layout, contentWidth: "narrow" },
        ]);
        expect(projected.layout).toBe(layout);
        expect(projected.contentWidth).toBe("narrow");
      }
      const [older] = await project([block]);
      expect(older.layout).toBeNull();
      expect(older.contentWidth).toBeNull();
    },
  );

  it.each([hero1, hero2])(
    "shows text-width controls only for the vertical layout",
    (hero) => {
      const field = hero.fields?.find((candidate) => candidate.name === "contentWidth");
      const hidden = field && "hidden" in field ? field.hidden : undefined;
      if (typeof hidden !== "function")
        throw new Error("Missing text-width visibility rule");

      expect(
        hidden({ parent: { layout: "vertical" } } as Parameters<typeof hidden>[0]),
      ).toBe(false);
      expect(
        hidden({ parent: { layout: "horizontal" } } as Parameters<typeof hidden>[0]),
      ).toBe(true);
    },
  );

  it("renders only the first image in server HTML, with localized links and the resolved Desktop download", async () => {
    vi.mocked(fetchLatestDesktopRelease).mockResolvedValue(
      releaseFixture({ platform: "win32", architecture: "x64" }),
    );
    const output = await html(
      await project([
        {
          ...screen,
          links: [
            { _key: "url", title: "Features", href: "/features" },
            {
              _key: "install",
              title: "Download",
              targetType: "desktopDownload",
            },
          ],
        },
      ]),
    );
    expect(output).toContain('data-scene="office"');
    expect(output).toContain('data-hero-media="screen"');
    expect(output.match(/<img\b/g)).toHaveLength(1);
    expect(output).toContain(encodeURIComponent(templates[2].url));
    expect(output).toMatch(/<img\b[^>]*fetchpriority="high"/i);
    expect(output).toContain("q=75");
    expect(output).toContain(`alt="${pharmacySlides[0].alt}"`);
    expect(output).toContain('href="/en/features"');
    expect(output).toContain(
      'href="https://downloads.example.test/win32/x64/installer"',
    );
    const lowerHero = await html(await project([legacy, screen]));
    expect(lowerHero).toMatch(/<img\b[^>]*loading="lazy"/i);
    expect(lowerHero).not.toMatch(/fetchpriority="high"/i);
    expect(await html([legacy])).not.toContain("data-hero-media");
  });

  it("requests a full-width Hero 1 image eagerly only when it leads the page", async () => {
    const imageHero = {
      ...legacy,
      _key: "image-hero",
      layout: "vertical",
      image: { asset: templates[3], alt: templates[3].alt },
    };
    const leading = await html([imageHero]);
    expect(leading).toMatch(/<img\b[^>]*loading="eager"/i);
    expect(leading).toMatch(/<img\b[^>]*fetchpriority="high"/i);
    expect(leading).toContain("(min-width: 1280px) 1152px");
    const lower = await html([legacy, imageHero]);
    expect(lower).toMatch(/<img\b[^>]*loading="lazy"/i);
    expect(lower).not.toMatch(/fetchpriority="high"/i);
  });

  it("uses compact top spacing only when either hero leads the page", async () => {
    const leadingClass =
      'class="container dark:bg-background pt-16 pb-20 xl:pt-20"';
    const followingClass =
      'class="container dark:bg-background py-20 lg:pt-40"';

    expect(await html([legacy])).toContain(leadingClass);
    expect(await html([screen])).toContain(leadingClass);
    expect(await html([legacy, screen])).toContain(followingClass);
    expect(await html([screen, legacy])).toContain(followingClass);
  });

  it("keeps the copy and a static screen for missing references and partial drafts", async () => {
    const output = await html(
      await project([
        {
          ...screen,
          baseScene: "unknown",
          links: [null],
          slides: [
            null,
            { _key: "empty" },
            { _key: "incomplete", asset: { _ref: "image-incomplete" } },
          ],
        },
      ]),
    );
    expect(output).toContain(screen.title);
    expect(output).toContain("Screen on standby");
    expect(output).not.toContain("<button");
    expect(output).not.toContain("<img ");
  });
});
