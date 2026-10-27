import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { isPortableTextTable } from "@/lib/portable-text-table";

export interface SplitColumnContent {
  _key?: string;
  position?: boolean | null;
  layout?: "horizontal" | "vertical" | null;
  imageFit?: "cover" | "contain" | null;
  headingLevel?: "h2" | "h3" | null;
  sectionWidth?: "default" | "narrow" | null;
  contentWidth?: "default" | "narrow" | null;
  stackAlign?: "left" | "center" | null;
  title?: string | null;
  tagLine?: string | null;
  body?: PortableTextProps["value"] | null;
  image?: Sanity.Image | null;
  link?: Partial<Sanity.Link> | null;
}

export function cleanSplitText(value: unknown): string {
  return typeof value === "string" ? stegaClean(value).trim() : "";
}

export function getSplitOptions(column: SplitColumnContent) {
  return {
    layout:
      cleanSplitText(column.layout) === "vertical" ? "vertical" : "horizontal",
    imageFit:
      cleanSplitText(column.imageFit) === "contain" ? "contain" : "cover",
    headingLevel: cleanSplitText(column.headingLevel) === "h2" ? "h2" : "h3",
    sectionWidth:
      cleanSplitText(column.sectionWidth) === "narrow" ? "narrow" : "default",
    contentWidth:
      cleanSplitText(column.contentWidth) === "default" ? "default" : "narrow",
    stackAlign:
      cleanSplitText(column.stackAlign) === "center" ? "center" : "left",
  } as const;
}

function hasBodyContent(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  switch (block._type) {
    case "block":
      return (
        Array.isArray(block.children) &&
        block.children.some(
          (child) =>
            child &&
            typeof child === "object" &&
            Boolean(cleanSplitText(child.text)),
        )
      );
    case "image": {
      const asset = block.asset as Record<string, unknown> | undefined;
      return Boolean(asset && (asset._id || asset._ref || asset.url));
    }
    case "code":
      return Boolean(cleanSplitText(block.code));
    case "table":
      return isPortableTextTable(value);
    default:
      return false;
  }
}

export function getSplitContent(column: SplitColumnContent) {
  const body = (
    Array.isArray(column.body) ? column.body : column.body ? [column.body] : []
  ).filter(hasBodyContent);
  const hasTitle = Boolean(cleanSplitText(column.title));
  const hasTagLine = Boolean(cleanSplitText(column.tagLine));
  const href = cleanSplitText(column.link?.href);
  const hasLink = Boolean(href && cleanSplitText(column.link?.title));
  const hasImage = Boolean(cleanSplitText(column.image?.asset?._id));
  const hasText = hasTitle || hasTagLine || body.length > 0 || hasLink;

  return { body, hasTitle, hasTagLine, href, hasLink, hasImage, hasText };
}

export function getRenderableSplitColumns(
  columns?: (SplitColumnContent | null)[] | null,
) {
  return (columns ?? []).filter((column): column is SplitColumnContent => {
    if (!column) return false;
    const { hasImage, hasText } = getSplitContent(column);
    return hasImage || hasText;
  });
}
