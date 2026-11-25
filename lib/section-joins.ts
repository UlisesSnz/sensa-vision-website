import { stegaClean } from "next-sanity";

import { hasRenderableActionLinks } from "@/lib/action-links";

type SectionPadding =
  | {
      top?: boolean | null;
      bottom?: boolean | null;
    }
  | null
  | undefined;

type SectionBlock = Sanity.Block & {
  padding?: SectionPadding;
  colorVariant?: unknown;
  tagLine?: unknown;
  title?: unknown;
  description?: unknown;
  links?: (Sanity.Link | null)[] | null;
};

const compactJoinReceivers = new Set([
  "split-row",
  "grid-row",
  "carousel-1",
  "carousel-2",
  "timeline-row",
  "cta-1",
  "logo-cloud-1",
  "faqs",
  "form-newsletter",
  "form-emailjs",
  "video-1",
  "lottie-1",
  "desktop-download",
]);

function hasText(value: unknown) {
  const cleaned = stegaClean(value);
  return typeof cleaned === "string" && cleaned.trim().length > 0;
}

function hasEnabledPadding(padding: SectionPadding, edge: "top" | "bottom") {
  return padding?.[edge] === true;
}

function getSectionColor(block: SectionBlock) {
  const color = stegaClean(block.colorVariant);
  return typeof color === "string" && color.trim() ? color : "background";
}

function hasVisibleHeaderCopy(block: SectionBlock) {
  return (
    hasText(block.tagLine) || hasText(block.title) || hasText(block.description)
  );
}

export function isCompactSectionJoin(
  previous: Sanity.Block | undefined,
  next: Sanity.Block | undefined,
  hasDownloadMessages: boolean,
) {
  const header = previous as SectionBlock | undefined;
  const receiver = next as SectionBlock | undefined;

  if (
    !header ||
    !receiver ||
    header._type !== "section-header" ||
    !compactJoinReceivers.has(receiver._type)
  ) {
    return false;
  }

  if (
    hasEnabledPadding(header.padding, "bottom") ||
    hasEnabledPadding(receiver.padding, "top") ||
    getSectionColor(header) !== getSectionColor(receiver) ||
    !hasVisibleHeaderCopy(header) ||
    hasRenderableActionLinks(header.links, hasDownloadMessages)
  ) {
    return false;
  }

  return true;
}

/**
 * Private renderer hint. It deliberately is not persisted in Sanity so the
 * editorial padding controls remain the only public spacing API.
 */
export function getSectionJoinProps(
  blocks: Sanity.Block[],
  index: number,
  hasDownloadMessages: boolean,
) {
  const previous = blocks[index - 1] as SectionBlock | undefined;
  const current = blocks[index] as SectionBlock | undefined;
  const canReceiveJoinSpacing = Boolean(
    current && compactJoinReceivers.has(current._type),
  );
  const compactTop = isCompactSectionJoin(
    previous,
    current,
    hasDownloadMessages,
  );

  return {
    compactTop,
    // A preceding standard bottom edge already supplies the visible boundary
    // space, so receivers with a fallback text/form inset must not add to it.
    trimTopInset:
      canReceiveJoinSpacing &&
      (compactTop || hasEnabledPadding(previous?.padding, "bottom")),
  };
}
