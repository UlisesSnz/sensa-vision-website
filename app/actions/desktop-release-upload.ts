"use server";

import { randomUUID } from "node:crypto";

import {
  assertCompletedObjectSize,
  assertDesktopReleaseObjectKey,
  buildDesktopReleaseObjectKey,
  DESKTOP_RELEASE_ARCHITECTURE,
  DESKTOP_RELEASE_CHANNEL,
  DESKTOP_RELEASE_PLATFORM,
  DESKTOP_UPLOAD_PART_SIZE_BYTES,
  DESKTOP_UPLOAD_URL_TTL_SECONDS,
  normalizeEtag,
  normalizeUploadedParts,
  validateDesktopUploadFile,
  type DesktopInstaller,
  type DesktopUploadedPart,
  type DesktopUploadFileInput,
} from "@/lib/desktop-release";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  getR2Client,
  getR2Configuration,
  HeadObjectCommand,
  ListPartsCommand,
  publicDesktopReleaseUrl,
  requireSanityAdministrator,
  signUploadPart,
} from "@/lib/r2/desktop-releases";

type UploadSessionInput = {
  token: string;
  objectKey: string;
  uploadId: string;
};

type CompleteUploadInput = UploadSessionInput &
  DesktopUploadFileInput & {
    parts: DesktopUploadedPart[];
  };

function validateUploadSession(input: UploadSessionInput): void {
  assertDesktopReleaseObjectKey(input.objectKey);

  if (!input.uploadId || input.uploadId.length > 2048) {
    throw new Error("La sesión multipart no es válida.");
  }
}

export async function startDesktopReleaseUpload(
  token: string,
  input: DesktopUploadFileInput,
): Promise<{
  uploadId: string;
  objectKey: string;
  partSizeBytes: number;
  partCount: number;
  expiresInSeconds: number;
}> {
  await requireSanityAdministrator(token);

  const file = validateDesktopUploadFile(input);
  const objectKey = buildDesktopReleaseObjectKey({
    version: file.version,
    uploadId: randomUUID(),
    extension: file.extension,
  });
  const { bucketName } = getR2Configuration();
  const response = await getR2Client().send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: `attachment; filename="${file.canonicalFileName}"`,
      ContentType: file.mimeType,
      StorageClass: "STANDARD",
      Metadata: {
        version: file.version,
        channel: DESKTOP_RELEASE_CHANNEL,
        platform: DESKTOP_RELEASE_PLATFORM,
        architecture: DESKTOP_RELEASE_ARCHITECTURE,
      },
    }),
  );

  if (!response.UploadId) {
    throw new Error("R2 no devolvió una sesión multipart.");
  }

  return {
    uploadId: response.UploadId,
    objectKey,
    partSizeBytes: DESKTOP_UPLOAD_PART_SIZE_BYTES,
    partCount: Math.ceil(file.sizeBytes / DESKTOP_UPLOAD_PART_SIZE_BYTES),
    expiresInSeconds: DESKTOP_UPLOAD_URL_TTL_SECONDS,
  };
}

export async function signDesktopReleaseUploadParts(
  input: UploadSessionInput & { partNumbers: number[] },
): Promise<Array<{ partNumber: number; url: string }>> {
  await requireSanityAdministrator(input.token);
  validateUploadSession(input);

  const maxPartNumber = Math.ceil(
    (5 * 1024 * 1024 * 1024) / DESKTOP_UPLOAD_PART_SIZE_BYTES,
  );
  const partNumbers = [...new Set(input.partNumbers)];

  if (
    partNumbers.length === 0 ||
    partNumbers.length > maxPartNumber ||
    partNumbers.some(
      (partNumber) =>
        !Number.isInteger(partNumber) ||
        partNumber < 1 ||
        partNumber > maxPartNumber,
    )
  ) {
    throw new Error("Las partes solicitadas no son válidas.");
  }

  return Promise.all(
    partNumbers.map(async (partNumber) => ({
      partNumber,
      url: await signUploadPart({
        objectKey: input.objectKey,
        uploadId: input.uploadId,
        partNumber,
      }),
    })),
  );
}

export async function listDesktopReleaseUploadParts(
  input: UploadSessionInput,
): Promise<DesktopUploadedPart[]> {
  await requireSanityAdministrator(input.token);
  validateUploadSession(input);

  const { bucketName } = getR2Configuration();
  const response = await getR2Client().send(
    new ListPartsCommand({
      Bucket: bucketName,
      Key: input.objectKey,
      UploadId: input.uploadId,
      MaxParts: 1000,
    }),
  );

  return (response.Parts || []).flatMap((part) =>
    part.PartNumber && part.ETag
      ? [
          {
            partNumber: part.PartNumber,
            etag: part.ETag,
            sizeBytes: part.Size,
          },
        ]
      : [],
  );
}

export async function completeDesktopReleaseUpload(
  input: CompleteUploadInput,
): Promise<DesktopInstaller> {
  await requireSanityAdministrator(input.token);
  validateUploadSession(input);

  const file = validateDesktopUploadFile(input);
  const parts = normalizeUploadedParts(input.parts);
  const expectedPartCount = Math.ceil(
    file.sizeBytes / DESKTOP_UPLOAD_PART_SIZE_BYTES,
  );

  if (
    parts.length !== expectedPartCount ||
    parts.some((part, index) => part.partNumber !== index + 1)
  ) {
    throw new Error("Faltan partes del instalador antes de completar la carga.");
  }

  if (
    !input.objectKey.includes(`/v${file.version}/`) ||
    !input.objectKey.endsWith(`/${file.canonicalFileName}`)
  ) {
    throw new Error("El archivo no coincide con la sesión multipart.");
  }

  const { bucketName } = getR2Configuration();
  const client = getR2Client();

  try {
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: input.objectKey,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: parts.map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        },
      }),
    );
  } catch {
    // A retry may arrive after R2 completed the upload but before the browser
    // received the response. HeadObject below decides whether it is complete.
  }

  const object = await client.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: input.objectKey,
    }),
  );

  assertCompletedObjectSize(file.sizeBytes, object.ContentLength);

  const etag = normalizeEtag(object.ETag);

  if (!etag) {
    throw new Error("R2 no devolvió el ETag final del instalador.");
  }

  return {
    objectKey: input.objectKey,
    url: publicDesktopReleaseUrl(input.objectKey),
    fileName: file.canonicalFileName,
    sizeBytes: file.sizeBytes,
    mimeType: object.ContentType || file.mimeType,
    etag,
  };
}

export async function abortDesktopReleaseUpload(
  input: UploadSessionInput,
): Promise<{ aborted: true }> {
  await requireSanityAdministrator(input.token);
  validateUploadSession(input);

  const { bucketName } = getR2Configuration();
  await getR2Client().send(
    new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: input.objectKey,
      UploadId: input.uploadId,
    }),
  );

  return { aborted: true };
}
