import { createClient } from "@sanity/client";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getTranslationLanguage,
  getTranslationReference,
  translationItem,
} from "./lib/translation-metadata.mjs";

const TRANSLATED_TYPES = [
  "page",
  "post",
  "author",
  "category",
  "faq",
  "testimonial",
  "siteSettings",
];

const apply = process.argv.includes("--apply");
const backupConfirmed = process.argv.includes("--backup-confirmed");
const backupPath = resolve(process.cwd(), "backups", "sensa-pre-i18n.tar.gz");

if (apply && !backupConfirmed) {
  throw new Error(
    "Refusing to apply: run npm run i18n:backup first, then use the apply command.",
  );
}

if (apply && !existsSync(backupPath)) {
  throw new Error(
    `Refusing to apply: backup not found at ${backupPath}. Run npm run i18n:backup first.`,
  );
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const readToken = process.env.SANITY_API_READ_TOKEN;
const writeToken = process.env.SANITY_API_TOKEN;
const token = apply ? writeToken : writeToken || readToken;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-31";

if (!projectId || !dataset) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET.",
  );
}

if (apply && !writeToken) {
  throw new Error(
    "Applying the migration requires SANITY_API_TOKEN with write access.",
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion,
  useCdn: false,
  perspective: "raw",
});

const baseId = (id) => id.replace(/^drafts\./, "");
const draftId = (id) => `drafts.${baseId(id)}`;
const englishIdFor = (document) =>
  document._type === "siteSettings"
    ? "siteSettings-en"
    : `i18n.${baseId(document._id)}.en`;
const metadataIdFor = (document) =>
  `translation.metadata.${baseId(document._id)}`;

function withoutSystemFields(document, id) {
  const { _rev, _createdAt, _updatedAt, ...content } = document;
  return { ...content, _id: id };
}

function remapReferences(value, referenceMap, documentTypes, stats) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      remapReferences(item, referenceMap, documentTypes, stats),
    );
  }

  if (!value || typeof value !== "object") return value;

  if (typeof value._ref === "string") {
    const sourceReference = baseId(value._ref);
    const translatedReference = referenceMap.get(sourceReference);
    if (translatedReference) stats.remappedReferences += 1;
    if (!translatedReference) {
      const targetType = documentTypes.get(sourceReference);
      if (!targetType) stats.invalidReferences.add(sourceReference);
      else if (TRANSLATED_TYPES.includes(targetType)) {
        stats.missingTranslatedReferences.add(sourceReference);
      }
    }
    return translatedReference
      ? { ...value, _ref: translatedReference }
      : value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      remapReferences(child, referenceMap, documentTypes, stats),
    ]),
  );
}

function pickEffectiveDocuments(documents) {
  const byBaseId = new Map();

  for (const document of documents) {
    const id = baseId(document._id);
    const current = byBaseId.get(id);
    if (!current || document._id.startsWith("drafts.")) {
      byBaseId.set(id, document);
    }
  }

  return [...byBaseId.values()];
}

const [documents, metadataDocuments, documentIndex] = await Promise.all([
  client.fetch(`*[_type in $types && !(_id in path("versions.**"))]{...}`, {
    types: TRANSLATED_TYPES,
  }),
  client.fetch(
    `*[_type == "translation.metadata"]{
      _id,
      schemaTypes,
      translations[]{
        ...,
        "document": value->{_id, _type, language}
      }
    }`,
  ),
  client.fetch(`*[!(_id in path("versions.**"))]{_id, _type}`),
]);

const documentTypes = new Map(
  documentIndex.map((document) => [baseId(document._id), document._type]),
);

const existingMetadataByReference = new Map();
const englishBySpanish = new Map();

for (const metadata of metadataDocuments) {
  const translations = metadata.translations || [];
  const spanish = translations.find(
    (translation) => getTranslationLanguage(translation) === "es",
  );
  const english = translations.find(
    (translation) => getTranslationLanguage(translation) === "en",
  );

  for (const translation of translations) {
    const reference = getTranslationReference(translation);
    if (reference) {
      existingMetadataByReference.set(baseId(reference), metadata);
    }
  }

  const spanishReference = getTranslationReference(spanish);
  const englishReference = getTranslationReference(english);
  if (spanishReference && englishReference) {
    englishBySpanish.set(baseId(spanishReference), baseId(englishReference));
  }
}

const effectiveDocuments = pickEffectiveDocuments(documents);
const typePriority = new Map([
  ["author", 0],
  ["category", 0],
  ["faq", 0],
  ["testimonial", 0],
  ["siteSettings", 1],
  ["page", 2],
  ["post", 2],
]);
const spanishSources = effectiveDocuments
  .filter((document) => document.language !== "en")
  .sort(
    (left, right) =>
      (typePriority.get(left._type) ?? 1) -
        (typePriority.get(right._type) ?? 1) ||
      left._id.localeCompare(right._id),
  );
const referenceMap = new Map(englishBySpanish);

for (const source of spanishSources) {
  if (!referenceMap.has(baseId(source._id))) {
    referenceMap.set(baseId(source._id), englishIdFor(source));
  }
}

const report = {
  mode: apply ? "apply" : "dry-run",
  scannedDocuments: documents.length,
  spanishSources: spanishSources.length,
  languagePatches: documents.filter(
    (document) => document.language !== "es" && document.language !== "en",
  ).length,
  englishDraftsToCreate: 0,
  englishTranslationsAlreadyPresent: 0,
  metadataDocumentsToCreate: 0,
  metadataDocumentsToUpdate: 0,
  remappedReferences: 0,
  missingTranslatedReferences: 0,
  invalidReferences: 0,
  missingTranslatedReferenceIds: [],
  invalidReferenceIds: [],
};

const languageOperations = [];
const englishDraftOperations = [];
const metadataOperations = [];
const referenceDiagnostics = {
  missingTranslatedReferences: new Set(),
  invalidReferences: new Set(),
};

for (const document of documents) {
  if (document.language !== "es" && document.language !== "en") {
    languageOperations.push({
      type: "patch",
      id: document._id,
      set: { language: "es" },
    });
  }
}

for (const source of spanishSources) {
  const spanishReference = baseId(source._id);
  const englishReference = referenceMap.get(spanishReference);
  const existingEnglish = effectiveDocuments.find(
    (document) => baseId(document._id) === englishReference,
  );

  if (existingEnglish) {
    report.englishTranslationsAlreadyPresent += 1;
  } else {
    const englishDraftId = draftId(englishReference);
    const remapStats = {
      remappedReferences: 0,
      missingTranslatedReferences:
        referenceDiagnostics.missingTranslatedReferences,
      invalidReferences: referenceDiagnostics.invalidReferences,
    };
    const remapped = remapReferences(
      withoutSystemFields(source, englishDraftId),
      referenceMap,
      documentTypes,
      remapStats,
    );
    remapped.language = "en";

    report.remappedReferences += remapStats.remappedReferences;
    report.englishDraftsToCreate += 1;
    englishDraftOperations.push({
      type: "createIfNotExists",
      document: remapped,
    });
  }

  const existingMetadata = existingMetadataByReference.get(spanishReference);
  const metadataId = existingMetadata?._id || metadataIdFor(source);
  const translations = [
    translationItem("es", spanishReference, existingMetadata?.translations),
    translationItem("en", englishReference, existingMetadata?.translations),
  ];

  if (existingMetadata) {
    report.metadataDocumentsToUpdate += 1;
    metadataOperations.push({
      type: "patch",
      id: metadataId,
      set: { translations, schemaTypes: [source._type] },
    });
  } else {
    report.metadataDocumentsToCreate += 1;
    metadataOperations.push({
      type: "createIfNotExists",
      document: {
        _id: metadataId,
        _type: "translation.metadata",
        translations,
        schemaTypes: [source._type],
      },
    });
  }
}

report.missingTranslatedReferenceIds = [
  ...referenceDiagnostics.missingTranslatedReferences,
].sort();
report.invalidReferenceIds = [...referenceDiagnostics.invalidReferences].sort();
report.missingTranslatedReferences =
  report.missingTranslatedReferenceIds.length;
report.invalidReferences = report.invalidReferenceIds.length;

console.log(JSON.stringify(report, null, 2));

if (!apply) {
  console.log("Dry run only. No Sanity documents were changed.");
  process.exit(0);
}

const operationPhases = [
  languageOperations,
  englishDraftOperations,
  metadataOperations,
];

for (const operations of operationPhases) {
  for (let index = 0; index < operations.length; index += 50) {
    const transaction = client.transaction();
    for (const operation of operations.slice(index, index + 50)) {
      if (operation.type === "patch") {
        transaction.patch(operation.id, (patch) => patch.set(operation.set));
      } else {
        transaction.createIfNotExists(operation.document);
      }
    }
    await transaction.commit({ autoGenerateArrayKeys: true });
  }
}

const appliedOperations = operationPhases.reduce(
  (total, operations) => total + operations.length,
  0,
);
console.log(`Applied ${appliedOperations} migration operations.`);
