import { stegaClean } from "next-sanity";
import { getSplitContent, type SplitColumnContent } from "@/lib/split-content";
import {
  DEFAULT_DESKTOP_RELEASE_TARGET,
  getDesktopReleaseTargetKey,
  isDesktopReleaseArchitecture,
  isDesktopReleasePlatform,
  isValidDesktopReleaseTarget,
  type DesktopReleaseTarget,
  type DesktopReleaseTargetKey,
} from "@/lib/desktop-release";

export type DesktopReleaseTargetFields = {
  downloadPlatform?: unknown;
  downloadArchitecture?: unknown;
};

export type DesktopReleaseLookup = Partial<
  Record<DesktopReleaseTargetKey, Sanity.DesktopRelease | null>
>;

type BlockWithDesktopDownloads = Sanity.Block &
  DesktopReleaseTargetFields & {
    links?: Sanity.Link[];
    splitColumns?: (SplitColumnContent | null)[] | null;
  };

export function getDesktopReleaseTargetFromContent(
  value: DesktopReleaseTargetFields,
): DesktopReleaseTarget | null {
  value = stegaClean(value);
  if (!value.downloadPlatform && !value.downloadArchitecture) {
    return { ...DEFAULT_DESKTOP_RELEASE_TARGET };
  }

  if (
    !isDesktopReleasePlatform(value.downloadPlatform) ||
    !isDesktopReleaseArchitecture(value.downloadArchitecture)
  ) {
    return null;
  }

  const target = {
    platform: value.downloadPlatform,
    architecture: value.downloadArchitecture,
  };

  return isValidDesktopReleaseTarget(target) ? target : null;
}

export function collectDesktopReleaseTargets(
  blocks?: Sanity.Block[],
): DesktopReleaseTarget[] {
  const targets = new Map<DesktopReleaseTargetKey, DesktopReleaseTarget>();

  const addTarget = (value: DesktopReleaseTargetFields) => {
    const target = getDesktopReleaseTargetFromContent(value);
    if (target) targets.set(getDesktopReleaseTargetKey(target), target);
  };

  for (const block of (blocks || []) as BlockWithDesktopDownloads[]) {
    if (block._type === "desktop-download") addTarget(block);

    for (const link of block.links || []) {
      if (stegaClean(link.targetType) === "desktopDownload") addTarget(link);
    }

    if (block._type === "split-row") {
      for (const column of block.splitColumns || []) {
        if (!column?.link) continue;
        const { hasLink, isDesktopDownload } = getSplitContent(column);
        if (hasLink && isDesktopDownload) addTarget(column.link);
      }
    }
  }

  return [...targets.values()];
}

export function getDesktopReleaseFromLookup(
  releases: DesktopReleaseLookup | undefined,
  value: DesktopReleaseTargetFields,
): Sanity.DesktopRelease | null {
  const target = getDesktopReleaseTargetFromContent(value);
  return target ? releases?.[getDesktopReleaseTargetKey(target)] || null : null;
}
