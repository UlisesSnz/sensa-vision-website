import { renderToStaticMarkup } from "react-dom/server";
import { evaluate, parse } from "groq-js";
import { describe, expect, it, vi } from "vitest";
import { vercelStegaCombine } from "@vercel/stega";
import DesktopDownload from "@/components/ui/desktop-download";
import { getDictionary } from "@/i18n/dictionaries";
import { DESKTOP_RELEASE_TARGETS, getDesktopReleaseTargetKey } from "@/lib/desktop-release";
import { collectDesktopReleaseTargets, getDesktopReleaseFromLookup } from "@/lib/desktop-release-content";
import { PAGE_QUERY } from "@/sanity/queries/page";
import { LATEST_DESKTOP_RELEASE_QUERY } from "@/sanity/queries/desktop-release";
import { fetchLatestDesktopRelease } from "@/sanity/lib/content";
import { sanityFetch } from "@/sanity/lib/live";
import { androidBody, installationHeader, releaseFixture } from "@/tests/fixtures/downloads";

vi.mock("@/sanity/lib/image", () => ({ urlFor: () => undefined }));
vi.mock("@/sanity/lib/live", () => ({ sanityFetch: vi.fn().mockResolvedValue({ data: null }) }));

describe("download block availability", () => {
  it.each(["es", "en"] as const)("renders Android as a native disabled button in %s", (locale) => {
    const windowsRelease = releaseFixture({ platform: "win32", architecture: "x64" });
    const html = renderToStaticMarkup(<DesktopDownload
      downloadPlatform="android" downloadArchitecture="x64" title="Android"
      body={androidBody} buttonTitle="Ignored desktop text" buttonVariant="outline"
      desktopReleases={{ "win32/x64": windowsRelease }}
      downloadMessages={getDictionary(locale).downloads} locale={locale}
    />);
    expect(html).toContain('<h2 class="mb-4">Android</h2>');
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain(getDictionary(locale).downloads.comingSoon);
    expect(html).toContain("border-input");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("Ignored desktop text");
    expect(html).not.toContain(windowsRelease.installer.url);
  });

  it.each([undefined, "", " \n "])("provides a real Android heading for an unset title: %j", (title) => {
    const html = renderToStaticMarkup(<DesktopDownload downloadPlatform="android" title={title} downloadMessages={getDictionary("es").downloads} />);
    expect(html).toContain('<h2 class="mb-4">Android</h2>');
  });

  it("preserves Android availability in an annotated preview", () => {
    const platform = vercelStegaCombine("android", { origin: "sanity.io", href: "https://example.test/edit" }, false) as Sanity.DownloadPlatform;
    const html = renderToStaticMarkup(<DesktopDownload downloadPlatform={platform} downloadMessages={getDictionary("es").downloads} />);
    expect(html).toContain(">Android</h2>");
    expect(html).toContain('disabled=""');
  });

  it.each(DESKTOP_RELEASE_TARGETS)("keeps $title available only with its own installer", (target) => {
    const release = releaseFixture(target);
    const props = { downloadPlatform: target.platform, downloadArchitecture: target.architecture, downloadMessages: getDictionary("es").downloads };
    const html = renderToStaticMarkup(<DesktopDownload {...props} desktopReleases={{ [`${target.platform}/${target.architecture}`]: release }} />);
    expect(html).toContain(`href="${release.installer.url}"`);
    expect(html).toContain(getDictionary("es").downloads.defaultLabels[getDesktopReleaseTargetKey(target)]);
    expect(html).not.toContain('disabled=""');
    const unavailable = renderToStaticMarkup(<DesktopDownload {...props} />);
    expect(unavailable).toContain('disabled=""');
    expect(unavailable).not.toContain("<a");
  });

  it("does not request a desktop release or borrow Windows for Android", () => {
    const android = { _type: "desktop-download", _key: "android", downloadPlatform: "android", downloadArchitecture: "x64" };
    expect(collectDesktopReleaseTargets([android])).toEqual([]);
    expect(getDesktopReleaseFromLookup({ "win32/x64": releaseFixture({ platform: "win32", architecture: "x64" }) }, android)).toBeNull();
    expect(collectDesktopReleaseTargets([{ _type: "desktop-download", _key: "legacy" }])).toEqual([{ platform: "win32", architecture: "x64" }]);
  });
});

describe("offline download queries", () => {
  it("projects optional links, anchor, Android fields and editorial order", async () => {
    const blocks = [
      { _type: "section-header", _key: "install", ...installationHeader },
      { _type: "section-header", _key: "web", title: "Navegador web" },
      { _type: "desktop-download", _key: "android", title: "Android", downloadPlatform: "android", body: androidBody },
      { _type: "desktop-download", _key: "windows", title: "Windows", downloadPlatform: "win32", downloadArchitecture: "x64" },
      { _type: "desktop-download", _key: "linux", title: "Linux", downloadPlatform: "linux", downloadArchitecture: "x64" },
    ];
    const value = await evaluate(parse(PAGE_QUERY), { params: { locale: "es", slug: "downloads" }, dataset: [{ _type: "page", _id: "fixture", language: "es", slug: { current: "downloads" }, blocks }] });
    const page = await value.get();
    expect(page.blocks.map((block: { title: string }) => block.title)).toEqual(blocks.map((block) => block.title));
    expect(page.blocks[0]).toMatchObject({ uid: "requisitos", links: installationHeader.links, padding: installationHeader.padding });
    expect(page.blocks[2]).toMatchObject({ downloadPlatform: "android", body: androidBody });
    expect(collectDesktopReleaseTargets(page.blocks)).toEqual([{ platform: "win32", architecture: "x64" }, { platform: "linux", architecture: "x64" }]);
  });

  it("selects the newest stable release with an installer for the exact target", async () => {
    const release = releaseFixture({ platform: "linux", architecture: "arm64" });
    const dataset = [
      { _type: "desktopRelease", ...release },
      { _type: "desktopRelease", ...release, version: "2.0.0", releasedAt: "2026-10-02", channel: "beta" },
      { _type: "desktopRelease", ...release, releasedAt: "2026-10-03", architecture: "x64" },
      { _type: "desktopRelease", ...release, releasedAt: "2026-10-04", installer: null },
    ];
    const value = await evaluate(parse(LATEST_DESKTOP_RELEASE_QUERY), { params: { platform: "linux", architecture: "arm64" }, dataset });
    expect(await value.get()).toEqual(release);
    await fetchLatestDesktopRelease("linux", "arm64");
    expect(sanityFetch).toHaveBeenCalledWith(expect.objectContaining({ perspective: "published", stega: false, params: { platform: "linux", architecture: "arm64" } }));
  });
});
