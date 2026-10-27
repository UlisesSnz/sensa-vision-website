import { stegaClean } from "next-sanity";
import {
  getRenderableSplitColumns,
  type SplitColumnContent,
} from "@/lib/split-content";

export const SECTION_ANCHOR_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSectionAnchor(value: unknown): string | undefined {
  const anchor = typeof value === "string" ? stegaClean(value).trim() : "";
  return SECTION_ANCHOR_PATTERN.test(anchor) ? anchor : undefined;
}

type AnchorBlock = {
  _type: string;
  _key?: string;
  uid?: string | null;
  splitColumns?: (SplitColumnContent | null)[] | null;
};

const hasSectionAnchor = (block: AnchorBlock) =>
  block._type === "section-header" || block._type === "split-row";

// Allocate IDs once per page render. Empty Split Rows must not consume an ID.
export function withUniqueSectionAnchors<T extends AnchorBlock>(
  blocks?: readonly T[] | null,
): T[] {
  const seen = new Set<string>();
  return (blocks ?? []).flatMap((block) => {
    if (!hasSectionAnchor(block)) return [block];
    if (
      block._type === "split-row" &&
      !getRenderableSplitColumns(block.splitColumns).length
    )
      return [];
    const anchor = normalizeSectionAnchor(block.uid);
    const uid = anchor && !seen.has(anchor) ? anchor : undefined;
    if (uid) seen.add(uid);
    return [{ ...block, uid }];
  });
}

// Paths are relative to page.blocks, so Studio can identify each conflicting field.
export function validateUniqueSectionAnchors(value: unknown) {
  if (!Array.isArray(value)) return true;
  const anchors = new Map<
    string,
    Array<Array<string | number | { _key: string }>>
  >();
  value.forEach((block: AnchorBlock | null, index) => {
    if (!block || !hasSectionAnchor(block)) return;
    const anchor = normalizeSectionAnchor(block.uid);
    if (!anchor) return;
    const paths = anchors.get(anchor) ?? [];
    paths.push([block._key ? { _key: block._key } : index, "uid"]);
    anchors.set(anchor, paths);
  });
  const duplicates = [...anchors.entries()].filter(
    ([, paths]) => paths.length > 1,
  );
  return duplicates.length
    ? {
        message: `Cada ancla debe ser única en la página. Repetidas: ${duplicates.map(([anchor]) => anchor).join(", ")}.`,
        paths: duplicates.flatMap(([, paths]) => paths),
      }
    : true;
}
