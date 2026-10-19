import { parseSyncTags } from "../../lib/sanity-sync-tags";

type Environment = {
  REVALIDATE_URL?: string;
  REVALIDATE_SECRET?: string;
  VERCEL_AUTOMATION_BYPASS_SECRET?: string;
};

type Dependencies = {
  env: Environment;
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  log: (message: string, data: Record<string, number | string>) => void;
};

class RequestFailure extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function confirmWithTimeout(done: () => Promise<Response>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      done(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Confirmation timed out")), 3_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function retry(
  operation: () => Promise<Response>,
  stage: string,
  dependencies: Dependencies,
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await operation();
      if (!response.ok) throw new RequestFailure(response.status);
      return response;
    } catch (error) {
      const status = error instanceof RequestFailure ? error.status : 0;
      const transient = status === 0 || status === 429 || status >= 500;
      dependencies.log("sanity.invalidation.attempt_failed", { stage, attempt, status });
      if (!transient || attempt === 3) {
        // Do not include response bodies, URLs, or request headers in logs.
        throw new Error(`Sanity invalidation failed at ${stage} (HTTP ${status})`);
      }
      await dependencies.sleep(attempt * 500);
    }
  }
  throw new Error("Unreachable retry state");
}

export async function invalidateSyncTags(
  input: { tags: unknown; done: (tags: string[]) => Promise<Response> },
  dependencies: Dependencies = {
    env: {
      REVALIDATE_URL: process.env.REVALIDATE_URL,
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
      VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    },
    fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log: (message, data) => console.info(message, data),
  },
) {
  const startedAt = Date.now();
  const tags = parseSyncTags(input.tags);
  const { REVALIDATE_URL, REVALIDATE_SECRET, VERCEL_AUTOMATION_BYPASS_SECRET } = dependencies.env;
  if (!tags) throw new Error("Invalid Content Lake sync tags");
  if (!REVALIDATE_URL || !REVALIDATE_SECRET) {
    throw new Error("Missing REVALIDATE_URL or REVALIDATE_SECRET");
  }
  const url = new URL(REVALIDATE_URL);
  if (
    url.username || url.password || url.search ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  ) {
    throw new Error("Invalid revalidation endpoint URL");
  }

  const response = await retry(
    () => dependencies.fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
      headers: {
        authorization: `Bearer ${REVALIDATE_SECRET}`,
        "content-type": "application/json",
        ...(VERCEL_AUTOMATION_BYPASS_SECRET
          ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET }
          : {}),
      },
      body: JSON.stringify({ tags }),
    }),
    "endpoint",
    dependencies,
  );
  // A login page or an unrelated 2xx response must never release live events.
  const result = await response.json().catch(() => null);
  if (result?.revalidated !== tags.length) {
    throw new Error("Invalid revalidation acknowledgement");
  }
  await retry(() => confirmWithTimeout(() => input.done(tags)), "done", dependencies);
  dependencies.log("sanity.invalidation.completed", {
    tagCount: tags.length,
    tags: tags.join(","),
    durationMs: Date.now() - startedAt,
  });
}
