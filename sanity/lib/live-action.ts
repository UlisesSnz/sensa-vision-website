"use server";

import { revalidateTag, updateTag } from "next/cache";
import { draftMode } from "next/headers";
import { parseTags } from "next-sanity/live";

export async function sanityLiveAction(
  unsafeTags: Parameters<typeof parseTags>[0],
) {
  const { isEnabled: isDraftMode } = await draftMode();
  const { tags } = parseTags(unsafeTags);

  for (const tag of tags) {
    if (isDraftMode) {
      revalidateTag(tag, "max");
    } else {
      updateTag(tag);
    }
  }

  if (isDraftMode) return "refresh" as const;
}
