import {
  DESKTOP_UPLOAD_CONCURRENCY,
  type DesktopUploadedPart,
} from "@/lib/desktop-release";

export type DesktopMultipartSession = {
  partSizeBytes: number;
  partCount: number;
};

type UploadBlob = Pick<Blob, "size" | "slice">;

export async function uploadDesktopMultipartParts({
  file,
  session,
  uploadedParts,
  abortControllers,
  signPart,
  putPart,
  onProgress,
  maxAttempts = 3,
}: {
  file: UploadBlob;
  session: DesktopMultipartSession;
  uploadedParts: DesktopUploadedPart[];
  abortControllers: Set<AbortController>;
  signPart: (partNumber: number) => Promise<string>;
  putPart: (
    url: string,
    body: Blob,
    signal: AbortSignal,
  ) => Promise<string>;
  onProgress?: (percentage: number) => void;
  maxAttempts?: number;
}): Promise<DesktopUploadedPart[]> {
  const partsByNumber = new Map<number, DesktopUploadedPart>(
    uploadedParts.map((part) => [part.partNumber, part]),
  );
  const partSize = (partNumber: number) =>
    Math.min(
      session.partSizeBytes,
      file.size - (partNumber - 1) * session.partSizeBytes,
    );
  let uploadedBytes = [...partsByNumber.keys()].reduce(
    (total, partNumber) => total + partSize(partNumber),
    0,
  );

  onProgress?.(Math.round((uploadedBytes / file.size) * 100));

  const missingPartNumbers = Array.from(
    { length: session.partCount },
    (_, index) => index + 1,
  ).filter((partNumber) => !partsByNumber.has(partNumber));
  let nextPartIndex = 0;

  const uploadNextPart = async () => {
    while (nextPartIndex < missingPartNumbers.length) {
      const partNumber = missingPartNumbers[nextPartIndex++];
      const start = (partNumber - 1) * session.partSizeBytes;
      const end = Math.min(start + session.partSizeBytes, file.size);
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        abortControllers.add(controller);

        try {
          const url = await signPart(partNumber);
          const etag = await putPart(
            url,
            file.slice(start, end),
            controller.signal,
          );

          if (!etag) throw new Error("R2 no expuso el ETag de la parte.");

          partsByNumber.set(partNumber, { partNumber, etag });
          uploadedBytes += end - start;
          onProgress?.(Math.round((uploadedBytes / file.size) * 100));
          lastError = null;
          break;
        } catch (partError) {
          lastError = partError;

          if (controller.signal.aborted) throw partError;
        } finally {
          abortControllers.delete(controller);
        }
      }

      if (lastError) throw lastError;
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(DESKTOP_UPLOAD_CONCURRENCY, missingPartNumbers.length),
      },
      uploadNextPart,
    ),
  );

  return [...partsByNumber.values()].sort(
    (left, right) => left.partNumber - right.partNumber,
  );
}
