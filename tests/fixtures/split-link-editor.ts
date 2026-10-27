import { Mutation } from "@sanity/mutator";
import { toMutationPatches, type FormPatch, type SanityDocument } from "sanity";
import splitColumn from "@/sanity/schemas/blocks/split/split-column";
import splitRow from "@/sanity/schemas/blocks/split/split-row";
import gridCard from "@/sanity/schemas/blocks/grid/grid-card";
import cta from "@/sanity/schemas/blocks/cta/cta-1";
import link from "@/sanity/schemas/blocks/shared/link";
import sectionPadding from "@/sanity/schemas/blocks/shared/section-padding";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { colorVariant } from "@/sanity/schemas/blocks/shared/color-variant";
import { sectionAnchorField } from "@/sanity/schemas/fields/section-anchor";
import { editorAssetId, splitParagraph } from "./split-row";

// The real column fields and input are mounted in an isolated Studio form.
// The enclosing document is local-only and is never registered in production.
export const splitLinkEditorTypes = [
  splitColumn,
  splitRow,
  gridCard,
  cta,
  link,
  sectionPadding,
  buttonVariant,
  colorVariant,
  { name: "block-content", type: "array", of: [{ type: "block" }] },
  {
    name: "splitLinkEditor",
    type: "document",
    fields: [sectionAnchorField, ...splitColumn.fields],
  },
  {
    name: "splitLinkPage",
    type: "document",
    fields: [
      { name: "row", type: "split-row" },
      { name: "cta", type: "cta-1" },
    ],
  },
];

export const initializedEmptyLink = {
  _type: "link",
  targetType: "url",
  downloadPlatform: "win32",
  downloadArchitecture: "x64",
  buttonVariant: "default",
};

export function splitLinkEditorDocument(initial: object = {}): SanityDocument {
  return {
    ...initial,
    _id: "local-split-link",
    _type: "splitLinkEditor",
    _rev: "local",
    _createdAt: "2026-10-27T00:00:00Z",
    _updatedAt: "2026-10-27T00:00:00Z",
    uid: "diseno",
    title: "Diseños con el estilo de tu negocio",
    layout: "vertical",
    headingLevel: "h2",
    imageFit: "contain",
    body: [
      splitParagraph("Descripción que debe conservarse al quitar el enlace."),
    ],
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: editorAssetId },
      alt: "Captura del editor de Sensa",
    },
  };
}

export function applyEditorPatches(
  document: SanityDocument,
  patches: FormPatch[],
) {
  // Use Sanity's mutation implementation, including setIfMissing and diffMatchPatch.
  return new Mutation({
    mutations: toMutationPatches(patches).map((patch) => ({
      patch: { id: document._id, ...patch },
    })),
  }).apply(document) as SanityDocument;
}
