"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import {
  type ObjectInputProps,
  set,
  useClient,
  useCurrentUser,
  useFormValue,
  userHasRole,
} from "sanity";

import {
  abortDesktopReleaseUpload,
  completeDesktopReleaseUpload,
  listDesktopReleaseUploadParts,
  signDesktopReleaseUploadParts,
  startDesktopReleaseUpload,
} from "@/app/actions/desktop-release-upload";
import {
  DEFAULT_DESKTOP_RELEASE_TARGET,
  getDesktopInstallerAccept,
  getDesktopInstallerAllowedExtensions,
  getDesktopReleaseTargetTitle,
  isDesktopReleaseArchitecture,
  isDesktopReleasePlatform,
  isValidDesktopReleaseTarget,
  validateDesktopUploadFile,
  type DesktopInstaller,
  type DesktopReleaseArchitecture,
  type DesktopReleasePlatform,
} from "@/lib/desktop-release";
import { uploadDesktopMultipartParts } from "@/lib/desktop-upload-client";
import { apiVersion } from "@/sanity/env";

type PendingUpload = {
  version: string;
  platform: DesktopReleasePlatform;
  architecture: DesktopReleaseArchitecture;
  fileName: string;
  sizeBytes: number;
  lastModified: number;
  uploadId: string;
  objectKey: string;
  partSizeBytes: number;
  partCount: number;
};

const LEGACY_STORAGE_KEY = "sensa-desktop-release-multipart";
const STORAGE_VERSION = "v2";

function pendingUploadStorageKey(documentId: string): string {
  return `sensa-desktop-release-multipart:${STORAGE_VERSION}:${documentId}`;
}

function parsePendingUpload(value: string | null): PendingUpload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<PendingUpload>;
    const platform = isDesktopReleasePlatform(parsed.platform)
      ? parsed.platform
      : DEFAULT_DESKTOP_RELEASE_TARGET.platform;
    const architecture = isDesktopReleaseArchitecture(parsed.architecture)
      ? parsed.architecture
      : DEFAULT_DESKTOP_RELEASE_TARGET.architecture;

    if (
      !isValidDesktopReleaseTarget({ platform, architecture }) ||
      typeof parsed.version !== "string" ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.sizeBytes !== "number" ||
      typeof parsed.lastModified !== "number" ||
      typeof parsed.uploadId !== "string" ||
      typeof parsed.objectKey !== "string" ||
      typeof parsed.partSizeBytes !== "number" ||
      typeof parsed.partCount !== "number"
    ) {
      return null;
    }

    return {
      version: parsed.version,
      platform,
      architecture,
      fileName: parsed.fileName,
      sizeBytes: parsed.sizeBytes,
      lastModified: parsed.lastModified,
      uploadId: parsed.uploadId,
      objectKey: parsed.objectKey,
      partSizeBytes: parsed.partSizeBytes,
      partCount: parsed.partCount,
    };
  } catch {
    return null;
  }
}

function readPendingUpload(
  storageKey: string,
  migrateLegacyUpload: boolean,
): PendingUpload | null {
  try {
    const currentUpload = parsePendingUpload(
      window.localStorage.getItem(storageKey),
    );
    if (currentUpload) return currentUpload;
    if (!migrateLegacyUpload) return null;

    const legacyUpload = parsePendingUpload(
      window.localStorage.getItem(LEGACY_STORAGE_KEY),
    );
    if (!legacyUpload) return null;

    window.localStorage.setItem(storageKey, JSON.stringify(legacyUpload));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacyUpload;
  } catch {
    return null;
  }
}

function savePendingUpload(
  storageKey: string,
  upload: PendingUpload | null,
): void {
  try {
    if (upload) {
      window.localStorage.setItem(storageKey, JSON.stringify(upload));
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // R2 remains the recovery source when browser storage is unavailable.
  }
}

function selectedFileMatchesUpload(file: File, upload: PendingUpload): boolean {
  return (
    file.name === upload.fileName &&
    file.size === upload.sizeBytes &&
    file.lastModified === upload.lastModified
  );
}

export default function DesktopInstallerInput(
  props: ObjectInputProps<Record<string, unknown>>,
) {
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();
  const documentId = String(useFormValue(["_id"]) || "new-release");
  const version = String(useFormValue(["version"]) || "").trim();
  const platformValue = useFormValue(["platform"]);
  const architectureValue = useFormValue(["architecture"]);
  const platform = isDesktopReleasePlatform(platformValue)
    ? platformValue
    : null;
  const architecture = isDesktopReleaseArchitecture(architectureValue)
    ? architectureValue
    : null;
  const target = useMemo(
    () =>
      platform &&
      architecture &&
      isValidDesktopReleaseTarget({ platform, architecture })
        ? { platform, architecture }
        : null,
    [architecture, platform],
  );
  const migrateLegacyUpload =
    target?.platform === DEFAULT_DESKTOP_RELEASE_TARGET.platform &&
    target.architecture === DEFAULT_DESKTOP_RELEASE_TARGET.architecture;
  const storageKey = pendingUploadStorageKey(documentId);
  const token = client.config().token;
  const isAdministrator = userHasRole(currentUser, "administrator");
  const abortControllers = useRef(new Set<AbortController>());
  const fileInput = useRef<HTMLInputElement | null>(null);
  const activeRunId = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controllers = abortControllers.current;
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setPendingUpload(readPendingUpload(storageKey, migrateLegacyUpload));
      }
    });

    return () => {
      isActive = false;
      activeRunId.current += 1;
      controllers.forEach((controller) => controller.abort());
    };
  }, [migrateLegacyUpload, storageKey]);

  const installer = props.value as Partial<DesktopInstaller> | undefined;
  const recoveryMessage = pendingUpload
    ? `Selecciona nuevamente ${pendingUpload.fileName} para reanudar la carga.`
    : null;
  const targetTitle = target
    ? getDesktopReleaseTargetTitle(target)
    : "el destino seleccionado";
  const allowedExtensions = target
    ? getDesktopInstallerAllowedExtensions(target.platform)
        .map((extension) =>
          extension === "appimage" ? ".AppImage" : `.${extension}`,
        )
        .join(", ")
    : null;

  const uploadFile = useCallback(
    async (file: File, existingUpload?: PendingUpload | null) => {
      if (!isAdministrator || typeof token !== "string") {
        setError("Inicia sesión con un token de administrador de Sanity.");
        return;
      }

      if (!target) {
        setError("Selecciona primero un sistema operativo y una arquitectura.");
        return;
      }

      let validatedFile: ReturnType<typeof validateDesktopUploadFile>;

      try {
        validatedFile = validateDesktopUploadFile({
          version,
          platform: target.platform,
          architecture: target.architecture,
          fileName: file.name,
          sizeBytes: file.size,
        });
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "El archivo no es válido.",
        );
        return;
      }

      if (existingUpload && !selectedFileMatchesUpload(file, existingUpload)) {
        setError(
          `La carga pendiente corresponde a ${existingUpload.fileName}. Cancélala antes de elegir otro archivo.`,
        );
        return;
      }

      if (
        existingUpload &&
        (existingUpload.version !== validatedFile.version ||
          existingUpload.platform !== validatedFile.platform ||
          existingUpload.architecture !== validatedFile.architecture)
      ) {
        setError(
          "La carga pendiente pertenece a otra versión o destino. Restáurala o cancela la carga.",
        );
        return;
      }

      setIsUploading(true);
      setError(null);
      setMessage(existingUpload ? "Recuperando partes subidas…" : "Iniciando carga…");
      setSelectedFile(file);
      const runId = ++activeRunId.current;
      const assertActiveRun = () => {
        if (runId !== activeRunId.current) {
          throw new DOMException("Carga cancelada.", "AbortError");
        }
      };

      try {
        const session =
          existingUpload ||
          ({
            version: validatedFile.version,
            platform: validatedFile.platform,
            architecture: validatedFile.architecture,
            fileName: file.name,
            sizeBytes: file.size,
            lastModified: file.lastModified,
            ...(await startDesktopReleaseUpload(token, {
              version: validatedFile.version,
              platform: validatedFile.platform,
              architecture: validatedFile.architecture,
              fileName: file.name,
              sizeBytes: file.size,
            })),
          } satisfies PendingUpload);

        assertActiveRun();
        savePendingUpload(storageKey, session);
        setPendingUpload(session);

        const uploadedParts = await listDesktopReleaseUploadParts({
          token,
          platform: session.platform,
          architecture: session.architecture,
          objectKey: session.objectKey,
          uploadId: session.uploadId,
        });
        assertActiveRun();
        const missingPartCount = session.partCount - uploadedParts.length;

        setMessage(
          missingPartCount > 0
            ? `Subiendo instalador de ${targetTitle} directamente a R2…`
            : "Verificando carga…",
        );

        const completedParts = await uploadDesktopMultipartParts({
          file,
          session,
          uploadedParts,
          abortControllers: abortControllers.current,
          onProgress: setProgress,
          signPart: async (partNumber) => {
            const [{ url }] = await signDesktopReleaseUploadParts({
              token,
              platform: session.platform,
              architecture: session.architecture,
              objectKey: session.objectKey,
              uploadId: session.uploadId,
              partNumbers: [partNumber],
            });

            return url;
          },
          putPart: async (url, body, signal) => {
            const response = await fetch(url, {
              method: "PUT",
              body,
              headers: { "Content-Type": validatedFile.mimeType },
              signal,
            });

            if (!response.ok) {
              throw new Error(`R2 respondió ${response.status}.`);
            }

            return response.headers.get("ETag") || "";
          },
        });
        assertActiveRun();

        setMessage("Finalizando y verificando el archivo…");

        const completedInstaller = await completeDesktopReleaseUpload({
          token,
          objectKey: session.objectKey,
          uploadId: session.uploadId,
          version: validatedFile.version,
          platform: validatedFile.platform,
          architecture: validatedFile.architecture,
          fileName: file.name,
          sizeBytes: file.size,
          parts: completedParts,
        });
        assertActiveRun();

        props.onChange(
          set({ _type: "desktopInstaller", ...completedInstaller }),
        );
        savePendingUpload(storageKey, null);
        setPendingUpload(null);
        setProgress(100);
        setMessage("Instalador cargado. Publica la release cuando esté lista.");
      } catch (uploadError) {
        if (runId !== activeRunId.current) return;

        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "No fue posible completar la carga.",
        );
        setMessage(null);
      } finally {
        if (runId === activeRunId.current) setIsUploading(false);
      }
    },
    [
      isAdministrator,
      props,
      storageKey,
      target,
      targetTitle,
      token,
      version,
    ],
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) await uploadFile(file, pendingUpload);
  };

  const cancelUpload = async () => {
    activeRunId.current += 1;
    abortControllers.current.forEach((controller) => controller.abort());

    if (pendingUpload && typeof token === "string") {
      try {
        await abortDesktopReleaseUpload({
          token,
          platform: pendingUpload.platform,
          architecture: pendingUpload.architecture,
          objectKey: pendingUpload.objectKey,
          uploadId: pendingUpload.uploadId,
        });
      } catch {
        // The lifecycle rule remains the fallback for an already-expired upload.
      }
    }

    savePendingUpload(storageKey, null);
    setPendingUpload(null);
    setSelectedFile(null);
    setIsUploading(false);
    setProgress(0);
    setMessage("Carga cancelada.");
    setError(null);
  };

  return (
    <Card border padding={4} radius={2}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Instalador de {targetTitle}
          </Text>
          <Text muted size={1}>
            El archivo viaja directamente a R2.
            {allowedExtensions
              ? ` Se aceptan ${allowedExtensions} de hasta 5 GiB.`
              : " Selecciona un destino para conocer los formatos permitidos."}
          </Text>
        </Stack>

        {installer?.url ? (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>Archivo actual: {installer.fileName}</Text>
          </Card>
        ) : null}

        {recoveryMessage && !isUploading ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>{recoveryMessage}</Text>
          </Card>
        ) : null}

        {isUploading ? (
          <Stack space={2}>
            <progress
              aria-label="Progreso de carga"
              max={100}
              style={{ width: "100%" }}
              value={progress}
            />
            <Text aria-live="polite" muted size={1}>
              {progress}% · {message}
            </Text>
          </Stack>
        ) : null}

        {!isUploading && message ? (
          <Text aria-live="polite" muted size={1}>
            {message}
          </Text>
        ) : null}

        {error ? (
          <Card padding={3} radius={2} tone="critical">
            <Text aria-live="assertive" size={1}>
              {error}
            </Text>
          </Card>
        ) : null}

        {!isAdministrator ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>
              Solo un administrador puede subir o cancelar instaladores.
            </Text>
          </Card>
        ) : null}

        <Flex gap={2} wrap="wrap">
          <Box>
            <Button
              disabled={!isAdministrator || isUploading || !version || !target}
              mode="ghost"
              onClick={() => fileInput.current?.click()}
              text={installer ? "Reemplazar archivo" : "Seleccionar archivo"}
              tone="primary"
            />
            <input
              ref={fileInput}
              accept={target ? getDesktopInstallerAccept(target.platform) : undefined}
              aria-label={`Seleccionar instalador de ${targetTitle}`}
              disabled={!isAdministrator || isUploading || !version || !target}
              onChange={handleFileChange}
              style={{ display: "none" }}
              type="file"
            />
          </Box>

          {error && selectedFile && !isUploading ? (
            <Button
              mode="bleed"
              onClick={() => {
                void uploadFile(selectedFile, pendingUpload);
              }}
              text="Reintentar"
            />
          ) : null}

          {pendingUpload || isUploading ? (
            <Button
              mode="bleed"
              onClick={cancelUpload}
              text="Cancelar carga"
              tone="critical"
            />
          ) : null}
        </Flex>

        {!version ? (
          <Text muted size={1}>Ingresa primero una versión SemVer.</Text>
        ) : null}
        {!target ? (
          <Text muted size={1}>
            Selecciona primero un sistema operativo y una arquitectura válidos.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
