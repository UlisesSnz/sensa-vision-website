import "server-only";

import { createClient } from "@sanity/client";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  assertAdministratorRole,
  buildDesktopReleasePublicUrl,
  DESKTOP_UPLOAD_URL_TTL_SECONDS,
} from "@/lib/desktop-release";
import { apiVersion, dataset, projectId } from "@/sanity/env";

type R2Configuration = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

let r2Client: S3Client | undefined;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable privada ${name}.`);
  }

  return value;
}

export function getR2Configuration(): R2Configuration {
  return {
    accountId: requiredEnvironmentVariable("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnvironmentVariable("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnvironmentVariable("R2_SECRET_ACCESS_KEY"),
    bucketName: requiredEnvironmentVariable("R2_BUCKET_NAME"),
    publicBaseUrl: requiredEnvironmentVariable("R2_PUBLIC_BASE_URL"),
  };
}

export function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const config = getR2Configuration();

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

export async function requireSanityAdministrator(token: string): Promise<void> {
  if (!token || token.length < 16) {
    throw new Error("La sesión de Sanity no es válida.");
  }

  try {
    const user = await createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    }).users.getById("me");

    assertAdministratorRole(user.role);
  } catch {
    throw new Error("La sesión no permite administrar instaladores.");
  }
}

export async function signUploadPart({
  objectKey,
  uploadId,
  partNumber,
}: {
  objectKey: string;
  uploadId: string;
  partNumber: number;
}): Promise<string> {
  const config = getR2Configuration();

  return getSignedUrl(
    getR2Client(),
    new UploadPartCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: DESKTOP_UPLOAD_URL_TTL_SECONDS },
  );
}

export {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListPartsCommand,
};

export function publicDesktopReleaseUrl(objectKey: string): string {
  return buildDesktopReleasePublicUrl(
    getR2Configuration().publicBaseUrl,
    objectKey,
  );
}
