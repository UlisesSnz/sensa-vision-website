import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DESKTOP_UPLOAD_PART_SIZE_BYTES,
  buildDesktopReleaseObjectKey,
} from "@/lib/desktop-release";

const r2 = vi.hoisted(() => ({
  send: vi.fn(),
  requireAdministrator: vi.fn(),
  signPart: vi.fn(),
}));

vi.mock("@/lib/r2/desktop-releases", async () => {
  const commands = await vi.importActual<
    typeof import("@aws-sdk/client-s3")
  >("@aws-sdk/client-s3");

  return {
    AbortMultipartUploadCommand: commands.AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand: commands.CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand: commands.CreateMultipartUploadCommand,
    HeadObjectCommand: commands.HeadObjectCommand,
    ListPartsCommand: commands.ListPartsCommand,
    getR2Client: () => ({ send: r2.send }),
    getR2Configuration: () => ({ bucketName: "test-releases" }),
    publicDesktopReleaseUrl: (key: string) =>
      `https://downloads.example.com/${key}`,
    requireSanityAdministrator: r2.requireAdministrator,
    signUploadPart: r2.signPart,
  };
});

import {
  abortDesktopReleaseUpload,
  completeDesktopReleaseUpload,
  listDesktopReleaseUploadParts,
  signDesktopReleaseUploadParts,
  startDesktopReleaseUpload,
} from "@/app/actions/desktop-release-upload";

const objectKey = buildDesktopReleaseObjectKey({
  version: "1.2.3",
  uploadId: "browser-session",
  extension: "exe",
  platform: "win32",
  architecture: "x64",
});

const windowsTarget = {
  platform: "win32",
  architecture: "x64",
} as const;

describe("desktop release Server Actions", () => {
  beforeEach(() => {
    r2.send.mockReset();
    r2.requireAdministrator.mockReset().mockResolvedValue(undefined);
    r2.signPart.mockReset();
  });

  it.each([
    {
      platform: "win32",
      architecture: "x64",
      fileName: "local.exe",
      canonicalFileName: "SensaVision-Windows-1.2.3-x64.exe",
      contentType: "application/vnd.microsoft.portable-executable",
    },
    {
      platform: "darwin",
      architecture: "arm64",
      fileName: "local.dmg",
      canonicalFileName: "SensaVision-macOS-1.2.3-arm64.dmg",
      contentType: "application/x-apple-diskimage",
    },
    {
      platform: "linux",
      architecture: "x64",
      fileName: "local.AppImage",
      canonicalFileName: "SensaVision-Linux-1.2.3-x64.AppImage",
      contentType: "application/octet-stream",
    },
  ] as const)(
    "starts an immutable $platform/$architecture multipart upload",
    async ({
      platform,
      architecture,
      fileName,
      canonicalFileName,
      contentType,
    }) => {
    r2.send.mockResolvedValueOnce({ UploadId: "r2-upload" });

    const result = await startDesktopReleaseUpload("administrator-token", {
      version: "1.2.3",
      platform,
      architecture,
      fileName,
      sizeBytes: DESKTOP_UPLOAD_PART_SIZE_BYTES + 1,
    });
    const command = r2.send.mock.calls[0][0];

    expect(result.partCount).toBe(2);
    expect(result.uploadId).toBe("r2-upload");
    expect(command.input).toMatchObject({
      Bucket: "test-releases",
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: `attachment; filename="${canonicalFileName}"`,
      ContentType: contentType,
      StorageClass: "STANDARD",
      Metadata: {
        version: "1.2.3",
        channel: "stable",
        platform,
        architecture,
      },
    });
    expect(command.input.Key).toContain(
      `desktop/stable/${platform}/${architecture}/v1.2.3/`,
    );
    expect(command.input.Key).toContain(`/${canonicalFileName}`);
    },
  );

  it("reissues signed URLs for requested valid parts", async () => {
    r2.signPart.mockImplementation(async ({ partNumber }) =>
      Promise.resolve(`signed:${partNumber}`),
    );

    await expect(
      signDesktopReleaseUploadParts({
        token: "administrator-token",
        ...windowsTarget,
        objectKey,
        uploadId: "r2-upload",
        partNumbers: [2, 1, 2],
      }),
    ).resolves.toEqual([
      { partNumber: 2, url: "signed:2" },
      { partNumber: 1, url: "signed:1" },
    ]);
  });

  it("lists uploaded parts for browser recovery", async () => {
    r2.send.mockResolvedValueOnce({
      Parts: [
        { PartNumber: 1, ETag: '"one"', Size: 16 },
        { PartNumber: 2, ETag: '"two"', Size: 8 },
      ],
    });

    await expect(
      listDesktopReleaseUploadParts({
        token: "administrator-token",
        ...windowsTarget,
        objectKey,
        uploadId: "r2-upload",
      }),
    ).resolves.toEqual([
      { partNumber: 1, etag: '"one"', sizeBytes: 16 },
      { partNumber: 2, etag: '"two"', sizeBytes: 8 },
    ]);
  });

  it("rejects a multipart session whose declared target was tampered with", async () => {
    await expect(
      listDesktopReleaseUploadParts({
        token: "administrator-token",
        platform: "darwin",
        architecture: "arm64",
        objectKey,
        uploadId: "r2-upload",
      }),
    ).rejects.toThrow(/no coincide/);
    expect(r2.send).not.toHaveBeenCalled();
  });

  it("rejects incomplete part lists before asking R2 to complete", async () => {
    await expect(
      completeDesktopReleaseUpload({
        token: "administrator-token",
        objectKey,
        uploadId: "r2-upload",
        version: "1.2.3",
        ...windowsTarget,
        fileName: "local.exe",
        sizeBytes: DESKTOP_UPLOAD_PART_SIZE_BYTES + 1,
        parts: [{ partNumber: 1, etag: '"one"' }],
      }),
    ).rejects.toThrow(/Faltan partes/);
    expect(r2.send).not.toHaveBeenCalled();
  });

  it("verifies HeadObject and returns public metadata on completion", async () => {
    r2.send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        ContentLength: 8,
        ContentType: "application/vnd.microsoft.portable-executable",
        ETag: '"final-etag"',
      });

    await expect(
      completeDesktopReleaseUpload({
        token: "administrator-token",
        objectKey,
        uploadId: "r2-upload",
        version: "1.2.3",
        ...windowsTarget,
        fileName: "local.exe",
        sizeBytes: 8,
        parts: [{ partNumber: 1, etag: '"one"' }],
      }),
    ).resolves.toMatchObject({
      objectKey,
      fileName: "SensaVision-Windows-1.2.3-x64.exe",
      sizeBytes: 8,
      etag: "final-etag",
      url: `https://downloads.example.com/${objectKey}`,
    });
    expect(r2.send).toHaveBeenCalledTimes(2);
  });

  it("fails when HeadObject cannot verify the completed object", async () => {
    r2.send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("HeadObject failed"));

    await expect(
      completeDesktopReleaseUpload({
        token: "administrator-token",
        objectKey,
        uploadId: "r2-upload",
        version: "1.2.3",
        ...windowsTarget,
        fileName: "local.exe",
        sizeBytes: 8,
        parts: [{ partNumber: 1, etag: '"one"' }],
      }),
    ).rejects.toThrow("HeadObject failed");
  });

  it("recovers when completion succeeded but its response was lost", async () => {
    r2.send
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce({
        ContentLength: 8,
        ContentType: "application/vnd.microsoft.portable-executable",
        ETag: '"final-etag"',
      });

    await expect(
      completeDesktopReleaseUpload({
        token: "administrator-token",
        objectKey,
        uploadId: "r2-upload",
        version: "1.2.3",
        ...windowsTarget,
        fileName: "local.exe",
        sizeBytes: 8,
        parts: [{ partNumber: 1, etag: '"one"' }],
      }),
    ).resolves.toMatchObject({ etag: "final-etag" });
  });

  it("aborts the multipart session", async () => {
    r2.send.mockResolvedValueOnce({});

    await expect(
      abortDesktopReleaseUpload({
        token: "administrator-token",
        ...windowsTarget,
        objectKey,
        uploadId: "r2-upload",
      }),
    ).resolves.toEqual({ aborted: true });
    expect(r2.send.mock.calls[0][0].input).toMatchObject({
      Bucket: "test-releases",
      Key: objectKey,
      UploadId: "r2-upload",
    });
  });

  it.each(["", "invalid-token", "editor-token"])(
    "does not sign or abort without an administrator session (%s)",
    async (token) => {
      r2.requireAdministrator.mockRejectedValueOnce(
        new Error("unauthorized"),
      );

      await expect(
        abortDesktopReleaseUpload({
          token,
          ...windowsTarget,
          objectKey,
          uploadId: "r2-upload",
        }),
      ).rejects.toThrow("unauthorized");
      expect(r2.send).not.toHaveBeenCalled();
    },
  );
});
