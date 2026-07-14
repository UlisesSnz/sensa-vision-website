export const DESKTOP_RELEASE_CHANNEL = "stable" as const;
export const DESKTOP_RELEASE_PLATFORM = "win32" as const;
export const DESKTOP_RELEASE_ARCHITECTURE = "x64" as const;
export const DESKTOP_UPLOAD_PART_SIZE_BYTES = 16 * 1024 * 1024;
export const DESKTOP_UPLOAD_CONCURRENCY = 3;
export const DESKTOP_UPLOAD_URL_TTL_SECONDS = 60 * 60;
export const DESKTOP_INSTALLER_MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export const DESKTOP_INSTALLER_EXTENSIONS = ["exe", "msi", "msix"] as const;

export type DesktopInstallerExtension =
  (typeof DESKTOP_INSTALLER_EXTENSIONS)[number];

export type DesktopInstaller = {
  objectKey: string;
  url: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  etag: string;
};

export type DesktopRelease = {
  version: string;
  releasedAt: string;
  channel: typeof DESKTOP_RELEASE_CHANNEL;
  platform: typeof DESKTOP_RELEASE_PLATFORM;
  architecture: typeof DESKTOP_RELEASE_ARCHITECTURE;
  installer: DesktopInstaller;
};

export type DesktopUploadFileInput = {
  version: string;
  fileName: string;
  sizeBytes: number;
};

export type DesktopUploadedPart = {
  partNumber: number;
  etag: string;
  sizeBytes?: number;
};

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const MIME_TYPES: Record<DesktopInstallerExtension, string> = {
  exe: "application/vnd.microsoft.portable-executable",
  msi: "application/x-msi",
  msix: "application/msix",
};

export function isValidDesktopReleaseVersion(version: string): boolean {
  return SEMVER_PATTERN.test(version.trim());
}

export function getDesktopInstallerExtension(
  fileName: string,
): DesktopInstallerExtension | null {
  const extension = fileName.trim().toLowerCase().match(/\.([^.]+)$/)?.[1];

  return DESKTOP_INSTALLER_EXTENSIONS.includes(
    extension as DesktopInstallerExtension,
  )
    ? (extension as DesktopInstallerExtension)
    : null;
}

export function getDesktopInstallerMimeType(
  extension: DesktopInstallerExtension,
): string {
  return MIME_TYPES[extension];
}

export function getDesktopInstallerFileName(
  version: string,
  extension: DesktopInstallerExtension,
): string {
  return `SensaVision-Setup-${version}-x64.${extension}`;
}

export function validateDesktopUploadFile(
  input: DesktopUploadFileInput,
): DesktopUploadFileInput & {
  extension: DesktopInstallerExtension;
  mimeType: string;
  canonicalFileName: string;
} {
  const version = input.version.trim();
  const extension = getDesktopInstallerExtension(input.fileName);

  if (!isValidDesktopReleaseVersion(version)) {
    throw new Error("La versión debe usar SemVer, por ejemplo 1.2.3.");
  }

  if (!extension) {
    throw new Error("El instalador debe ser un archivo .exe, .msi o .msix.");
  }

  if (
    !Number.isSafeInteger(input.sizeBytes) ||
    input.sizeBytes <= 0 ||
    input.sizeBytes > DESKTOP_INSTALLER_MAX_SIZE_BYTES
  ) {
    throw new Error("El instalador debe pesar más de 0 bytes y hasta 5 GiB.");
  }

  return {
    ...input,
    version,
    extension,
    mimeType: getDesktopInstallerMimeType(extension),
    canonicalFileName: getDesktopInstallerFileName(version, extension),
  };
}

export function buildDesktopReleaseObjectKey({
  version,
  uploadId,
  extension,
}: {
  version: string;
  uploadId: string;
  extension: DesktopInstallerExtension;
}): string {
  if (!isValidDesktopReleaseVersion(version)) {
    throw new Error("La versión del objeto no es válida.");
  }

  if (!/^[0-9A-Za-z_-]+$/.test(uploadId)) {
    throw new Error("El identificador de carga no es válido.");
  }

  const fileName = getDesktopInstallerFileName(version, extension);

  return `desktop/stable/win32/x64/v${version}/${uploadId}/${fileName}`;
}

export function assertDesktopReleaseObjectKey(objectKey: string): void {
  const match = objectKey.match(
    /^desktop\/stable\/win32\/x64\/v([^/]+)\/([0-9A-Za-z_-]+)\/SensaVision-Setup-([^/]+)-x64\.(exe|msi|msix)$/,
  );

  if (!match || match[1] !== match[3] || !isValidDesktopReleaseVersion(match[1])) {
    throw new Error("La clave del instalador no es válida.");
  }
}

export function buildDesktopReleasePublicUrl(
  publicBaseUrl: string,
  objectKey: string,
): string {
  assertDesktopReleaseObjectKey(objectKey);

  const baseUrl = new URL(publicBaseUrl);
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");

  return `${baseUrl.toString().replace(/\/$/, "")}/${encodedKey}`;
}

export function normalizeEtag(etag: string | undefined): string {
  return (etag || "").replace(/^"|"$/g, "");
}

export function assertAdministratorRole(role: string | undefined): void {
  if (role !== "administrator") {
    throw new Error("No tienes permisos para administrar instaladores.");
  }
}

export function normalizeUploadedParts(
  parts: DesktopUploadedPart[],
): DesktopUploadedPart[] {
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const seen = new Set<number>();

  for (const part of sortedParts) {
    if (
      !Number.isInteger(part.partNumber) ||
      part.partNumber < 1 ||
      part.partNumber > Math.ceil(
        DESKTOP_INSTALLER_MAX_SIZE_BYTES / DESKTOP_UPLOAD_PART_SIZE_BYTES,
      ) ||
      !part.etag ||
      seen.has(part.partNumber)
    ) {
      throw new Error("La lista de partes subidas no es válida.");
    }

    seen.add(part.partNumber);
  }

  if (sortedParts.length === 0) {
    throw new Error("No hay partes para completar la carga.");
  }

  return sortedParts;
}

export function assertCompletedObjectSize(
  expectedSizeBytes: number,
  actualSizeBytes: number | undefined,
): void {
  if (actualSizeBytes !== expectedSizeBytes) {
    throw new Error("R2 devolvió un tamaño final distinto al archivo seleccionado.");
  }
}
