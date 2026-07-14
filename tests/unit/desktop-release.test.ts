import { describe, expect, it } from "vitest";

import {
  assertAdministratorRole,
  assertCompletedObjectSize,
  assertDesktopReleaseObjectKey,
  buildDesktopReleaseObjectKey,
  buildDesktopReleasePublicUrl,
  DESKTOP_INSTALLER_MAX_SIZE_BYTES,
  getDesktopInstallerAccept,
  getDesktopInstallerExtension,
  getDesktopReleaseTargetKey,
  isValidDesktopReleaseTarget,
  isValidDesktopReleaseVersion,
  normalizeUploadedParts,
  parseDesktopReleaseObjectKey,
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

  it.each([
    ["win32", "x64"],
    ["win32", "arm64"],
    ["darwin", "x64"],
    ["darwin", "arm64"],
    ["darwin", "universal"],
    ["linux", "x64"],
    ["linux", "arm64"],
  ] as const)("accepts target %s/%s", (platform, architecture) => {
    expect(isValidDesktopReleaseTarget({ platform, architecture })).toBe(true);
    expect(getDesktopReleaseTargetKey({ platform, architecture })).toBe(
      `${platform}/${architecture}`,
    );
  });

  it("rejects unsupported platform and architecture combinations", () => {
    expect(
      isValidDesktopReleaseTarget({ platform: "win32", architecture: "universal" }),
    ).toBe(false);
    expect(
      isValidDesktopReleaseTarget({ platform: "linux", architecture: "universal" }),
    ).toBe(false);
  });

  it("recognizes simple, mixed-case, and compound installer extensions", () => {
    expect(getDesktopInstallerExtension("release.EXE")).toBe("exe");
    expect(getDesktopInstallerExtension("release.dmg")).toBe("dmg");
    expect(getDesktopInstallerExtension("release.AppImage")).toBe("appimage");
    expect(getDesktopInstallerExtension("release.TAR.GZ")).toBe("tar.gz");
    expect(getDesktopInstallerExtension("release.txt")).toBeNull();
  });

  it("publishes a platform-specific file picker allowlist", () => {
    expect(getDesktopInstallerAccept("win32")).toBe(".exe,.msi,.msix");
    expect(getDesktopInstallerAccept("darwin")).toBe(".dmg,.pkg,.zip");
    expect(getDesktopInstallerAccept("linux")).toBe(
      ".AppImage,.deb,.rpm,.tar.gz",
    );
  });

  it("rejects an installer format from another platform", () => {
    expect(() =>
      validateDesktopUploadFile({
        version: "1.2.3",
        platform: "darwin",
        architecture: "arm64",
        fileName: "release.exe",
        sizeBytes: 10,
      }),
    ).toThrow(/macOS/);
  });

  it("enforces the 5 GiB size limit", () => {
    expect(() =>
      validateDesktopUploadFile({
        version: "1.2.3",
        platform: "linux",
        architecture: "x64",
        fileName: "release.AppImage",
        sizeBytes: DESKTOP_INSTALLER_MAX_SIZE_BYTES,
      }),
    ).not.toThrow();

    expect(() =>
      validateDesktopUploadFile({
        version: "1.2.3",
        platform: "linux",
        architecture: "x64",
        fileName: "release.AppImage",
        sizeBytes: DESKTOP_INSTALLER_MAX_SIZE_BYTES + 1,
      }),
    ).toThrow(/5 GiB/);
  });

  it.each([
    {
      platform: "win32",
      architecture: "arm64",
      extension: "msix",
      fileName: "SensaVision-Windows-1.2.3-arm64.msix",
    },
    {
      platform: "darwin",
      architecture: "universal",
      extension: "dmg",
      fileName: "SensaVision-macOS-1.2.3-universal.dmg",
    },
    {
      platform: "linux",
      architecture: "x64",
      extension: "appimage",
      fileName: "SensaVision-Linux-1.2.3-x64.AppImage",
    },
  ] as const)(
    "builds and parses an immutable $platform/$architecture release key",
    ({ platform, architecture, extension, fileName }) => {
      const key = buildDesktopReleaseObjectKey({
        version: "1.2.3",
        uploadId: "session-123",
        extension,
        platform,
        architecture,
      });

      expect(key).toBe(
        `desktop/stable/${platform}/${architecture}/v1.2.3/session-123/${fileName}`,
      );
      expect(parseDesktopReleaseObjectKey(key)).toMatchObject({
        version: "1.2.3",
        platform,
        architecture,
        extension,
        fileName,
      });
    },
  );

  it("accepts existing Windows x64 object keys", () => {
    const legacyKey =
      "desktop/stable/win32/x64/v1.2.3/session/SensaVision-Setup-1.2.3-x64.exe";

    expect(() => assertDesktopReleaseObjectKey(legacyKey)).not.toThrow();
    expect(parseDesktopReleaseObjectKey(legacyKey)).toMatchObject({
      platform: "win32",
      architecture: "x64",
      version: "1.2.3",
    });
  });

  it("rejects a key whose target or version was tampered with", () => {
    const key = buildDesktopReleaseObjectKey({
      version: "1.2.3",
      uploadId: "session",
      extension: "dmg",
      platform: "darwin",
      architecture: "arm64",
    });

    expect(() =>
      assertDesktopReleaseObjectKey(key, {
        version: "2.0.0",
        platform: "darwin",
        architecture: "arm64",
      }),
    ).toThrow(/no coincide/);
    expect(() =>
      assertDesktopReleaseObjectKey(key.replace("/darwin/", "/linux/")),
    ).toThrow();
  });

  it("builds the public URL without changing key semantics", () => {
    const key = buildDesktopReleaseObjectKey({
      version: "1.2.3+build.7",
      uploadId: "session",
      extension: "pkg",
      platform: "darwin",
      architecture: "arm64",
    });

    expect(buildDesktopReleasePublicUrl("https://downloads.example.com/", key)).toBe(
      "https://downloads.example.com/desktop/stable/darwin/arm64/v1.2.3%2Bbuild.7/session/SensaVision-macOS-1.2.3%2Bbuild.7-arm64.pkg",
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
