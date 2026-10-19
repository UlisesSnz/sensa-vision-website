import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const presentationTool = vi.hoisted(() => ({
  value: null as boolean | null,
}));

vi.mock("next-sanity/hooks", () => ({
  useIsPresentationTool: () => presentationTool.value,
}));

import { DisableDraftMode } from "@/components/disable-draft-mode";

describe("DisableDraftMode", () => {
  beforeEach(() => {
    presentationTool.value = null;
  });

  it("stays hidden while the visual editing environment is unresolved", () => {
    expect(
      renderToStaticMarkup(createElement(DisableDraftMode, { label: "Salir" })),
    ).toBe("");
  });

  it("stays hidden inside Presentation Tool", () => {
    presentationTool.value = true;

    expect(
      renderToStaticMarkup(createElement(DisableDraftMode, { label: "Salir" })),
    ).toBe("");
  });

  it("renders only after confirming it is outside Presentation Tool", () => {
    presentationTool.value = false;

    const html = renderToStaticMarkup(
      createElement(DisableDraftMode, { label: "Salir" }),
    );

    expect(html).toContain('action="/api/draft-mode/disable"');
    expect(html).toContain('method="get"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('<a');
    expect(html).toContain("Salir");
  });
});
