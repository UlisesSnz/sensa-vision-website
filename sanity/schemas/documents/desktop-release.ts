import { Download } from "lucide-react";
import { defineField, defineType, userHasRole } from "sanity";

import {
  assertDesktopReleaseObjectKey,
  DESKTOP_RELEASE_ARCHITECTURES,
  DESKTOP_RELEASE_PLATFORMS,
  getDesktopReleaseArchitectureTitle,
  getDesktopReleasePlatformTitle,
  getDesktopReleaseTargetTitle,
  isDesktopReleaseArchitecture,
  isDesktopReleasePlatform,
  isValidDesktopReleaseTarget,
  isValidDesktopReleaseVersion,
} from "@/lib/desktop-release";

const targetIsLocked = ({ document }: { document?: Record<string, any> }) =>
  Boolean(
    (document?.installer as { objectKey?: string } | undefined)?.objectKey,
  );

export default defineType({
  name: "desktopRelease",
  title: "Desktop releases",
  type: "document",
  icon: Download,
  readOnly: ({ currentUser }) => !userHasRole(currentUser, "administrator"),
  fields: [
    defineField({
      name: "version",
      title: "Version",
      type: "string",
      description: "SemVer, por ejemplo 1.2.3.",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          value && isValidDesktopReleaseVersion(value)
            ? true
            : "Usa una versión SemVer válida, por ejemplo 1.2.3.",
        ),
    }),
    defineField({
      name: "releasedAt",
      title: "Release date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "channel",
      title: "Channel",
      type: "string",
      initialValue: "stable",
      readOnly: true,
      validation: (Rule) =>
        Rule.required().custom((value) =>
          value === "stable" ? true : "El canal debe ser stable.",
        ),
    }),
    defineField({
      name: "platform",
      title: "Operating system",
      type: "string",
      initialValue: "win32",
      readOnly: targetIsLocked,
      options: {
        list: DESKTOP_RELEASE_PLATFORMS.map((platform) => ({
          title: getDesktopReleasePlatformTitle(platform),
          value: platform,
        })),
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "architecture",
      title: "Architecture",
      type: "string",
      initialValue: "x64",
      readOnly: targetIsLocked,
      description:
        "Windows y Linux aceptan x64/ARM64; macOS también acepta Universal.",
      options: {
        list: DESKTOP_RELEASE_ARCHITECTURES.map((architecture) => ({
          title: getDesktopReleaseArchitectureTitle(architecture),
          value: architecture,
        })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const platform = context.document?.platform;

          return isDesktopReleasePlatform(platform) &&
            isDesktopReleaseArchitecture(value) &&
            isValidDesktopReleaseTarget({ platform, architecture: value })
            ? true
            : "La arquitectura no es válida para el sistema operativo seleccionado.";
        }),
    }),
    defineField({
      name: "installer",
      title: "Installer",
      type: "desktopInstaller",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const document = context.document;
          const installer = value as { objectKey?: string } | undefined;
          const version = document?.version;
          const platform = document?.platform;
          const architecture = document?.architecture;

          if (
            !installer?.objectKey ||
            typeof version !== "string" ||
            !isDesktopReleasePlatform(platform) ||
            !isDesktopReleaseArchitecture(architecture)
          ) {
            return true;
          }

          try {
            assertDesktopReleaseObjectKey(installer.objectKey, {
              version,
              platform,
              architecture,
            });
            return true;
          } catch {
            return "El instalador no coincide con la versión y el destino de la release.";
          }
        }),
    }),
  ],
  orderings: [
    {
      title: "Release date, newest",
      name: "releasedAtDesc",
      by: [{ field: "releasedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      version: "version",
      releasedAt: "releasedAt",
      platform: "platform",
      architecture: "architecture",
    },
    prepare({ version, releasedAt, platform, architecture }) {
      const target =
        isDesktopReleasePlatform(platform) &&
        isDesktopReleaseArchitecture(architecture) &&
        isValidDesktopReleaseTarget({ platform, architecture })
          ? getDesktopReleaseTargetTitle({ platform, architecture })
          : "Destino pendiente";

      return {
        title: version
          ? `SensaVision ${version} · ${target}`
          : "Nueva release",
        subtitle: releasedAt
          ? new Date(releasedAt).toLocaleDateString("es-MX")
          : "Sin fecha",
      };
    },
  },
});
