import { beforeEach, describe, expect, it, vi } from "vitest";

const liveMocks = vi.hoisted(() => ({
  draftMode: vi.fn(),
  parseTags: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: liveMocks.revalidateTag,
  updateTag: liveMocks.updateTag,
}));

vi.mock("next/headers", () => ({
  draftMode: liveMocks.draftMode,
}));

vi.mock("next-sanity/live", () => ({
  parseTags: liveMocks.parseTags,
}));

import { sanityLiveAction } from "@/sanity/lib/live-action";

describe("sanityLiveAction", () => {
  beforeEach(() => {
    liveMocks.draftMode.mockReset();
    liveMocks.parseTags.mockReset();
    liveMocks.revalidateTag.mockReset();
    liveMocks.updateTag.mockReset();
    liveMocks.parseTags.mockReturnValue({
      tags: ["sanity:document", "sanity:settings"],
    });
  });

  it("updates published cache tags immediately", async () => {
    liveMocks.draftMode.mockResolvedValue({ isEnabled: false });

    const result = await sanityLiveAction(["unsafe-tag"] as never);

    expect(liveMocks.updateTag).toHaveBeenCalledTimes(2);
    expect(liveMocks.updateTag).toHaveBeenNthCalledWith(1, "sanity:document");
    expect(liveMocks.updateTag).toHaveBeenNthCalledWith(2, "sanity:settings");
    expect(liveMocks.revalidateTag).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("refreshes Draft Mode without touching published caches", async () => {
    liveMocks.draftMode.mockResolvedValue({ isEnabled: true });

    const result = await sanityLiveAction(["unsafe-tag"] as never);

    expect(liveMocks.revalidateTag).not.toHaveBeenCalled();
    expect(liveMocks.parseTags).not.toHaveBeenCalled();
    expect(liveMocks.updateTag).not.toHaveBeenCalled();
    expect(result).toBe("refresh");
  });
});
