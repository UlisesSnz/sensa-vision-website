import { createRoot } from "react-dom/client";
import SplitRow from "@/components/ui/split/split-row";
import SectionHeader from "@/components/ui/section-header";
import {
  designColumn,
  designRow,
  editorImage,
  followingFeatures,
  legacyColumn,
  splitParagraph,
} from "@/tests/fixtures/split-row";
import type { SplitColumnContent } from "@/lib/split-content";
import { getDictionary } from "@/i18n/dictionaries";
import { releaseFixture } from "@/tests/fixtures/downloads";
import "@/app/globals.css";
import "./styles.css";

const params = new URLSearchParams(location.search);
const locale = params.get("locale") === "en" ? "en" : "es";
const desktopLink = {
  title: "Descargar SensaVision",
  targetType: "desktopDownload",
  downloadPlatform: "win32",
  downloadArchitecture: "x64",
  buttonVariant: "outline",
} satisfies Sanity.Link;
document.documentElement.lang = locale;
document.documentElement.classList.toggle(
  "dark",
  params.get("theme") === "dark",
);
document.body.classList.add("font-sans");
const widthCases = (["default", "narrow"] as const).flatMap((sectionWidth) =>
  (["default", "narrow"] as const).flatMap((contentWidth) =>
    (["left", "center"] as const).map((stackAlign) => ({
      id: `${sectionWidth}-${contentWidth}-${stackAlign}`,
      column: {
        ...designColumn,
        sectionWidth,
        contentWidth,
        stackAlign,
        link: legacyColumn.link,
      },
    })),
  ),
);
const cases: Array<{ id: string; column: SplitColumnContent }> = [
  ...widthCases,
  { id: "legacy-right", column: legacyColumn },
  { id: "legacy-left", column: { ...legacyColumn, position: true } },
  {
    id: "horizontal-contain",
    column: { ...legacyColumn, imageFit: "contain" },
  },
  ...[false, true].flatMap((position) => [
    {
      id: `horizontal-design-${position ? "left" : "right"}`,
      column: { ...designColumn, layout: "horizontal" as const, position },
    },
    {
      id: `horizontal-short-${position ? "left" : "right"}`,
      column: {
        ...designColumn,
        layout: "horizontal" as const,
        position,
        title: "Diseños",
        body: undefined,
      },
    },
    {
      id: `horizontal-long-${position ? "left" : "right"}`,
      column: {
        ...designColumn,
        layout: "horizontal" as const,
        position,
        body: [
          ...(Array.isArray(designColumn.body) ? designColumn.body : []),
          splitParagraph(
            "Actualiza tus diseños cuando lo necesites y conserva una presentación consistente en todas las pantallas de tu negocio.",
            "additional",
          ),
        ],
      },
    },
  ]),
  {
    id: "vertical-cover",
    column: { ...legacyColumn, layout: "vertical", position: true },
  },
  {
    id: "no-dimensions",
    column: {
      ...designColumn,
      image: {
        ...editorImage,
        asset: { ...editorImage.asset, metadata: undefined },
      } as Sanity.Image,
    },
  },
  { id: "image-only", column: { image: editorImage, imageFit: "contain" } },
  { id: "text-only", column: { title: "Solo texto", body: legacyColumn.body } },
  { id: "link-only", column: { layout: "vertical", link: legacyColumn.link } },
  ...(["horizontal", "vertical"] as const).map((layout) => ({
    id: `desktop-${layout}`,
    column: {
      ...designColumn,
      layout,
      stackAlign: "center" as const,
      link: desktopLink,
    },
  })),
  {
    id: "desktop-unavailable",
    column: { link: { ...desktopLink, downloadPlatform: "darwin" } },
  },
  {
    id: "desktop-cleared",
    column: { link: { ...desktopLink, title: "" } },
  },
];

createRoot(document.getElementById("root")!).render(
  <>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95">
      <nav className="container flex h-16 items-center justify-between">
        <span>SensaVision</span>
        <a href="#diseno">Ir a diseño</a>
      </nav>
    </header>
    <main>
      <div className="container py-16">
        <h1>Producto</h1>
      </div>
      <div data-testid="feature-sequence">
        <SplitRow {...designRow} locale={locale} />
        {followingFeatures.map((feature) => (
          <SectionHeader
            key={feature.title}
            {...feature}
            sectionWidth="narrow"
            stackAlign="left"
            colorVariant="background"
            padding={{ top: true, bottom: true }}
            locale={locale}
          />
        ))}
      </div>
      {cases.map(({ id, column }) => (
        <section data-testid={id} key={id}>
          <SplitRow
            padding={{ top: true, bottom: true }}
            splitColumns={[column]}
            locale={locale}
            downloadMessages={getDictionary(locale).downloads}
            desktopReleases={{
              "win32/x64": releaseFixture({
                platform: "win32",
                architecture: "x64",
              }),
            }}
          />
        </section>
      ))}
      <section data-testid="primary">
        <SplitRow {...designRow} uid="primary" colorVariant="primary" />
      </section>
      <section data-testid="mixed">
        <SplitRow
          padding={{ top: true, bottom: true }}
          splitColumns={[designColumn, legacyColumn]}
        />
      </section>
      <section data-testid="vertical-pair">
        <SplitRow
          padding={{ top: true, bottom: true }}
          splitColumns={[
            designColumn,
            {
              ...designColumn,
              _key: "vertical-pair-second",
              title: "Tu biblioteca de recursos",
              body: [
                splitParagraph(
                  "Reúne los archivos de tu proyecto en la Biblioteca.",
                  "vertical-pair-body",
                ),
              ],
            },
          ]}
        />
      </section>
      <section data-testid="empty">
        <SplitRow
          uid="empty"
          padding={{ top: true, bottom: true }}
          splitColumns={[{}, { title: "  " }, { link: { href: "/features" } }]}
        />
      </section>
    </main>
  </>,
);
