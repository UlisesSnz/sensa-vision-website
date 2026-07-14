import { describe, expect, it } from "vitest";

import {
  assertAdministratorRole,
  assertCompletedObjectSize,
  assertDesktopReleaseObjectKey,
  buildDesktopReleaseObjectKey,
  buildDesktopReleasePublicUrl,
  DESKTOP_INSTALLER_MAX_SIZE_BYTES,
  getDesktopInstallerExtension,
  isValidDesktopReleaseVersion,
  normalizeUploadedParts,
  validateDesktopUploadFile,
} from "@/lib/desktop-release";

describe("desktop release policy", () => {
  it.each(["0.1.0", "1.2.3", "2.0.0-beta.1", "10.4.1+build.7"])(
    "accepts SemVer %s",
    (version) => {
      expect(isValidDesktopReleaseVersion(version)).toBe(true);
    },
  );

  it.each(["1", "1.2", "01.2.3", "v1.2.3", "1.2.3 beta"])(
    "rejects invalid version %s",
    (version) => {
      expect(isValidDesktopReleaseVersion(version)).toBe(false);
    },
  );

  it("accepts only supported installer extensions", () => {
    expect(getDesktopInstallerExtension("release.EXE")).toBe("exe");
    expect(getDesktopInstallerExtension("release.msi")).toBe("msi");
    expect(getDesktopInstallerExtension("release.msix")).toBe("msix");
    expect(getDesktopInstallerExtension("release.zip")).toBeNull();
  });

  it("enforces the 5 GiB size limit", () => {
    expect(() =>
      validateDesktopUploadFile({
        version: "1.2.3",
        fileName: "release.exe",
        sizeBytes: DESKTOP_INSTALLER_MAX_SIZE_BYTES,
      }),
    ).not.toThrow();

    expect(() =>
      validateDesktopUploadFile({
        version: "1.2.3",
        fileName: "release.exe",
        sizeBytes: DESKTOP_INSTALLER_MAX_SIZE_BYTES + 1,
      }),
    ).toThrow(/5 GiB/);
  });

  it("builds and validates immutable release keys", () => {
    const key = buildDesktopReleaseObjectKey({
      version: "1.2.3",
      uploadId: "session-123",
      extension: "exe",
    });

    expect(key).toBe(
      "desktop/stable/win32/x64/v1.2.3/session-123/SensaVision-Setup-1.2.3-x64.exe",
    );
    expect(() => assertDesktopReleaseObjectKey(key)).not.toThrow();
    expect(() =>
      assertDesktopReleaseObjectKey(
        "desktop/stable/win32/x64/v1.2.3/session/SensaVision-Setup-2.0.0-x64.exe",
      ),
    ).toThrow();
  });

  it("builds the public URL without changing key semantics", () => {
    const key = buildDesktopReleaseObjectKey({
      version: "1.2.3+build.7",
      uploadId: "session",
      extension: "msix",
    });

    expect(buildDesktopReleasePublicUrl("https://downloads.example.com/", key)).toBe(
      "https://downloads.example.com/desktop/stable/win32/x64/v1.2.3%2Bbuild.7/session/SensaVision-Setup-1.2.3%2Bbuild.7-x64.msix",
    );
  });

  it("requires the Sanity administrator role", () => {
    expect(() => assertAdministratorRole("administrator")).not.toThrow();
    expect(() => assertAdministratorRole("editor")).toThrow(/permisos/);
    expect(() => assertAdministratorRole(undefined)).toThrow(/permisos/);
  });

  it("sorts parts and rejects duplicates or empty completion", () => {
    expect(
      normalizeUploadedParts([
        { partNumber: 2, etag: "two" },
        { partNumber: 1, etag: "one" },
      ]).map((part) => part.partNumber),
    ).toEqual([1, 2]);
    expect(() =>
      normalizeUploadedParts([
        { partNumber: 1, etag: "one" },
        { partNumber: 1, etag: "again" },
      ]),
    ).toThrow();
    expect(() => normalizeUploadedParts([])).toThrow();
  });

  it("rejects missing or mismatched HeadObject sizes", () => {
    expect(() => assertCompletedObjectSize(10, 10)).not.toThrow();
    expect(() => assertCompletedObjectSize(10, 9)).toThrow(/tamaño final/);
    expect(() => assertCompletedObjectSize(10, undefined)).toThrow(
      /tamaño final/,
    );
  });
});
