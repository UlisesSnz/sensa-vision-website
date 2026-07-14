import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DesktopDownloadButton from "@/components/ui/desktop-download-button";

const release: Sanity.DesktopRelease = {
  version: "1.2.3",
  releasedAt: "2026-07-12T00:00:00.000Z",
  channel: "stable",
  platform: "win32",
  architecture: "x64",
  installer: {
    objectKey: "desktop/stable/win32/x64/v1.2.3/id/setup.exe",
    url: "https://downloads.example.com/SensaVision.exe",
    fileName: "SensaVision-Setup-1.2.3-x64.exe",
    sizeBytes: 100,
    mimeType: "application/vnd.microsoft.portable-executable",
    etag: "etag",
  },
};

describe("DesktopDownloadButton", () => {
  it.each([
    ["Próximamente", "Descargar para Windows"],
    ["Coming soon", "Download for Windows"],
  ])("renders the localized unavailable state %s", (comingSoon, defaultLabel) => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release: null,
        title: defaultLabel,
        messages: { comingSoon, defaultLabel },
      }),
    );

    expect(html).toContain("disabled");
    expect(html).toContain(comingSoon);
  });

  it("renders a direct R2 download without exposing release metadata", () => {
    const html = renderToStaticMarkup(
      createElement(DesktopDownloadButton, {
        release,
        title: "Descargar SensaVision",
        messages: {
          comingSoon: "Próximamente",
          defaultLabel: "Descargar para Windows",
        },
      }),
    );

    expect(html).toContain('href="https://downloads.example.com/SensaVision.exe"');
    expect(html).toContain("Descargar SensaVision");
    expect(html).not.toContain("1.2.3");
    expect(html).not.toContain("100");
  });
});
