import { describe, expect, it, vi } from "vitest";

import { uploadDesktopMultipartParts } from "@/lib/desktop-upload-client";

describe("desktop multipart browser upload", () => {
  it("resumes without uploading parts already present in R2", async () => {
    const signPart = vi.fn(async (partNumber: number) => `signed:${partNumber}`);
    const putPart = vi.fn(async (url: string) => `etag:${url}`);
    const progress: number[] = [];

    const parts = await uploadDesktopMultipartParts({
      file: new Blob([new Uint8Array(40)]),
      session: { partSizeBytes: 16, partCount: 3 },
      uploadedParts: [{ partNumber: 1, etag: "existing" }],
      abortControllers: new Set(),
      signPart,
      putPart,
      onProgress: (value) => progress.push(value),
    });

    expect(signPart.mock.calls.map(([partNumber]) => partNumber).sort()).toEqual([
      2, 3,
    ]);
    expect(parts.map((part) => part.partNumber)).toEqual([1, 2, 3]);
    expect(progress[0]).toBe(40);
    expect(progress.at(-1)).toBe(100);
  });

  it("gets a fresh signed URL when a part attempt fails or expires", async () => {
    const signPart = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("expired")
      .mockResolvedValueOnce("fresh");
    const putPart = vi
      .fn<(url: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("R2 respondió 403"))
      .mockResolvedValueOnce("etag-fresh");

    const parts = await uploadDesktopMultipartParts({
      file: new Blob([new Uint8Array(8)]),
      session: { partSizeBytes: 16, partCount: 1 },
      uploadedParts: [],
      abortControllers: new Set(),
      signPart,
      putPart,
    });

    expect(signPart).toHaveBeenCalledTimes(2);
    expect(putPart).toHaveBeenNthCalledWith(
      2,
      "fresh",
      expect.any(Blob),
      expect.any(AbortSignal),
    );
    expect(parts[0].etag).toBe("etag-fresh");
  });

  it("stops after three failed attempts", async () => {
    const signPart = vi.fn(async () => "signed");
    const putPart = vi.fn(async () => {
      throw new Error("network error");
    });

    await expect(
      uploadDesktopMultipartParts({
        file: new Blob([new Uint8Array(8)]),
        session: { partSizeBytes: 16, partCount: 1 },
        uploadedParts: [],
        abortControllers: new Set(),
        signPart,
        putPart,
      }),
    ).rejects.toThrow("network error");
    expect(putPart).toHaveBeenCalledTimes(3);
  });

  it("cancels active browser uploads", async () => {
    const controllers = new Set<AbortController>();
    const upload = uploadDesktopMultipartParts({
      file: new Blob([new Uint8Array(8)]),
      session: { partSizeBytes: 16, partCount: 1 },
      uploadedParts: [],
      abortControllers: controllers,
      signPart: async () => "signed",
      putPart: (_url, _body, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("cancelled")));
        }),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    controllers.forEach((controller) => controller.abort());

    await expect(upload).rejects.toThrow("cancelled");
    expect(controllers.size).toBe(0);
  });
});
