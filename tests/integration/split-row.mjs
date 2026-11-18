import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const output = "output/playwright/split";
mkdirSync(output, { recursive: true });
const report = { cases: [], errors: [], externalRequests: [] };
const near = (actual, expected, message) =>
  assert(
    Math.abs(actual - expected) < 2,
    `${message}: ${actual} vs ${expected}`,
  );
let server;
let browser;
try {
  server = await createServer({
    configFile: "tests/browser/split/vite.config.mts",
  });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    window.addEventListener("error", (event) => {
      if (event.error?.cause)
        console.error(
          "Split fixture cause:",
          event.error.cause.stack || event.error.cause.message,
        );
    });
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    report.externalRequests.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().startsWith("Split fixture cause:")
    )
      report.errors.push(message.text());
  });
  for (const width of [375, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      for (const locale of ["es", "en"]) {
        const address = `http://127.0.0.1:4176/?theme=${theme}&locale=${locale}`;
        await page.goto(address);
        await page
          .getByRole("heading", { name: "Producto", exact: true })
          .waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
          // Load off-screen variants before measuring and taking screenshots.
          await Promise.all(
            [...document.images].map(async (image) => {
              image.loading = "eager";
              await image.decode();
            }),
          );
        });
        const metrics = await page.evaluate(() => {
          const rect = (el) => {
            const r = el.getBoundingClientRect();
            return {
              top: r.top,
              bottom: r.bottom,
              left: r.left,
              right: r.right,
              width: r.width,
              height: r.height,
            };
          };
          const split = document.querySelector("#diseno");
          const sequence = document.querySelector(
            '[data-testid="feature-sequence"]',
          );
          const headings = [...sequence.querySelectorAll("h2")];
          const image = split.querySelector("img");
          const paragraph = split.querySelector("p");
          const measure = (id) => {
            const el = document.querySelector(`[data-testid="${id}"]`);
            const img = el.querySelector("img");
            const h = el.querySelector("h2,h3");
            const p = el.querySelector("p");
            return {
              image: img ? rect(img) : null,
              heading: h ? rect(h) : null,
              text: h ? rect(h.parentElement.parentElement) : null,
              paragraph: p ? rect(p) : null,
              fit: img ? getComputedStyle(img).objectFit : null,
              align: h ? getComputedStyle(h).textAlign : null,
              tag: h?.tagName,
            };
          };
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            emptyHeadings: [...document.querySelectorAll("h2,h3")].some(
              (h) => !h.textContent.trim(),
            ),
            emptyChildren: document.querySelector('[data-testid="empty"]')
              .children.length,
            headings: headings.map((h) => h.textContent),
            headingBoxes: headings.map(rect),
            image: rect(image),
            paragraph: rect(paragraph),
            original: {
              width: image.naturalWidth,
              height: image.naturalHeight,
            },
            paragraphMargins: [
              paragraph,
              ...sequence.querySelectorAll(":scope > :not(#diseno) p"),
            ].map((p) => ({
              font: getComputedStyle(p).fontFamily,
              size: getComputedStyle(p).fontSize,
              line: getComputedStyle(p).lineHeight,
            })),
            headingFonts: headings.map((h) => ({
              font: getComputedStyle(h).fontFamily,
              size: getComputedStyle(h).fontSize,
              weight: getComputedStyle(h).fontWeight,
            })),
            paddingBottom: parseFloat(getComputedStyle(split).paddingBottom),
            nextPaddingTop: parseFloat(
              getComputedStyle(sequence.children[1]).paddingTop,
            ),
            cases: Object.fromEntries(
              [...document.querySelectorAll("section[data-testid]")]
                .filter(
                  (s) =>
                    !["primary", "mixed", "empty"].includes(s.dataset.testid),
                )
                .map((s) => [s.dataset.testid, measure(s.dataset.testid)]),
            ),
            mixed: [
              ...document.querySelector(
                '[data-testid="mixed"] > div > .container > div',
              ).children,
            ].map(rect),
            verticalPair: (() => {
              const pair = document.querySelector(
                '[data-testid="vertical-pair"] > div > .container > div',
              );
              const [first, second] = pair.children;
              return {
                firstImage: rect(first.querySelector("img")),
                secondHeading: rect(second.querySelector("h2,h3")),
              };
            })(),
          };
        });
        assert.equal(metrics.overflow, false);
        assert.equal(metrics.emptyHeadings, false);
        assert.equal(metrics.emptyChildren, 0);
        assert.deepEqual(metrics.headings, [
          "Diseños con el estilo de tu negocio",
          "Dale voz a tus mensajes",
          "El contenido adecuado para cada horario",
        ]);
        assert(metrics.original.width > 0 && metrics.original.height > 0);
        near(
          metrics.original.height,
          (metrics.original.width * 1654) / 3190,
          "Density-adjusted intrinsic ratio",
        );
        near(
          metrics.image.height,
          (metrics.image.width * 1654) / 3190,
          "Natural image ratio",
        );
        near(
          metrics.image.top - metrics.paragraph.bottom,
          width >= 1280 ? 80 : 64,
          "Internal spacing",
        );
        near(
          metrics.headingBoxes[1].top - metrics.image.bottom,
          metrics.paddingBottom + metrics.nextPaddingTop,
          "Section separation",
        );
        near(
          metrics.headingBoxes[0].left,
          metrics.headingBoxes[1].left,
          "Neighbor heading alignment",
        );
        assert.deepEqual(metrics.headingFonts[0], metrics.headingFonts[1]);
        assert.deepEqual(
          metrics.paragraphMargins[0],
          metrics.paragraphMargins[1],
        );
        near(
          metrics.mixed[1].top - metrics.mixed[0].bottom,
          width >= 1280 ? 80 : 64,
          "Mixed row spacing",
        );
        near(
          metrics.verticalPair.secondHeading.top -
            metrics.verticalPair.firstImage.bottom,
          width >= 1280 ? 160 : 128,
          "Vertical feature separation",
        );
        for (const sectionWidth of ["default", "narrow"]) {
          for (const contentWidth of ["default", "narrow"]) {
            const left = metrics.cases[`${sectionWidth}-${contentWidth}-left`];
            const center =
              metrics.cases[`${sectionWidth}-${contentWidth}-center`];
            const expectedImageWidth =
              sectionWidth === "narrow"
                ? Math.min(768, metrics.image.width)
                : metrics.image.width;
            near(left.image.width, expectedImageWidth, "Section width");
            near(
              left.text.width,
              contentWidth === "narrow"
                ? Math.min(768, expectedImageWidth)
                : expectedImageWidth,
              "Content width",
            );
            near(
              left.image.width,
              center.image.width,
              "Alignment leaves image width unchanged",
            );
            near(
              left.text.width,
              center.text.width,
              "Alignment leaves text width unchanged",
            );
            assert(["left", "start"].includes(left.align));
            assert.equal(center.align, "center");
          }
        }
        for (const id of ["legacy-left", "legacy-right"]) {
          const item = metrics.cases[id];
          assert.equal(item.tag, "H3");
          assert.equal(item.fit, "cover");
          near(
            item.image.height,
            width >= 1024 ? 480 : width >= 768 ? 400 : 240,
            "Legacy image height",
          );
          if (width < 1024) assert(item.image.bottom <= item.heading.top);
          else
            assert(
              id === "legacy-left"
                ? item.heading.right <= item.image.left
                : item.image.right <= item.heading.left,
            );
        }
        for (const id of [
          "horizontal-contain",
          "image-only",
          "horizontal-design-left",
          "horizontal-design-right",
          "horizontal-short-left",
          "horizontal-short-right",
          "horizontal-long-left",
          "horizontal-long-right",
        ]) {
          const item = metrics.cases[id];
          near(
            item.image.height,
            (item.image.width * 1654) / 3190,
            "Contain variant ratio",
          );
          if (id === "horizontal-contain" && width >= 1024) {
            near(
              item.text.top + item.text.height / 2,
              item.image.top + item.image.height / 2,
              "Horizontal center includes the label and link",
            );
          }
        }
        for (const length of ["design", "short", "long"]) {
          for (const side of ["left", "right"]) {
            const item = metrics.cases[`horizontal-${length}-${side}`];
            if (width >= 1024) {
              near(
                item.text.top + item.text.height / 2,
                item.image.top + item.image.height / 2,
                "Horizontal text and full image share the same vertical center",
              );
              if (length === "short")
                assert(item.image.height > item.text.height);
              if (length === "long")
                assert(item.text.height > item.image.height);
              assert(
                side === "left"
                  ? item.heading.right <= item.image.left
                  : item.image.right <= item.heading.left,
              );
            } else {
              near(
                item.heading.top - item.image.bottom,
                24,
                "Horizontal mobile spacing",
              );
            }
          }
        }
        near(
          metrics.cases["image-only"].image.width,
          metrics.image.width,
          "Image-only full width",
        );
        assert.equal(metrics.cases["no-dimensions"].fit, "contain");
        assert.equal(metrics.cases["vertical-cover"].fit, "cover");
        assert(
          metrics.cases["vertical-cover"].image.top >=
            metrics.cases["vertical-cover"].paragraph.bottom,
        );
        assert.equal(await page.locator("a a, button a, a button").count(), 0);
        for (const layout of ["horizontal", "vertical"]) {
          const download = page
            .getByTestId(`desktop-${layout}`)
            .getByRole("link", { name: "Descargar SensaVision" });
          assert(await download.isVisible());
          assert.equal(
            await download.getAttribute("href"),
            "https://downloads.example.test/win32/x64/installer",
          );
          assert.equal(await download.getAttribute("download"), "");
          await download.focus();
          assert(
            await download.evaluate((el) => el === document.activeElement),
          );
          const buttonBox = await download.boundingBox();
          const item = metrics.cases[`desktop-${layout}`];
          if (layout === "horizontal" && width >= 1024) {
            near(
              item.text.top + item.text.height / 2,
              item.image.top + item.image.height / 2,
              "Desktop link stays inside the centered text block",
            );
          }
          if (layout === "vertical") {
            const imageBox = await page
              .getByTestId(`desktop-${layout}`)
              .locator("img")
              .boundingBox();
            near(
              buttonBox.x + buttonBox.width / 2,
              imageBox.x + imageBox.width / 2,
              "Desktop button follows centered text alignment",
            );
            near(
              imageBox.y - (buttonBox.y + buttonBox.height),
              width >= 1280 ? 80 : 64,
              "Desktop button to image spacing",
            );
          }
        }
        assert(
          await page
            .getByTestId("desktop-unavailable")
            .getByRole("button", {
              name: locale === "es" ? "Próximamente" : "Coming soon",
            })
            .isDisabled(),
        );
        assert.equal(
          await page
            .getByTestId("desktop-unavailable")
            .getByRole("link")
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByTestId("desktop-cleared")
            .locator(":scope > *")
            .count(),
          0,
        );
        const variantLink = page
          .getByTestId("default-default-left")
          .getByRole("link", { name: "Ver producto" });
        assert.equal(
          await variantLink.getAttribute("href"),
          `/${locale}/features#diseno`,
        );
        await variantLink.focus();
        assert(
          await variantLink.evaluate((el) => el === document.activeElement),
        );
        await page.keyboard.press("Tab");
        assert(
          await page
            .getByTestId("default-default-center")
            .getByRole("link")
            .evaluate((el) => el === document.activeElement),
        );
        await page.getByRole("link", { name: "Ir a diseño" }).click();
        assert.equal(new URL(page.url()).hash, "#diseno");
        const anchorY = (await page.locator("#diseno").boundingBox()).y;
        near(anchorY, 80, "Anchor offset below sticky header");
        if (locale === "es") {
          if (width === 375 || width === 1280) {
            for (const layout of ["horizontal", "vertical", "unavailable"]) {
              await page
                .getByTestId(`desktop-${layout}`)
                .screenshot({
                  path: `${output}/desktop-${layout}-${width}-${theme}.png`,
                });
            }
          }
          await page
            .getByTestId("feature-sequence")
            .screenshot({ path: `${output}/features-${width}-${theme}.png` });
          if (width === 375 || width === 1280)
            await page
              .getByTestId("legacy-left")
              .screenshot({ path: `${output}/legacy-${width}-${theme}.png` });
          if (width === 375 || width === 1280)
            await page
              .getByTestId("vertical-pair")
              .screenshot({
                path: `${output}/vertical-pair-${width}-${theme}.png`,
              });
          if (width === 375 || width === 1280 || width === 1440) {
            for (const side of ["left", "right"]) {
              await page.getByTestId(`horizontal-design-${side}`).screenshot({
                path: `${output}/horizontal-design-${side}-${width}-${theme}.png`,
              });
              if (width === 1280) {
                for (const length of ["short", "long"]) {
                  await page
                    .getByTestId(`horizontal-${length}-${side}`)
                    .screenshot({
                      path: `${output}/horizontal-${length}-${side}-${width}-${theme}.png`,
                    });
                }
              }
            }
          }
        }
        await page.goto(`${address}#diseno`);
        await page.locator("#diseno").waitFor();
        await page.waitForFunction(
          () =>
            Math.abs(
              document.getElementById("diseno").getBoundingClientRect().top -
                80,
            ) < 2,
        );
        report.cases.push({ width, theme, locale });
      }
    }
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  console.log(
    `Split Row regression passed: ${report.cases.length} scenarios; no external requests.`,
  );
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await server?.close();
}
