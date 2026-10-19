import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateSyncTags } from "@/functions/invalidate-tags/handler";

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => mocks);
import { POST } from "@/app/api/revalidate-tags/route";

const secret = "test-only-revalidation-secret";
function request(body: unknown, authorization: string | null = `Bearer ${secret}`) {
  return new Request("https://test.invalid/api/revalidate-tags", {
    method: "POST",
    headers: authorization ? { authorization } : {},
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("sync tag revalidation endpoint", () => {
  beforeEach(() => {
    mocks.revalidateTag.mockReset();
    vi.stubEnv("SANITY_REVALIDATE_TAGS_SECRET", secret);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("expires only the affected tags and deduplicates retries", async () => {
    const result = await POST(request({ tags: ["s1:settings", "s1:post", "s1:settings"] }));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ revalidated: 2 });
    expect(mocks.revalidateTag.mock.calls).toEqual([
      ["sanity:s1:settings", { expire: 0 }],
      ["sanity:s1:post", { expire: 0 }],
    ]);
    expect(result.headers.get("cache-control")).toBe("no-store");
  });

  it.each([null, "Bearer invalid", "Basic invalid", `Bearer ${secret}extra`])(
    "rejects invalid authorization %s without invalidating", async (authorization) => {
      expect((await POST(request({ tags: ["s1:x"] }, authorization))).status).toBe(401);
      expect(mocks.revalidateTag).not.toHaveBeenCalled();
    },
  );

  it.each(["{", null, {}, { tags: [] }, { tags: [1] }, { tags: [""] },
    { tags: ["sanity:s1:x"] }, { tags: ["s1: has spaces"] }, { tags: ["x".repeat(250)] }])(
    "rejects malformed payload %j", async (body) => {
      expect((await POST(request(body))).status).toBe(400);
      expect(mocks.revalidateTag).not.toHaveBeenCalled();
    },
  );

  it("fails closed when no secret is configured", async () => {
    vi.stubEnv("SANITY_REVALIDATE_TAGS_SECRET", "");
    expect((await POST(request({ tags: ["s1:x"] }))).status).toBe(503);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("does not acknowledge partial invalidation", async () => {
    mocks.revalidateTag.mockImplementationOnce(() => {}).mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });
    expect((await POST(request({ tags: ["s1:a", "s1:b"] }))).status).toBe(500);
  });
});

function functionFixture() {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ revalidated: 1 }));
  const done = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const dependencies = {
    env: { REVALIDATE_URL: "https://preview.invalid/api/revalidate-tags", REVALIDATE_SECRET: secret },
    fetch: fetchMock,
    sleep: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
  };
  return { fetchMock, done, dependencies };
}

describe("Sanity invalidation function", () => {
  it("confirms the original sync tags only after endpoint acknowledgement", async () => {
    const { fetchMock, done, dependencies } = functionFixture();
    await invalidateSyncTags({ tags: ["s1:settings", "s1:settings"], done }, dependencies);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ tags: ["s1:settings"] });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", redirect: "error" });
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(done).toHaveBeenCalledExactlyOnceWith(["s1:settings"]);
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(done.mock.invocationCallOrder[0]);
  });

  it("retries transient network failures and rate limits", async () => {
    const { fetchMock, done, dependencies } = functionFixture();
    fetchMock.mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"))
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ revalidated: 1 }));
    await invalidateSyncTags({ tags: ["s1:x"], done }, dependencies);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(dependencies.sleep.mock.calls).toEqual([[500], [1000]]);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403])("does not retry HTTP %s or acknowledge it", async (status) => {
    const { fetchMock, done, dependencies } = functionFixture();
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(invalidateSyncTags({ tags: ["s1:x"], done }, dependencies)).rejects.toThrow("endpoint");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
  });

  it("stops after three server failures without acknowledging", async () => {
    const { fetchMock, done, dependencies } = functionFixture();
    fetchMock.mockImplementation(async () => new Response(null, { status: 503 }));
    await expect(invalidateSyncTags({ tags: ["s1:x"], done }, dependencies)).rejects.toThrow("endpoint");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(done).not.toHaveBeenCalled();
    expect(JSON.stringify(dependencies.log.mock.calls)).not.toContain(secret);
  });

  it.each(["<html>Sign in</html>", JSON.stringify({ revalidated: 2 })])(
    "does not accept an unrelated successful response", async (body) => {
      const { fetchMock, done, dependencies } = functionFixture();
      fetchMock.mockResolvedValue(new Response(body));
      await expect(invalidateSyncTags({ tags: ["s1:x"], done }, dependencies)).rejects.toThrow("acknowledgement");
      expect(done).not.toHaveBeenCalled();
    },
  );

  it("reports callback failure after bounded retries", async () => {
    const { done, dependencies } = functionFixture();
    done.mockImplementation(async () => new Response(null, { status: 500 }));
    await expect(invalidateSyncTags({ tags: ["s1:x"], done }, dependencies)).rejects.toThrow("done");
    expect(done).toHaveBeenCalledTimes(3);
    expect(dependencies.log).not.toHaveBeenCalledWith("sanity.invalidation.completed", expect.anything());
  });

  it("sends preview protection credentials only as a header", async () => {
    const { fetchMock, done, dependencies } = functionFixture();
    await invalidateSyncTags({ tags: ["s1:x"], done }, {
      ...dependencies,
      env: { ...dependencies.env, VERCEL_AUTOMATION_BYPASS_SECRET: "preview-only" },
    });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ "x-vercel-protection-bypass": "preview-only" });
  });

  it("bounds an unresponsive confirmation without reporting success", async () => {
    vi.useFakeTimers();
    try {
      const { done, dependencies } = functionFixture();
      done.mockImplementation(() => new Promise(() => {}));
      const result = invalidateSyncTags({ tags: ["s1:x"], done }, dependencies);
      const assertion = expect(result).rejects.toThrow("done");
      await vi.runAllTimersAsync();
      await assertion;
      expect(done).toHaveBeenCalledTimes(3);
      expect(dependencies.log).not.toHaveBeenCalledWith("sanity.invalidation.completed", expect.anything());
    } finally {
      vi.useRealTimers();
    }
  });
});
