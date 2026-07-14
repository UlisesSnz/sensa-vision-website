import { Download } from "lucide-react";
import { defineField, defineType, userHasRole } from "sanity";

import { isValidDesktopReleaseVersion } from "@/lib/desktop-release";

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
      title: "Platform",
      type: "string",
      initialValue: "win32",
      readOnly: true,
      validation: (Rule) =>
        Rule.required().custom((value) =>
          value === "win32" ? true : "La plataforma debe ser win32.",
        ),
    }),
    defineField({
      name: "architecture",
      title: "Architecture",
      type: "string",
      initialValue: "x64",
      readOnly: true,
      validation: (Rule) =>
        Rule.required().custom((value) =>
          value === "x64" ? true : "La arquitectura debe ser x64.",
        ),
    }),
    defineField({
      name: "installer",
      title: "Installer",
      type: "desktopInstaller",
      validation: (Rule) => Rule.required(),
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
    },
    prepare({ version, releasedAt }) {
      return {
        title: version ? `SensaVision ${version}` : "Nueva release",
        subtitle: releasedAt
          ? new Date(releasedAt).toLocaleDateString("es-MX")
          : "Sin fecha",
      };
    },
  },
});
