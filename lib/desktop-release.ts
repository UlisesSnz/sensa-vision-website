export const DESKTOP_RELEASE_CHANNEL = "stable" as const;
export const DESKTOP_UPLOAD_PART_SIZE_BYTES = 16 * 1024 * 1024;
export const DESKTOP_UPLOAD_CONCURRENCY = 3;
export const DESKTOP_UPLOAD_URL_TTL_SECONDS = 60 * 60;
export const DESKTOP_INSTALLER_MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export const DESKTOP_RELEASE_PLATFORMS = ["win32", "darwin", "linux"] as const;
export const DESKTOP_RELEASE_ARCHITECTURES = [
  "x64",
  "arm64",
  "universal",
] as const;

export type DesktopReleasePlatform =
  (typeof DESKTOP_RELEASE_PLATFORMS)[number];
export type DesktopReleaseArchitecture =
  (typeof DESKTOP_RELEASE_ARCHITECTURES)[number];

export type DesktopReleaseTarget = {
  platform: DesktopReleasePlatform;
  architecture: DesktopReleaseArchitecture;
};

export type DesktopReleaseTargetKey =
  | "win32/x64"
  | "win32/arm64"
  | "darwin/x64"
  | "darwin/arm64"
  | "darwin/universal"
  | "linux/x64"
  | "linux/arm64";

export const DEFAULT_DESKTOP_RELEASE_TARGET = {
  platform: "win32",
  architecture: "x64",
} as const satisfies DesktopReleaseTarget;

// Kept as aliases for existing consumers while the target-aware API rolls out.
export const DESKTOP_RELEASE_PLATFORM = DEFAULT_DESKTOP_RELEASE_TARGET.platform;
export const DESKTOP_RELEASE_ARCHITECTURE =
  DEFAULT_DESKTOP_RELEASE_TARGET.architecture;

export const DESKTOP_RELEASE_TARGETS = [
  { platform: "win32", architecture: "x64", title: "Windows x64" },
  { platform: "win32", architecture: "arm64", title: "Windows ARM64" },
  { platform: "darwin", architecture: "x64", title: "macOS Intel" },
  { platform: "darwin", architecture: "arm64", title: "macOS Apple Silicon" },
  { platform: "darwin", architecture: "universal", title: "macOS Universal" },
  { platform: "linux", architecture: "x64", title: "Linux x64" },
  { platform: "linux", architecture: "arm64", title: "Linux ARM64" },
] as const satisfies ReadonlyArray<DesktopReleaseTarget & { title: string }>;

export const DESKTOP_INSTALLER_EXTENSIONS = [
  "exe",
  "msi",
  "msix",
  "dmg",
  "pkg",
  "zip",
  "appimage",
  "deb",
  "rpm",
  "tar.gz",
] as const;

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

export type DesktopRelease = DesktopReleaseTarget & {
  version: string;
  releasedAt: string;
  channel: typeof DESKTOP_RELEASE_CHANNEL;
  installer: DesktopInstaller;
};

export type DesktopUploadFileInput = DesktopReleaseTarget & {
  version: string;
  fileName: string;
  sizeBytes: number;
};

export type DesktopUploadedPart = {
  partNumber: number;
  etag: string;
  sizeBytes?: number;
};

type ParsedDesktopReleaseObjectKey = DesktopReleaseTarget & {
  version: string;
  uploadId: string;
  extension: DesktopInstallerExtension;
  fileName: string;
};

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const PLATFORM_TITLES: Record<DesktopReleasePlatform, string> = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
};

const ARCHITECTURE_TITLES: Record<DesktopReleaseArchitecture, string> = {
  x64: "x64",
  arm64: "ARM64",
  universal: "Universal",
};

const PLATFORM_EXTENSIONS: Record<
  DesktopReleasePlatform,
  readonly DesktopInstallerExtension[]
> = {
  win32: ["exe", "msi", "msix"],
  darwin: ["dmg", "pkg", "zip"],
  linux: ["appimage", "deb", "rpm", "tar.gz"],
};

const DISPLAY_EXTENSIONS: Record<DesktopInstallerExtension, string> = {
  exe: "exe",
  msi: "msi",
  msix: "msix",
  dmg: "dmg",
  pkg: "pkg",
  zip: "zip",
  appimage: "AppImage",
  deb: "deb",
  rpm: "rpm",
  "tar.gz": "tar.gz",
};

const MIME_TYPES: Record<DesktopInstallerExtension, string> = {
  exe: "application/vnd.microsoft.portable-executable",
  msi: "application/x-msi",
  msix: "application/msix",
  dmg: "application/x-apple-diskimage",
  pkg: "application/vnd.apple.installer+xml",
  zip: "application/zip",
  appimage: "application/octet-stream",
  deb: "application/vnd.debian.binary-package",
  rpm: "application/x-rpm",
  "tar.gz": "application/gzip",
};

const SORTED_EXTENSIONS = [...DESKTOP_INSTALLER_EXTENSIONS].sort(
  (left, right) => right.length - left.length,
);

export function isValidDesktopReleaseVersion(version: string): boolean {
  return SEMVER_PATTERN.test(version.trim());
}

export function isDesktopReleasePlatform(
  value: unknown,
): value is DesktopReleasePlatform {
  return DESKTOP_RELEASE_PLATFORMS.includes(value as DesktopReleasePlatform);
}

export function isDesktopReleaseArchitecture(
  value: unknown,
): value is DesktopReleaseArchitecture {
  return DESKTOP_RELEASE_ARCHITECTURES.includes(
    value as DesktopReleaseArchitecture,
  );
}

export function isValidDesktopReleaseTarget(
  target: Partial<DesktopReleaseTarget>,
): target is DesktopReleaseTarget {
  return DESKTOP_RELEASE_TARGETS.some(
    (candidate) =>
      candidate.platform === target.platform &&
      candidate.architecture === target.architecture,
  );
}

export function validateDesktopReleaseTarget(
  target: Partial<DesktopReleaseTarget>,
): DesktopReleaseTarget {
  if (!isValidDesktopReleaseTarget(target)) {
    throw new Error("La combinación de sistema operativo y arquitectura no es válida.");
  }

  return {
    platform: target.platform,
    architecture: target.architecture,
  };
}

export function resolveDesktopReleaseTarget(
  platform: unknown,
  architecture: unknown,
): DesktopReleaseTarget {
  if (!platform && !architecture) return { ...DEFAULT_DESKTOP_RELEASE_TARGET };

  return validateDesktopReleaseTarget({
    platform: isDesktopReleasePlatform(platform) ? platform : undefined,
    architecture: isDesktopReleaseArchitecture(architecture)
      ? architecture
      : undefined,
  });
}

export function getDesktopReleaseTargetKey(
  target: DesktopReleaseTarget,
): DesktopReleaseTargetKey {
  const validTarget = validateDesktopReleaseTarget(target);
  return `${validTarget.platform}/${validTarget.architecture}` as DesktopReleaseTargetKey;
}

export function getDesktopReleaseTargetTitle(
  target: DesktopReleaseTarget,
): string {
  const validTarget = validateDesktopReleaseTarget(target);
  const configuredTarget = DESKTOP_RELEASE_TARGETS.find(
    (candidate) =>
      candidate.platform === validTarget.platform &&
      candidate.architecture === validTarget.architecture,
  );

  return configuredTarget?.title || getDesktopReleasePlatformTitle(validTarget.platform);
}

export function getDesktopReleasePlatformTitle(
  platform: DesktopReleasePlatform,
): string {
  return PLATFORM_TITLES[platform];
}

export function getDesktopReleaseArchitectureTitle(
  architecture: DesktopReleaseArchitecture,
): string {
  return ARCHITECTURE_TITLES[architecture];
}

export function getDesktopInstallerAccept(
  platform: DesktopReleasePlatform,
): string {
  return PLATFORM_EXTENSIONS[platform]
    .map((extension) => `.${DISPLAY_EXTENSIONS[extension]}`)
    .join(",");
}

export function getDesktopInstallerAllowedExtensions(
  platform: DesktopReleasePlatform,
): readonly DesktopInstallerExtension[] {
  return PLATFORM_EXTENSIONS[platform];
}

export function getDesktopInstallerExtension(
  fileName: string,
): DesktopInstallerExtension | null {
  const normalizedFileName = fileName.trim().toLowerCase();
  return (
    SORTED_EXTENSIONS.find((extension) =>
      normalizedFileName.endsWith(`.${extension}`),
    ) || null
  );
}

export function getDesktopInstallerMimeType(
  extension: DesktopInstallerExtension,
): string {
  return MIME_TYPES[extension];
}

export function getDesktopInstallerFileName(
  version: string,
  extension: DesktopInstallerExtension,
  target: DesktopReleaseTarget = DEFAULT_DESKTOP_RELEASE_TARGET,
): string {
  const validTarget = validateDesktopReleaseTarget(target);
  return `SensaVision-${PLATFORM_TITLES[validTarget.platform]}-${version}-${validTarget.architecture}.${DISPLAY_EXTENSIONS[extension]}`;
}

function getLegacyWindowsInstallerFileName(
  version: string,
  extension: DesktopInstallerExtension,
): string {
  return `SensaVision-Setup-${version}-x64.${DISPLAY_EXTENSIONS[extension]}`;
}

export function validateDesktopUploadFile(
  input: DesktopUploadFileInput,
): DesktopUploadFileInput & {
  extension: DesktopInstallerExtension;
  mimeType: string;
  canonicalFileName: string;
} {
  const version = input.version.trim();
  const target = validateDesktopReleaseTarget(input);
  const extension = getDesktopInstallerExtension(input.fileName);

  if (!isValidDesktopReleaseVersion(version)) {
    throw new Error("La versión debe usar SemVer, por ejemplo 1.2.3.");
  }

  if (!extension || !PLATFORM_EXTENSIONS[target.platform].includes(extension)) {
    const allowedExtensions = PLATFORM_EXTENSIONS[target.platform]
      .map((allowedExtension) => `.${DISPLAY_EXTENSIONS[allowedExtension]}`)
      .join(", ");
    throw new Error(
      `El instalador de ${PLATFORM_TITLES[target.platform]} debe usar ${allowedExtensions}.`,
    );
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
    ...target,
    version,
    extension,
    mimeType: getDesktopInstallerMimeType(extension),
    canonicalFileName: getDesktopInstallerFileName(version, extension, target),
  };
}

export function buildDesktopReleaseObjectKey({
  version,
  uploadId,
  extension,
  platform = DEFAULT_DESKTOP_RELEASE_TARGET.platform,
  architecture = DEFAULT_DESKTOP_RELEASE_TARGET.architecture,
}: {
  version: string;
  uploadId: string;
  extension: DesktopInstallerExtension;
  platform?: DesktopReleasePlatform;
  architecture?: DesktopReleaseArchitecture;
}): string {
  if (!isValidDesktopReleaseVersion(version)) {
    throw new Error("La versión del objeto no es válida.");
  }

  if (!/^[0-9A-Za-z_-]+$/.test(uploadId)) {
    throw new Error("El identificador de carga no es válido.");
  }

  const target = validateDesktopReleaseTarget({ platform, architecture });

  if (!PLATFORM_EXTENSIONS[target.platform].includes(extension)) {
    throw new Error("La extensión no corresponde al sistema operativo seleccionado.");
  }

  const fileName = getDesktopInstallerFileName(version, extension, target);

  return `desktop/stable/${target.platform}/${target.architecture}/v${version}/${uploadId}/${fileName}`;
}

export function parseDesktopReleaseObjectKey(
  objectKey: string,
): ParsedDesktopReleaseObjectKey {
  const segments = objectKey.split("/");

  if (
    segments.length !== 7 ||
    segments[0] !== "desktop" ||
    segments[1] !== DESKTOP_RELEASE_CHANNEL ||
    !segments[4]?.startsWith("v")
  ) {
    throw new Error("La clave del instalador no es válida.");
  }

  const platform = segments[2];
  const architecture = segments[3];
  const version = segments[4].slice(1);
  const uploadId = segments[5];
  const fileName = segments[6];
  const extension = getDesktopInstallerExtension(fileName);

  if (
    !isDesktopReleasePlatform(platform) ||
    !isDesktopReleaseArchitecture(architecture) ||
    !isValidDesktopReleaseVersion(version) ||
    !/^[0-9A-Za-z_-]+$/.test(uploadId) ||
    !extension
  ) {
    throw new Error("La clave del instalador no es válida.");
  }

  const target = validateDesktopReleaseTarget({ platform, architecture });
  const validFileNames = [
    getDesktopInstallerFileName(version, extension, target),
  ];

  if (platform === "win32" && architecture === "x64") {
    validFileNames.push(getLegacyWindowsInstallerFileName(version, extension));
  }

  if (
    !PLATFORM_EXTENSIONS[target.platform].includes(extension) ||
    !validFileNames.includes(fileName)
  ) {
    throw new Error("La clave del instalador no es válida.");
  }

  return { ...target, version, uploadId, extension, fileName };
}

export function assertDesktopReleaseObjectKey(
  objectKey: string,
  expected?: Partial<DesktopReleaseTarget & { version: string }>,
): void {
  const parsed = parseDesktopReleaseObjectKey(objectKey);

  if (
    (expected?.platform && parsed.platform !== expected.platform) ||
    (expected?.architecture && parsed.architecture !== expected.architecture) ||
    (expected?.version && parsed.version !== expected.version)
  ) {
    throw new Error("La clave del instalador no coincide con la release.");
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
