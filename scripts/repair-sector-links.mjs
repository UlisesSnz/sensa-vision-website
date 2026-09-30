import { createClient } from "@sanity/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const PROJECT_ID = "e07b8hy0";
const DATASET = "production";
const BACKUP_FORMAT = "issue-2-sector-links-v1";

// Exact draft/card keys reported in SV-Website#2. Never scan other content.
export const REPAIR_TARGETS = [
  {
    id: "drafts.5407b873-da24-4de7-be65-2a4e3949a113",
    slug: "retail-stores",
    rowKey: "c5798469c1f4",
    cardKeys: ["87b808ff758c", "9b36bb352a34"],
  },
  {
    id: "drafts.3598757d-68e4-4aa3-a8b1-d5472d602ce3",
    slug: "pharmacies",
    rowKey: "04f22679d9a6",
    cardKeys: ["c00386ce1d7d", "9d08688b6d23", "2123ab10a98a"],
  },
  {
    id: "drafts.b646929e-d3c4-4a4d-854f-51d5fa99b938",
    slug: "smart-shop-windows",
    rowKey: "256157b002da",
    cardKeys: ["cb0006245c64", "52e56f3a6faa"],
  },
  {
    id: "drafts.132db1ce-bc1b-40da-b924-a5ca910cadf9",
    slug: "receptions",
    rowKey: "359791b21aaa",
    cardKeys: ["16bfc0bc7d83", "71f744f71516", "48fd08889674"],
  },
];

export const SNAPSHOT_IDS = [
  ...REPAIR_TARGETS.flatMap(({ id }) => [id, id.replace(/^drafts\./, "")]),
  "drafts.siteSettings",
  "siteSettings",
];

class RepairError extends Error {}

function findUnique(items, key, description) {
  const matches = Array.isArray(items)
    ? items.filter((item) => item?._key === key)
    : [];
  if (matches.length !== 1) {
    throw new RepairError(`No se encontró una única ${description}: ${key}.`);
  }
  return matches[0];
}

function getCard(document, target, key) {
  const row = findUnique(document.blocks, target.rowKey, "fila");
  const card = findUnique(row.columns, key, "tarjeta");
  if (row._type !== "grid-row" || card._type !== "grid-card") {
    throw new RepairError(`Cambió el tipo de bloque en ${target.id}.`);
  }
  return card;
}

export function buildRepairPlan(documents) {
  return REPAIR_TARGETS.flatMap((target) => {
    const matches = documents.filter((document) => document._id === target.id);
    const document = matches[0];
    if (
      matches.length !== 1 ||
      document._type !== "page" ||
      document.language !== "es" ||
      document.slug?.current !== target.slug ||
      typeof document._rev !== "string" ||
      !document._rev
    ) {
      throw new RepairError(
        `El borrador no coincide con el issue: ${target.id}.`,
      );
    }

    const unset = target.cardKeys.flatMap((key) => {
      const card = getCard(document, target, key);
      if (!Object.hasOwn(card, "link")) return [];

      // Only this exact legacy shape is empty. Partial links, download targets,
      // unknown properties and any other edited value must be preserved.
      if (
        !isDeepStrictEqual(card.link, {
          _type: "link",
          buttonVariant: "default",
        })
      ) {
        throw new RepairError(
          `El enlace ${target.id}/${key} ya no está vacío; no se modificó ningún documento.`,
        );
      }
      return [`blocks[_key=="${target.rowKey}"].columns[_key=="${key}"].link`];
    });

    return unset.length
      ? [{ id: target.id, ifRevisionID: document._rev, unset }]
      : [];
  });
}

function validateSnapshot(documents) {
  const ids = documents.map((document) => document._id).sort();
  if (!isDeepStrictEqual(ids, [...SNAPSHOT_IDS].sort())) {
    throw new RepairError(
      "El respaldo debe contener exactamente los 10 documentos del issue.",
    );
  }
  for (const id of ["drafts.siteSettings", "siteSettings"]) {
    const document = documents.find((item) => item._id === id);
    if (document._type !== "siteSettings" || document.language !== "es") {
      throw new RepairError(`El idioma del documento ${id} requiere revisión.`);
    }
  }
}

function contentOnly(document) {
  const content = { ...document };
  delete content._rev;
  delete content._updatedAt;
  return content;
}

export function verifyRepairOutcome(before, after) {
  const expected = structuredClone(before);
  for (const target of REPAIR_TARGETS) {
    const document = expected.find((item) => item._id === target.id);
    if (!document) throw new RepairError(`Falta el respaldo de ${target.id}.`);
    for (const key of target.cardKeys)
      delete getCard(document, target, key).link;
  }
  const normalize = (documents) =>
    documents
      .map(contentOnly)
      .sort((left, right) => left._id.localeCompare(right._id));
  if (!isDeepStrictEqual(normalize(expected), normalize(after))) {
    throw new RepairError(
      "La comprobación posterior detectó diferencias adicionales. Conserva el respaldo y revisa los documentos.",
    );
  }
}

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const backupIndex = args.indexOf("--backup");
  const backupArgument = backupIndex >= 0 ? args[backupIndex + 1] : undefined;
  const knownArgs = args.filter(
    (_, index) => index !== backupIndex + 1 || backupIndex < 0,
  );
  if (knownArgs.some((arg) => arg !== "--apply" && arg !== "--backup")) {
    throw new RepairError(
      "Uso: node scripts/repair-sector-links.mjs [--apply] [--backup backups/archivo.json]",
    );
  }
  if (
    (apply || backupIndex >= 0) &&
    (!backupArgument || backupArgument.startsWith("--"))
  ) {
    throw new RepairError("Indica --backup con la ruta del respaldo revisado.");
  }
  if (
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_DATASET !== DATASET
  ) {
    throw new RepairError(
      "La configuración no coincide con el proyecto y dataset del issue.",
    );
  }
  const readToken = process.env.SANITY_API_READ_TOKEN;
  const writeToken = process.env.SANITY_API_TOKEN;
  if (!readToken || (apply && !writeToken)) {
    throw new RepairError(
      apply
        ? "Aplicar requiere SANITY_API_READ_TOKEN y SANITY_API_TOKEN."
        : "Falta SANITY_API_READ_TOKEN.",
    );
  }

  const backupRoot = path.resolve("backups");
  const backupPath = path.resolve(
    backupArgument ||
      path.join(
        backupRoot,
        `issue-2-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      ),
  );
  const relativeBackup = path.relative(backupRoot, backupPath);
  if (
    !relativeBackup ||
    relativeBackup.startsWith("..") ||
    path.isAbsolute(relativeBackup)
  ) {
    throw new RepairError("Guarda el respaldo dentro de backups/.");
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    token: readToken,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-31",
    useCdn: false,
    perspective: "raw",
    maxRetries: 0,
    timeout: 30000,
  });
  const fetchDocuments = () =>
    client.fetch("*[_id in $ids]", { ids: SNAPSHOT_IDS });
  const documents = await fetchDocuments();
  validateSnapshot(documents);
  const plan = buildRepairPlan(documents);

  if (!apply) {
    await mkdir(path.dirname(backupPath), { recursive: true });
    await writeFile(
      backupPath,
      JSON.stringify(
        {
          format: BACKUP_FORMAT,
          projectId: PROJECT_ID,
          dataset: DATASET,
          documents,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          backupPath,
          linksToRemove: plan.reduce(
            (sum, patch) => sum + patch.unset.length,
            0,
          ),
          plan,
        },
        null,
        2,
      ),
    );
    return;
  }

  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  if (
    backup.format !== BACKUP_FORMAT ||
    backup.projectId !== PROJECT_ID ||
    backup.dataset !== DATASET
  ) {
    throw new RepairError("El respaldo no corresponde a esta reparación.");
  }
  validateSnapshot(backup.documents);
  const reviewedPlan = buildRepairPlan(backup.documents);
  if (plan.length === 0) {
    verifyRepairOutcome(backup.documents, documents);
    console.log(
      JSON.stringify({
        mode: "apply",
        status: "already-repaired",
        linksRemoved: 0,
      }),
    );
    return;
  }
  if (!isDeepStrictEqual(plan, reviewedPlan)) {
    throw new RepairError(
      "Los borradores cambiaron desde el respaldo. Genera y revisa una nueva simulación.",
    );
  }

  const transaction = client.withConfig({ token: writeToken }).transaction();
  for (const { id, ifRevisionID, unset } of plan) {
    transaction.patch(id, { ifRevisionID, unset });
  }
  await transaction.commit({ visibility: "sync" });
  const after = await fetchDocuments();
  verifyRepairOutcome(documents, after);
  console.log(
    JSON.stringify(
      {
        mode: "apply",
        draftsPatched: plan.length,
        linksRemoved: plan.reduce((sum, patch) => sum + patch.unset.length, 0),
        verification:
          "Only the 10 allowlisted link fields changed; published documents and navigation are unchanged.",
        backupPath,
      },
      null,
      2,
    ),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  run().catch((error) => {
    // SDK errors can contain request context. Never log clients, headers or tokens.
    console.error(
      error instanceof RepairError
        ? error.message
        : `No se pudo completar la reparación (estado ${error.statusCode || "local/network"}).`,
    );
    process.exitCode = 1;
  });
}
