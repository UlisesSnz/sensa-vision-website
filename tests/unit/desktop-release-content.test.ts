import { describe, expect, it } from "vitest";

import {
  collectDesktopReleaseTargets,
  getDesktopReleaseFromLookup,
  getDesktopReleaseTargetFromContent,
} from "@/lib/desktop-release-content";

const windowsRelease: Sanity.DesktopRelease = {
  version: "1.2.3",
  releasedAt: "2026-07-12T00:00:00.000Z",
  channel: "stable",
  platform: "win32",
  architecture: "x64",
  installer: {
    objectKey:
      "desktop/stable/win32/x64/v1.2.3/id/SensaVision-Windows-1.2.3-x64.exe",
    url: "https://downloads.example.com/SensaVision.exe",
    fileName: "SensaVision-Windows-1.2.3-x64.exe",
    sizeBytes: 100,
    mimeType: "application/vnd.microsoft.portable-executable",
    etag: "etag",
  },
};

describe("desktop release content targeting", () => {
  it("uses Windows x64 only as the fallback for legacy content", () => {
    expect(getDesktopReleaseTargetFromContent({})).toEqual({
      platform: "win32",
      architecture: "x64",
    });
  });

  it("rejects incomplete or unsupported editorial targets", () => {
    expect(
      getDesktopReleaseTargetFromContent({ downloadPlatform: "darwin" }),
    ).toBeNull();
    expect(
      getDesktopReleaseTargetFromContent({
        downloadPlatform: "linux",
        downloadArchitecture: "universal",
      }),
    ).toBeNull();
  });

  it("collects and deduplicates targets used by blocks and links", () => {
    const blocks = [
      {
        _type: "desktop-download",
        _key: "download-mac",
        downloadPlatform: "darwin",
        downloadArchitecture: "arm64",
      },
      {
        _type: "hero-1",
        _key: "hero",
        links: [
          {
            title: "Mac",
            targetType: "desktopDownload",
            downloadPlatform: "darwin",
            downloadArchitecture: "arm64",
          },
          {
            title: "Linux",
            targetType: "desktopDownload",
            downloadPlatform: "linux",
            downloadArchitecture: "x64",
          },
          { title: "Normal", targetType: "url", href: "/about" },
        ],
      },
      {
        _type: "cta-1",
        _key: "legacy-cta",
        links: [{ title: "Windows", targetType: "desktopDownload" }],
      },
      {
        _type: "video-1",
        _key: "video",
        links: [
          {
            title: "Windows ARM",
            targetType: "desktopDownload",
            downloadPlatform: "win32",
            downloadArchitecture: "arm64",
          },
        ],
      },
      {
        _type: "lottie-1",
        _key: "lottie",
        links: [
          {
            title: "Mac Intel",
            targetType: "desktopDownload",
            downloadPlatform: "darwin",
            downloadArchitecture: "x64",
          },
        ],
      },
    ] as unknown as Sanity.Block[];

    expect(collectDesktopReleaseTargets(blocks)).toEqual([
      { platform: "darwin", architecture: "arm64" },
      { platform: "linux", architecture: "x64" },
      { platform: "win32", architecture: "x64" },
      { platform: "win32", architecture: "arm64" },
      { platform: "darwin", architecture: "x64" },
    ]);
  });

  it("resolves only the release matching the selected target", () => {
    expect(
      getDesktopReleaseFromLookup(
        { "win32/x64": windowsRelease },
        { downloadPlatform: "win32", downloadArchitecture: "x64" },
      ),
    ).toBe(windowsRelease);
    expect(
      getDesktopReleaseFromLookup(
        { "win32/x64": windowsRelease },
        { downloadPlatform: "darwin", downloadArchitecture: "arm64" },
      ),
    ).toBeNull();
  });
});
