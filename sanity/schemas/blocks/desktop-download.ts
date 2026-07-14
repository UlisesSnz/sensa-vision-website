import { Download } from "lucide-react";
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

import { SECTION_WIDTH, STACK_ALIGN } from "./shared/layout-variants";

export default defineType({
  name: "desktop-download",
  title: "Desktop download",
  type: "object",
  icon: Download,
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({
      name: "colorVariant",
      title: "Color Variant",
      type: "color-variant",
    }),
    defineField({
      name: "sectionWidth",
      title: "Section Width",
      type: "string",
      options: {
        list: SECTION_WIDTH.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "stackAlign",
      title: "Stack Layout Alignment",
      type: "string",
      options: {
        list: STACK_ALIGN.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({ name: "tagLine", type: "string" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "body", type: "block-content" }),
    defineField({
      name: "downloadPlatform",
      title: "Download operating system",
      type: "string",
      initialValue: "win32",
      options: {
        list: DESKTOP_RELEASE_PLATFORMS.map((platform) => ({
          title: getDesktopReleasePlatformTitle(platform),
          value: platform,
        })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom((value) =>
          value === undefined || isDesktopReleasePlatform(value)
            ? true
            : "Selecciona un sistema operativo válido.",
        ),
    }),
    defineField({
      name: "downloadArchitecture",
      title: "Download architecture",
      type: "string",
      initialValue: "x64",
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
            | { downloadPlatform?: unknown }
            | undefined;
          if (value === undefined) return true;

          const platform = isDesktopReleasePlatform(parent?.downloadPlatform)
            ? parent.downloadPlatform
            : DEFAULT_DESKTOP_RELEASE_TARGET.platform;

          return isDesktopReleasePlatform(platform) &&
            isDesktopReleaseArchitecture(value) &&
            isValidDesktopReleaseTarget({ platform, architecture: value })
            ? true
            : "La arquitectura no es válida para el sistema operativo seleccionado.";
        }),
    }),
    defineField({
      name: "buttonTitle",
      title: "Button text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buttonVariant",
      title: "Button Variant",
      type: "button-variant",
    }),
  ],
  preview: {
    select: {
      title: "title",
      platform: "downloadPlatform",
      architecture: "downloadArchitecture",
    },
    prepare({ title, platform, architecture }) {
      const target =
        isDesktopReleasePlatform(platform) &&
        isDesktopReleaseArchitecture(architecture) &&
        isValidDesktopReleaseTarget({ platform, architecture })
          ? `${getDesktopReleasePlatformTitle(platform)} ${getDesktopReleaseArchitectureTitle(architecture)}`
          : "Windows x64";

      return {
        title: "Desktop download",
        subtitle: `${title || "Sin título"} · ${target}`,
      };
    },
  },
});
