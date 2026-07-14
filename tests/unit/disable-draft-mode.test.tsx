import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const draftEnvironment = vi.hoisted(() => ({
  value: "checking",
}));

vi.mock("next-sanity/hooks", () => ({
  useDraftModeEnvironment: () => draftEnvironment.value,
}));

import { DisableDraftMode } from "@/components/disable-draft-mode";

describe("DisableDraftMode", () => {
  beforeEach(() => {
    draftEnvironment.value = "checking";
  });

  it("stays hidden while the visual editing environment is unresolved", () => {
    expect(
      renderToStaticMarkup(createElement(DisableDraftMode, { label: "Salir" })),
    ).toBe("");
  });

  it("stays hidden inside Presentation Tool", () => {
    draftEnvironment.value = "presentation-iframe";

    expect(
      renderToStaticMarkup(createElement(DisableDraftMode, { label: "Salir" })),
    ).toBe("");
  });

  it("renders only after confirming it is outside Presentation Tool", () => {
    draftEnvironment.value = "live";

    const html = renderToStaticMarkup(
      createElement(DisableDraftMode, { label: "Salir" }),
    );

    expect(html).toContain('href="/api/draft-mode/disable"');
    expect(html).toContain("Salir");
  });
});
