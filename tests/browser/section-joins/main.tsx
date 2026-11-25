import { createRoot } from "react-dom/client";
import type { ComponentProps } from "react";

import GridRow from "@/components/ui/grid/grid-row";
import SectionHeader from "@/components/ui/section-header";
import SplitRow from "@/components/ui/split/split-row";
import { getDictionary } from "@/i18n/dictionaries";
import { getSectionJoinProps } from "@/lib/section-joins";
import "@/app/globals.css";
import "../split/styles.css";

const params = new URLSearchParams(location.search);
const locale = params.get("locale") === "en" ? "en" : "es";
document.documentElement.lang = locale;
document.documentElement.classList.toggle(
  "dark",
  params.get("theme") === "dark",
);
document.body.classList.add("font-sans");

type HeaderBlock = ComponentProps<typeof SectionHeader> & Sanity.Block;
type GridBlock = ComponentProps<typeof GridRow> & Sanity.Block;
type SplitBlock = ComponentProps<typeof SplitRow> & Sanity.Block;

function sectionHeader(overrides: Partial<HeaderBlock> = {}): HeaderBlock {
  return {
    _type: "section-header",
    _key: "header",
    title: "Encabezado de la sección",
    colorVariant: "background",
    padding: { top: false, bottom: false },
    ...overrides,
  };
}

function grid(overrides: Partial<GridBlock> = {}): GridBlock {
  return {
    _type: "grid-row",
    _key: "grid",
    colorVariant: "background",
    gridColumns: "grid-cols-2",
    padding: { top: false, bottom: false },
    columns: [
      {
        _type: "grid-card",
        _key: "card",
        title: "Tarjeta de prueba",
      } as Sanity.Block,
    ],
    ...overrides,
  };
}

function split(overrides: Partial<SplitBlock> = {}): SplitBlock {
  return {
    _type: "split-row",
    _key: "split",
    colorVariant: "background",
    padding: { top: false, bottom: false },
    splitColumns: [{ _key: "text", title: "Texto de prueba" }],
    ...overrides,
  };
}

function HeaderGrid({ id, blocks }: { id: string; blocks: [HeaderBlock, GridBlock] }) {
  const compactTop = getSectionJoinProps(blocks, 1, true).compactTop;

  return (
    <section data-testid={id}>
      <SectionHeader {...blocks[0]} locale={locale} />
      <div data-testid={`${id}-receiver`}>
        <GridRow
          {...blocks[1]}
          compactTop={compactTop}
          locale={locale}
          pricingMessages={getDictionary(locale).pricing}
        />
      </div>
    </section>
  );
}

function HeaderSplit({ id, blocks }: { id: string; blocks: [HeaderBlock, SplitBlock] }) {
  const { compactTop, trimTopInset } = getSectionJoinProps(blocks, 1, true);

  return (
    <section data-testid={id}>
      <SectionHeader {...blocks[0]} locale={locale} />
      <div data-testid={`${id}-receiver`}>
        <SplitRow
          {...blocks[1]}
          compactTop={compactTop}
          trimTopInset={trimTopInset}
          locale={locale}
        />
      </div>
    </section>
  );
}

const compactGrid = [sectionHeader(), grid()] as [HeaderBlock, GridBlock];
const compactSplit = [sectionHeader(), split()] as [HeaderBlock, SplitBlock];
const standardGrid = [
  sectionHeader(),
  grid({ padding: { top: true, bottom: false } }),
] as [HeaderBlock, GridBlock];
const standardSplit = [
  sectionHeader(),
  split({ padding: { top: true, bottom: false } }),
] as [HeaderBlock, SplitBlock];
const standardBottomSplit = [
  sectionHeader({ padding: { top: false, bottom: true } }),
  split(),
] as [HeaderBlock, SplitBlock];
const ctaGrid = [
  sectionHeader({ links: [{ title: "Ver más", href: "/features" }] }),
  grid(),
] as [HeaderBlock, GridBlock];
const colorGrid = [
  sectionHeader(),
  grid({ colorVariant: "secondary" }),
] as [HeaderBlock, GridBlock];

createRoot(document.getElementById("root")!).render(
  <main>
    <HeaderGrid id="compact-grid" blocks={compactGrid} />
    <HeaderSplit id="compact-split" blocks={compactSplit} />
    <HeaderGrid id="standard-grid" blocks={standardGrid} />
    <HeaderSplit id="standard-split" blocks={standardSplit} />
    <HeaderSplit id="standard-bottom-split" blocks={standardBottomSplit} />
    <HeaderGrid id="cta-grid" blocks={ctaGrid} />
    <HeaderGrid id="color-grid" blocks={colorGrid} />
  </main>,
);
