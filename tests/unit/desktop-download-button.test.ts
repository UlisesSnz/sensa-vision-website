import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DesktopDownloadButton from "@/components/ui/desktop-download-button";
import { getDictionary } from "@/i18n/dictionaries";

const release: Sanity.DesktopRelease = {
  version: "1.2.3",
  releasedAt: "2026-07-12T00:00:00.000Z",
  channel: "stable",
  platform: "win32",
  architecture: "x64",
  installer: {
    objectKey:
      "desktop/stable/win32/x64/v1.2.3/id/SensaVision-Windows-1.2.3-x64.exe",
    url: "https://downloads.example.com/SensaVision.exe",
    fileName: "SensaVision-Setup-1.2.3-x64.exe",
    sizeBytes: 100,
    mimeType: "application/vnd.microsoft.portable-executable",
    etag: "etag",
  },
};

describe("DesktopDownloadButton", () => {
  const defaultLabels = {
    "win32/x64": "Descargar para Windows x64",
    "win32/arm64": "Descargar para Windows ARM64",
    "darwin/x64": "Descargar para macOS Intel",
    "darwin/arm64": "Descargar para macOS Apple Silicon",
    "darwin/universal": "Descargar para macOS Universal",
    "linux/x64": "Descargar para Linux x64",
    "linux/arm64": "Descargar para Linux ARM64",
  };

  it.each(["Próximamente", "Coming soon"])(
    "renders the localized unavailable state %s",
    (comingSoon) => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release: null,
        target: { platform: "darwin", architecture: "arm64" },
        messages: { comingSoon, defaultLabels },
      }),
    );

    expect(html).toContain("disabled");
    expect(html).toContain(comingSoon);
    },
  );

  it("renders a direct R2 download without exposing release metadata", () => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release,
        title: "Descargar SensaVision",
        messages: {
          comingSoon: "Próximamente",
          defaultLabels,
        },
      }),
    );

    expect(html).toContain('href="https://downloads.example.com/SensaVision.exe"');
    expect(html).toContain("Descargar SensaVision");
    expect(html).not.toContain("1.2.3");
    expect(html).not.toContain("100");
  });

  it("uses a localized default label for the selected target", () => {
    const macRelease: Sanity.DesktopRelease = {
      ...release,
      platform: "darwin",
      architecture: "arm64",
      installer: {
        ...release.installer,
        url: "https://downloads.example.com/SensaVision.dmg",
        fileName: "SensaVision-macOS-1.2.3-arm64.dmg",
      },
    };
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release: macRelease,
        target: { platform: "darwin", architecture: "arm64" },
        messages: { comingSoon: "Próximamente", defaultLabels },
      }),
    );

    expect(html).toContain("Descargar para macOS Apple Silicon");
  });

  it("uses the English target label when the page dictionary is English", () => {
    const linuxRelease: Sanity.DesktopRelease = {
      ...release,
      platform: "linux",
      architecture: "arm64",
    };
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release: linuxRelease,
        target: { platform: "linux", architecture: "arm64" },
        messages: getDictionary("en").downloads,
      }),
    );

    expect(html).toContain("Download for Linux ARM64");
  });

  it.each(["es", "en"] as const)(
    "uses a visible %s label when a custom title contains only whitespace",
    (locale) => {
      const messages = getDictionary(locale).downloads;
      const html = renderToStaticMarkup(
        createElement(DesktopDownloadButton, {
          release,
          title: " \n\t ",
          messages,
        }),
      );

      expect(html).toContain(messages.defaultLabels["win32/x64"]);
      expect(html).toContain('href="https://downloads.example.com/SensaVision.exe"');
      expect(html).not.toContain('disabled=""');
    },
  );
});
