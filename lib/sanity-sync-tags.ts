// Content Lake sends raw sync tags. Next.js stores them with this prefix.
export const SANITY_CACHE_TAG_PREFIX = "sanity:";

export function parseSyncTags(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every(
      (tag) =>
        typeof tag === "string" &&
        tag.length > 0 &&
        tag.length <= 256 - SANITY_CACHE_TAG_PREFIX.length &&
        !/\s/.test(tag) &&
        !tag.startsWith(SANITY_CACHE_TAG_PREFIX),
    )
  ) {
    return null;
  }

  return [...new Set(value as string[])];
}
