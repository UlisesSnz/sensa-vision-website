import { defineField, defineType } from "sanity";

import {
  DEFAULT_DESKTOP_RELEASE_TARGET,
  DESKTOP_RELEASE_ARCHITECTURES,
  DESKTOP_RELEASE_PLATFORMS,
  getDesktopReleaseArchitectureTitle,
  getDesktopReleasePlatformTitle,
  isDesktopReleaseArchitecture,
  isDesktopReleasePlatform,
  isValidDesktopReleaseTarget,
} from "@/lib/desktop-release";

export default defineType({
  name: "link",
  type: "object",
  title: "Link",
  fields: [
    defineField({
      name: "targetType",
      title: "Destination",
      type: "string",
      initialValue: "url",
      options: {
        layout: "radio",
        list: [
          { title: "URL", value: "url" },
          { title: "SensaVision Desktop", value: "desktopDownload" },
        ],
      },
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "downloadPlatform",
      title: "Download operating system",
      type: "string",
      initialValue: DEFAULT_DESKTOP_RELEASE_TARGET.platform,
      hidden: ({ parent }) => parent?.targetType !== "desktopDownload",
      options: {
        list: DESKTOP_RELEASE_PLATFORMS.map((platform) => ({
          title: getDesktopReleasePlatformTitle(platform),
          value: platform,
        })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { targetType?: string } | undefined;

          return parent?.targetType !== "desktopDownload" ||
            value === undefined ||
            isDesktopReleasePlatform(value)
            ? true
            : "Selecciona un sistema operativo válido.";
        }),
    }),
    defineField({
      name: "downloadArchitecture",
      title: "Download architecture",
      type: "string",
      initialValue: DEFAULT_DESKTOP_RELEASE_TARGET.architecture,
      hidden: ({ parent }) => parent?.targetType !== "desktopDownload",
      options: {
        list: DESKTOP_RELEASE_ARCHITECTURES.map((architecture) => ({
          title: getDesktopReleaseArchitectureTitle(architecture),
          value: architecture,
        })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as
            | { targetType?: string; downloadPlatform?: unknown }
            | undefined;
          if (parent?.targetType !== "desktopDownload" || value === undefined) {
            return true;
          }

          const platform = isDesktopReleasePlatform(parent.downloadPlatform)
            ? parent.downloadPlatform
            : DEFAULT_DESKTOP_RELEASE_TARGET.platform;

          return isDesktopReleaseArchitecture(value) &&
            isValidDesktopReleaseTarget({ platform, architecture: value })
            ? true
            : "La arquitectura no es válida para el sistema operativo seleccionado.";
        }),
    }),
    defineField({
      name: "href",
      title: "href",
      type: "url",
      hidden: ({ parent }) => parent?.targetType === "desktopDownload",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }).custom((value, context) => {
          const parent = context.parent as { targetType?: string } | undefined;

          return parent?.targetType === "desktopDownload" || value
            ? true
            : "La URL es obligatoria.";
        }),
    }),
    defineField({
      name: "target",
      type: "boolean",
      title: "Open in new tab",
      hidden: ({ parent }) => parent?.targetType === "desktopDownload",
    }),
    defineField({
      name: "buttonVariant",
      type: "button-variant",
      title: "Button Variant",
    }),
  ],
});
