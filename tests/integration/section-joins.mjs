import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const near = (actual, expected, message) =>
  assert(
    Math.abs(actual - expected) < 2,
    `${message}: ${actual} vs ${expected}`,
  );

let server;
let browser;

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const edge =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (!existsSync(edge)) throw error;
    return chromium.launch({ executablePath: edge, headless: true });
  }
}

try {
  server = await createServer({
    configFile: "tests/browser/section-joins/vite.config.mts",
  });
  await server.listen();
  browser = await launchBrowser();
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const externalRequests = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    externalRequests.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const width of [375, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1200 });
    for (const theme of ["light", "dark"]) {
      for (const locale of ["es", "en"]) {
        await page.goto(
          `http://127.0.0.1:4177/?theme=${theme}&locale=${locale}`,
        );
        await page
          .getByRole("heading", { name: "Encabezado de la sección" })
          .first()
          .waitFor();
        await page.evaluate(async () => document.fonts.ready);

        const metrics = await page.evaluate(() => {
          const rect = (element) => {
            const box = element.getBoundingClientRect();
            return { top: box.top, bottom: box.bottom };
          };
          const gap = (id, target) => {
            const section = document.querySelector(`[data-testid="${id}"]`);
            const header = section.querySelector("h2");
            const receiver = document.querySelector(
              `[data-testid="${id}-receiver"]`,
            );
            const next = receiver.querySelector(target);
            return rect(next).top - rect(header).bottom;
          };
          const paddingTop = (id) => {
            const receiver = document.querySelector(
              `[data-testid="${id}-receiver"]`,
            );
            return parseFloat(getComputedStyle(receiver.firstElementChild).paddingTop);
          };

          return {
            compactGrid: gap("compact-grid", ".border"),
            compactSplit: gap("compact-split", "h3"),
            standardGrid: gap("standard-grid", ".border"),
            standardSplit: gap("standard-split", "h3"),
            standardBottomSplit: gap("standard-bottom-split", "h3"),
            ctaPaddingTop: paddingTop("cta-grid"),
            colorPaddingTop: paddingTop("color-grid"),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });

        near(metrics.compactGrid, 24, "Grid compact join");
        near(metrics.compactSplit, 24, "Split compact join");
        near(
          metrics.standardGrid,
          width >= 1280 ? 80 : 64,
          "Grid standard join",
        );
        near(
          metrics.standardSplit,
          width >= 1280 ? 80 : 64,
          "Split standard join",
        );
        near(
          metrics.standardBottomSplit,
          width >= 1280 ? 80 : 64,
          "Split preceding standard join",
        );
        assert.equal(metrics.ctaPaddingTop, 0);
        assert.equal(metrics.colorPaddingTop, 0);
        assert.equal(metrics.overflow, false);
      }
    }
  }

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalRequests, []);
  console.log("Section join regression passed: 20 visual scenarios.");
} finally {
  await browser?.close();
  await server?.close();
}
