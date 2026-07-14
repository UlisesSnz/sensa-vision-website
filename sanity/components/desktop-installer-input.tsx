"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  validateDesktopUploadFile,
  type DesktopInstaller,
} from "@/lib/desktop-release";
import { uploadDesktopMultipartParts } from "@/lib/desktop-upload-client";
import { apiVersion } from "@/sanity/env";

type PendingUpload = {
  version: string;
  fileName: string;
  sizeBytes: number;
  lastModified: number;
  uploadId: string;
  objectKey: string;
  partSizeBytes: number;
  partCount: number;
};

const STORAGE_KEY = "sensa-desktop-release-multipart";
function readPendingUpload(): PendingUpload | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as PendingUpload) : null;
  } catch {
    return null;
  }
}

function savePendingUpload(upload: PendingUpload | null): void {
  if (upload) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(upload));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
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
  props: ObjectInputProps<Record<string, any>>,
) {
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();
  const version = String(useFormValue(["version"]) || "").trim();
  const token = client.config().token;
  const isAdministrator = userHasRole(currentUser, "administrator");
  const abortControllers = useRef(new Set<AbortController>());
  const fileInput = useRef<HTMLInputElement | null>(null);
  const activeRunId = useRef(0);
  const selectedFile = useRef<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingUpload(readPendingUpload());

    return () => {
      activeRunId.current += 1;
      abortControllers.current.forEach((controller) => controller.abort());
    };
  }, []);

  const installer = props.value as Partial<DesktopInstaller> | undefined;
  const recoveryMessage = pendingUpload
    ? `Selecciona nuevamente ${pendingUpload.fileName} para reanudar la carga.`
    : null;

  const uploadFile = useCallback(
    async (file: File, existingUpload?: PendingUpload | null) => {
      if (!isAdministrator || typeof token !== "string") {
        setError("Inicia sesión con un token de administrador de Sanity.");
        return;
      }

      let validatedFile: ReturnType<typeof validateDesktopUploadFile>;

      try {
        validatedFile = validateDesktopUploadFile({
          version,
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

      if (existingUpload && existingUpload.version !== validatedFile.version) {
        setError(
          `La carga pendiente usa la versión ${existingUpload.version}. Restáurala o cancela la carga.`,
        );
        return;
      }

      setIsUploading(true);
      setError(null);
      setMessage(existingUpload ? "Recuperando partes subidas…" : "Iniciando carga…");
      selectedFile.current = file;
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
            fileName: file.name,
            sizeBytes: file.size,
            lastModified: file.lastModified,
            ...(await startDesktopReleaseUpload(token, {
              version: validatedFile.version,
              fileName: file.name,
              sizeBytes: file.size,
            })),
          } satisfies PendingUpload);

        assertActiveRun();
        savePendingUpload(session);
        setPendingUpload(session);

        const uploadedParts = await listDesktopReleaseUploadParts({
          token,
          objectKey: session.objectKey,
          uploadId: session.uploadId,
        });
        assertActiveRun();
        const missingPartCount = session.partCount - uploadedParts.length;

        setMessage(
          missingPartCount > 0
            ? "Subiendo instalador directamente a R2…"
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

        const installer = await completeDesktopReleaseUpload({
          token,
          objectKey: session.objectKey,
          uploadId: session.uploadId,
          version: validatedFile.version,
          fileName: file.name,
          sizeBytes: file.size,
          parts: completedParts,
        });
        assertActiveRun();

        props.onChange(set({ _type: "desktopInstaller", ...installer }));
        savePendingUpload(null);
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
    [isAdministrator, props, token, version],
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
          objectKey: pendingUpload.objectKey,
          uploadId: pendingUpload.uploadId,
        });
      } catch {
        // The lifecycle rule remains the fallback for an already-expired upload.
      }
    }

    savePendingUpload(null);
    setPendingUpload(null);
    selectedFile.current = null;
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
            Instalador de Windows x64
          </Text>
          <Text muted size={1}>
            El archivo viaja directamente a R2. Se aceptan .exe, .msi y .msix
            de hasta 5 GiB.
          </Text>
        </Stack>

        {installer?.url && (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>
              Archivo actual: {installer.fileName}
            </Text>
          </Card>
        )}

        {recoveryMessage && !isUploading && (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>{recoveryMessage}</Text>
          </Card>
        )}

        {isUploading && (
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
        )}

        {!isUploading && message && (
          <Text aria-live="polite" muted size={1}>
            {message}
          </Text>
        )}

        {error && (
          <Card padding={3} radius={2} tone="critical">
            <Text aria-live="assertive" size={1}>
              {error}
            </Text>
          </Card>
        )}

        {!isAdministrator && (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>
              Solo un administrador puede subir o cancelar instaladores.
            </Text>
          </Card>
        )}

        <Flex gap={2} wrap="wrap">
          <Box>
            <Button
              disabled={!isAdministrator || isUploading || !version}
              mode="ghost"
              onClick={() => fileInput.current?.click()}
              text={installer ? "Reemplazar archivo" : "Seleccionar archivo"}
              tone="primary"
            />
            <input
              ref={fileInput}
              accept=".exe,.msi,.msix"
              aria-label="Seleccionar instalador de SensaVision"
              disabled={!isAdministrator || isUploading || !version}
              onChange={handleFileChange}
              style={{ display: "none" }}
              type="file"
            />
          </Box>

          {error && selectedFile.current && !isUploading && (
            <Button
              mode="bleed"
              onClick={() => {
                const file = selectedFile.current;
                if (file) void uploadFile(file, pendingUpload);
              }}
              text="Reintentar"
            />
          )}

          {(pendingUpload || isUploading) && (
            <Button
              mode="bleed"
              onClick={cancelUpload}
              text="Cancelar carga"
              tone="critical"
            />
          )}
        </Flex>

        {!version && (
          <Text muted size={1}>
            Ingresa primero una versión SemVer.
          </Text>
        )}
      </Stack>
    </Card>
  );
}
