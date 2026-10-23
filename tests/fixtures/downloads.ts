import type { ComponentProps } from "react";
import type SectionHeader from "@/components/ui/section-header";
import type { DesktopReleaseTarget } from "@/lib/desktop-release";

export const installationHeader = {
  uid: "requisitos",
  title: "Encuentra la opción para tu instalación",
  description: "Elige el reproductor adecuado para tus pantallas.\n\nConsulta las opciones disponibles para tu instalación.",
  stackAlign: "left",
  sectionWidth: "default",
  padding: { top: true, bottom: true },
  links: [{
    _key: "downloads",
    title: "Ver descargas",
    targetType: "url",
    href: "/downloads",
    buttonVariant: "default",
  }],
} satisfies ComponentProps<typeof SectionHeader>;

// Synthetic URLs are rendered for assertions only; no installer is requested.
export function releaseFixture(target: DesktopReleaseTarget): Sanity.DesktopRelease {
  return {
    ...target,
    version: "1.2.3",
    releasedAt: "2026-10-01T00:00:00Z",
    channel: "stable",
    installer: {
      objectKey: `fixture/${target.platform}/${target.architecture}`,
      url: `https://downloads.example.test/${target.platform}/${target.architecture}/installer`,
      fileName: "fixture-installer",
      sizeBytes: 100,
      mimeType: "application/octet-stream",
      etag: "fixture",
    },
  };
}

export const androidBody = [{
  _type: "block",
  _key: "android-description",
  style: "normal",
  markDefs: [],
  children: [{
    _type: "span",
    _key: "text",
    text: "Una opción para equipos Android compatibles. La descarga todavía no está disponible.",
    marks: [],
  }],
}];
