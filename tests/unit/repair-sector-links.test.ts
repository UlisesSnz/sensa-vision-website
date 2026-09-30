import { describe, expect, it } from "vitest";
import {
  buildRepairPlan,
  REPAIR_TARGETS,
  verifyRepairOutcome,
} from "@/scripts/repair-sector-links.mjs";

const approvedCopy =
  "Organiza horarios, actividades y comunicaciones internas. Define cuándo se muestra cada pieza y elige qué mostrar fuera del horario de reproducción.";

function fixtures() {
  return REPAIR_TARGETS.flatMap((target) => {
    const document = {
      _id: target.id,
      _type: "page",
      _rev: "reviewed-revision",
      language: "es",
      slug: { current: target.slug },
      blocks: [
        {
          _key: target.rowKey,
          _type: "grid-row",
          columns: [
            ...target.cardKeys.map((_key) => ({
              _key,
              _type: "grid-card",
              title: "Approved title",
              excerpt: approvedCopy,
              image: { asset: { _ref: "image-preserved" } },
              link: { _type: "link", buttonVariant: "default" } as
                Record<string, unknown> | undefined,
            })),
            {
              _key: "complete-link",
              _type: "grid-card",
              title: "Approved title",
              excerpt: approvedCopy,
              image: { asset: { _ref: "image-preserved" } },
              link: {
                _type: "link",
                title: "Ver funciones y requisitos",
                href: "/es/features",
              },
            },
          ],
        },
      ],
    };
    return [
      document,
      { ...structuredClone(document), _id: target.id.replace(/^drafts\./, "") },
    ];
  });
}

function repaired(documents: ReturnType<typeof fixtures>) {
  const copy = structuredClone(documents);
  for (const target of REPAIR_TARGETS) {
    const document = copy.find((item) => item._id === target.id)!;
    for (const card of document.blocks[0].columns) {
      if (target.cardKeys.includes(card._key)) delete card.link;
    }
  }
  return copy;
}

describe("issue #2 scoped data repair", () => {
  it("plans exactly 10 field removals in four drafts with revision guards", () => {
    const documents = fixtures();
    const original = structuredClone(documents);
    const plan = buildRepairPlan(documents);
    expect(plan).toHaveLength(4);
    expect(plan.flatMap((patch) => patch.unset)).toHaveLength(10);
    for (const patch of plan) {
      expect(patch.id).toMatch(/^drafts\./);
      expect(patch.ifRevisionID).toBe("reviewed-revision");
      expect(Object.keys(patch).sort()).toEqual([
        "id",
        "ifRevisionID",
        "unset",
      ]);
      expect(
        patch.unset.every(
          (field) => field.endsWith("].link") && field.includes("_key=="),
        ),
      ).toBe(true);
    }
    expect(documents).toEqual(original);
  });

  it.each([
    { _type: "link", title: "New partial link" },
    { _type: "link", href: "/es/features" },
    { _type: "link", title: "Complete", href: "/es/features" },
    { _type: "link", targetType: "desktopDownload" },
    { _type: "link", buttonVariant: "default", unknown: "preserve" },
  ])("aborts instead of deleting an edited link: %j", (link) => {
    const documents = fixtures();
    documents[0].blocks[0].columns[0].link = link;
    expect(() => buildRepairPlan(documents)).toThrow("ya no está vacío");
  });

  it("rejects missing or duplicate card keys and unexpected document languages", () => {
    const documents = fixtures();
    documents[0].blocks[0].columns.push(
      structuredClone(documents[0].blocks[0].columns[0]),
    );
    expect(() => buildRepairPlan(documents)).toThrow("única tarjeta");
    documents[0].blocks[0].columns.pop();
    documents[0].language = "en";
    expect(() => buildRepairPlan(documents)).toThrow("no coincide");
    expect(() => buildRepairPlan(fixtures().slice(1))).toThrow("no coincide");
  });

  it("is idempotent and preserves text, images, complete links and published documents", () => {
    const before = fixtures();
    const after = repaired(before);
    expect(buildRepairPlan(after)).toEqual([]);
    expect(() => verifyRepairOutcome(before, after)).not.toThrow();
    expect(after[0].blocks[0].columns[0].excerpt).toBe(approvedCopy);
    expect(after[1]).toEqual(before[1]);
    expect(after[0].blocks[0].columns.at(-1)).toEqual(
      before[0].blocks[0].columns.at(-1),
    );
  });

  it("detects additional edits in a draft or published document during verification", () => {
    const before = fixtures();
    for (const index of [0, 1]) {
      const after = repaired(before);
      after[index].blocks[0].columns[0].excerpt = "Unexpected edit";
      expect(() => verifyRepairOutcome(before, after)).toThrow(
        "diferencias adicionales",
      );
    }
  });
});
