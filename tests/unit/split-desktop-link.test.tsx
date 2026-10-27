import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSchema, validateDocument, type Workspace } from "sanity";
import { evaluate, parse } from "groq-js";
import { vercelStegaCombine } from "@vercel/stega";
import Blocks from "@/components/blocks";
import { getDictionary } from "@/i18n/dictionaries";
import { getSplitContent, type SplitColumnContent } from "@/lib/split-content";
import { collectDesktopReleaseTargets } from "@/lib/desktop-release-content";
import { fetchLatestDesktopRelease } from "@/sanity/lib/content";
import { PAGE_QUERY } from "@/sanity/queries/page";
import { releaseFixture } from "@/tests/fixtures/downloads";
import {
  initializedEmptyLink,
  splitLinkEditorDocument,
  splitLinkEditorTypes,
} from "@/tests/fixtures/split-link-editor";

vi.mock("@/sanity/lib/content", () => ({ fetchLatestDesktopRelease: vi.fn() }));
vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ url: () => "/images/placeholder.svg" }),
}));
const workspace = {
  schema: createSchema({ name: "split-desktop", types: splitLinkEditorTypes }),
  getClient: () => {
    throw new Error("No CMS access in this regression.");
  },
} as unknown as Workspace;
const desktopLink = {
  ...initializedEmptyLink,
  title: "Descargar SensaVision",
  targetType: "desktopDownload",
} as Sanity.Link;
const row = (link: Partial<Sanity.Link>, layout = "vertical") => ({
  _type: "split-row",
  _key: "feature",
  uid: "descarga",
  splitColumns: [{ _key: "column", layout, link }],
});
const render = async (blocks: Sanity.Block[], locale: "es" | "en" = "es") =>
  renderToStaticMarkup(
    await Blocks({ blocks, locale, dictionary: getDictionary(locale) }),
  );
const annotate = (value: string) =>
  vercelStegaCombine(
    value,
    { origin: "sanity.io", href: "https://example.test/edit" },
    false,
  );

beforeEach(() => {
  vi.mocked(fetchLatestDesktopRelease)
    .mockReset()
    .mockImplementation(async (platform, architecture) =>
      releaseFixture({ platform, architecture }),
    );
});

describe("Split Desktop links from Studio to the page", () => {
  it.each(["horizontal", "vertical"] as const)(
    "renders the same URL-free Desktop link that Studio validates in %s",
    async (layout) => {
      const document = {
        ...splitLinkEditorDocument({ link: desktopLink }),
        layout,
      };
      // The real editor value, including an absent href, survives save/reopen.
      const reopened = JSON.parse(JSON.stringify(document));
      const markers = await validateDocument({
        document: reopened,
        workspace,
        getDocumentExists: async () => true,
      });
      expect(markers.filter(({ level }) => level === "error")).toEqual([]);
      expect(reopened.link.href).toBeUndefined();

      const page = await (
        await evaluate(parse(PAGE_QUERY), {
          dataset: [
            {
              _id: "page",
              _type: "page",
              language: "es",
              slug: { current: "features" },
              blocks: [
                {
                  ...row(reopened.link),
                  splitColumns: [{ ...reopened, _key: "column", layout }],
                },
              ],
            },
          ],
          params: { locale: "es", slug: "features" },
        })
      ).get();
      expect(page.blocks[0].splitColumns[0].link).toEqual(desktopLink);
      const html = await render(page.blocks);
      expect(fetchLatestDesktopRelease).toHaveBeenCalledExactlyOnceWith(
        "win32",
        "x64",
      );
      expect(html).toContain(
        'href="https://downloads.example.test/win32/x64/installer"',
      );
      expect(html).toContain('download=""');
      expect(html).toContain(desktopLink.title);
      expect(html).not.toContain('disabled=""');
    },
  );

  it.each([
    { platform: "win32", architecture: "arm64" },
    { platform: "darwin", architecture: "universal" },
    { platform: "linux", architecture: "x64" },
  ] as const)(
    "loads and deduplicates the selected $platform/$architecture installer",
    async (target) => {
      const link = {
        ...desktopLink,
        downloadPlatform: target.platform,
        downloadArchitecture: target.architecture,
      };
      const blocks = [
        {
          ...row(link),
          splitColumns: [
            { _key: "first", link },
            { _key: "second", link },
          ],
        },
      ];
      const html = await render(blocks, "en");
      expect(fetchLatestDesktopRelease).toHaveBeenCalledExactlyOnceWith(
        target.platform,
        target.architecture,
      );
      expect(
        html.split(`href="${releaseFixture(target).installer.url}"`),
      ).toHaveLength(3);
      expect(html).toContain('id="descarga"');
    },
  );

  it.each(["es", "en"] as const)(
    "keeps an unavailable download visible and disabled in %s",
    async (locale) => {
      vi.mocked(fetchLatestDesktopRelease).mockResolvedValue(null);
      const html = await render([row(desktopLink)], locale);
      expect(html).toContain(getDictionary(locale).downloads.comingSoon);
      expect(html).toMatch(/<button[^>]*disabled=""/);
      expect(html).not.toContain("<a ");
    },
  );

  it("defaults legacy Desktop links to Windows x64 and ignores a stale hidden URL", async () => {
    const html = await render([
      row({
        title: "Descargar",
        targetType: "desktopDownload",
        href: "/previous-url",
        target: true,
      }),
    ]);
    expect(fetchLatestDesktopRelease).toHaveBeenCalledExactlyOnceWith(
      "win32",
      "x64",
    );
    expect(html).toContain('download=""');
    expect(html).not.toContain("previous-url");
    expect(html).not.toContain('target="_blank"');
  });

  it("cleans preview options when collecting and resolving the download", async () => {
    const link = Object.fromEntries(
      Object.entries(desktopLink).map(([key, value]) => [
        key,
        typeof value === "string" ? annotate(value) : value,
      ]),
    ) as Sanity.Link;
    const html = await render([row(link)]);
    expect(fetchLatestDesktopRelease).toHaveBeenCalledExactlyOnceWith(
      "win32",
      "x64",
    );
    expect(html).toContain(
      'href="https://downloads.example.test/win32/x64/installer"',
    );
    expect(link.title).toBe(annotate(desktopLink.title));
  });

  it.each([undefined, "", "  "])(
    "hides an optional Desktop link with empty text (%j) without loading releases",
    async (title) => {
      const link = { ...desktopLink, title };
      expect(getSplitContent({ link } as SplitColumnContent).hasLink).toBe(
        false,
      );
      // Also skip download lookup when another part of the feature remains visible.
      const blocks = [
        { ...row(link), splitColumns: [{ title: "Feature", link }] },
      ];
      expect(collectDesktopReleaseTargets(blocks)).toEqual([]);
      const html = await render(blocks);
      expect(html).toContain("Feature");
      expect(html).not.toContain("<a ");
      expect(html).not.toContain("<button");
      expect(fetchLatestDesktopRelease).not.toHaveBeenCalled();
      expect(await render([row(link)])).toBe("");
    },
  );
});
