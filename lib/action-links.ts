import { stegaClean } from "next-sanity";

export type RenderableActionLinkKind = "desktopDownload" | "url";

/**
 * Keeps layout decisions aligned with the actions that ActionLinks can render.
 * A desktop download intentionally counts even without a release: the UI renders
 * its disabled "coming soon" control when localized messages are available.
 */
export function getRenderableActionLinkKind(
  link: Sanity.Link | null | undefined,
  hasDownloadMessages: boolean,
): RenderableActionLinkKind | null {
  if (!link) return null;

  if (stegaClean(link.targetType) === "desktopDownload") {
    return hasDownloadMessages ? "desktopDownload" : null;
  }

  const href = stegaClean(link.href)?.trim();
  const title = stegaClean(link.title)?.trim();
  return href && title ? "url" : null;
}

export function hasRenderableActionLinks(
  links: (Sanity.Link | null)[] | null | undefined,
  hasDownloadMessages: boolean,
) {
  return (links ?? []).some((link) =>
    Boolean(getRenderableActionLinkKind(link, hasDownloadMessages)),
  );
}
