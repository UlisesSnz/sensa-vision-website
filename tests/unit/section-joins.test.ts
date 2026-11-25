import { describe, expect, it } from "vitest";

import {
  getRenderableActionLinkKind,
  hasRenderableActionLinks,
} from "@/lib/action-links";
import {
  getSectionJoinProps,
  isCompactSectionJoin,
} from "@/lib/section-joins";

function header(overrides: Record<string, unknown> = {}) {
  return {
    _type: "section-header",
    _key: "header",
    title: "Organiza tus próximas campañas",
    colorVariant: "background",
    padding: { bottom: false },
    ...overrides,
  } as Sanity.Block;
}

function receiver(
  type = "grid-row",
  overrides: Record<string, unknown> = {},
) {
  return {
    _type: type,
    _key: `${type}-block`,
    colorVariant: "background",
    padding: { top: false },
    ...overrides,
  } as Sanity.Block;
}

describe("section joins", () => {
  it.each([undefined, null, false])(
    "treats a missing or false top padding as eligible: %j",
    (top) => {
      expect(
        isCompactSectionJoin(
          header({ padding: { bottom: false } }),
          receiver("split-row", { padding: { top } }),
          true,
        ),
      ).toBe(true);
    },
  );

  it("adds a compact top only to the immediate compatible receiver", () => {
    const blocks = [header(), receiver("split-row"), receiver("grid-row")];

    expect(getSectionJoinProps(blocks, 0, true)).toEqual({
      compactTop: false,
      trimTopInset: false,
    });
    expect(getSectionJoinProps(blocks, 1, true)).toEqual({
      compactTop: true,
      trimTopInset: true,
    });
    expect(getSectionJoinProps(blocks, 2, true)).toEqual({
      compactTop: false,
      trimTopInset: false,
    });
  });

  it("trims a receiver fallback inset after an explicit standard bottom edge", () => {
    const blocks = [
      header({ padding: { bottom: true } }),
      receiver("split-row"),
    ];

    expect(getSectionJoinProps(blocks, 1, true)).toEqual({
      compactTop: false,
      trimTopInset: true,
    });
  });

  it.each([
    ["the Header has standard bottom padding", header({ padding: { bottom: true } }), receiver()],
    ["the receiver has standard top padding", header(), receiver("grid-row", { padding: { top: true } })],
    ["backgrounds differ", header(), receiver("grid-row", { colorVariant: "secondary" })],
    ["the receiver is a Hero", header(), receiver("hero-1")],
    ["the Header is empty", header({ title: "", description: "", tagLine: "" }), receiver()],
  ])("does not compact when %s", (_reason, previous, next) => {
    expect(isCompactSectionJoin(previous, next, true)).toBe(false);
  });

  it("does not compact a Header with an action that will render", () => {
    const previous = header({
      links: [{ title: "Conocer más", href: "/features" }],
    });

    expect(isCompactSectionJoin(previous, receiver(), true)).toBe(false);
  });

  it("uses the same desktop-download rule as ActionLinks", () => {
    const desktopDownload = {
      title: "",
      targetType: "desktopDownload" as const,
    };

    expect(getRenderableActionLinkKind(desktopDownload, true)).toBe(
      "desktopDownload",
    );
    expect(getRenderableActionLinkKind(desktopDownload, false)).toBeNull();
    expect(hasRenderableActionLinks([desktopDownload], true)).toBe(true);
    expect(
      isCompactSectionJoin(
        header({ links: [desktopDownload] }),
        receiver(),
        true,
      ),
    ).toBe(false);
  });
});
