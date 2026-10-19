import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { parseSyncTags, SANITY_CACHE_TAG_PREFIX } from "@/lib/sanity-sync-tags";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_TAGS_SECRET;
  if (!secret) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 503 });
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const tags = parseSyncTags(
    body && typeof body === "object" && "tags" in body ? body.tags : undefined,
  );
  if (!tags) {
    return Response.json({ error: "Invalid sync tags" }, { status: 400 });
  }

  try {
    for (const tag of tags) {
      revalidateTag(`${SANITY_CACHE_TAG_PREFIX}${tag}`, { expire: 0 });
    }
  } catch {
    console.error("sanity.revalidation.failed", { tagCount: tags.length });
    return Response.json({ error: "Revalidation failed" }, { status: 500 });
  }

  console.info("sanity.revalidation.completed", { tagCount: tags.length, tags });
  return Response.json(
    { revalidated: tags.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
