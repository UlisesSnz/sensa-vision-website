import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const output = "output/playwright/downloads";
mkdirSync(output, { recursive: true });
const report = { cases: [], errors: [], externalRequests: [] };
let server;
let browser;
try {
  server = await createServer({ configFile: "tests/browser/downloads/vite.config.mts" });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    report.externalRequests.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      for (const locale of ["es", "en"]) {
        for (const available of [false, true]) {
          await page.goto(`http://127.0.0.1:4175/?theme=${theme}&locale=${locale}&available=${available}`);
          await page.getByTestId("android").getByRole("heading", { name: "Android", exact: true }).waitFor();
          await page.evaluate(() => document.fonts.ready);
          assert(await page.getByTestId("android").getByRole("button", { name: locale === "es" ? "Próximamente" : "Coming soon" }).isDisabled());
          assert.equal(await page.getByTestId("android").locator("a").count(), 0);
          assert.deepEqual(await page.getByTestId("downloads").getByRole("heading").allTextContents(), ["Navegador web", "Android", "Windows", "Linux"]);
          for (const [testId, platform] of [["windows", "win32"], ["linux", "linux"]]) {
            const section = page.getByTestId(testId);
            if (available) {
              assert.equal(await section.getByRole("link").getAttribute("href"), `https://downloads.example.test/${platform}/x64/installer`);
            } else {
              assert(await section.getByRole("button").isDisabled());
              assert.equal(await section.getByRole("button").getAttribute("class"), await page.getByTestId("android").getByRole("button").getAttribute("class"));
            }
          }
          const installation = page.getByTestId("installation");
          assert.equal(await installation.getByRole("link", { name: "Ver descargas" }).getAttribute("href"), `/${locale}/downloads`);
          assert.equal(await page.locator("button a, a button, a a").count(), 0);
          const installationLink = installation.getByRole("link", { name: "Ver descargas" });
          await installationLink.focus();
          assert(await installationLink.evaluate((el) => el === document.activeElement));
          await page.keyboard.press("Tab");
          assert(await page.getByTestId("centered").getByRole("link").evaluate((el) => el === document.activeElement));
          await page.keyboard.press("Tab");
          assert(await page.getByTestId("centered-default").getByRole("link").evaluate((el) => el === document.activeElement));
          if (available) {
            await page.keyboard.press("Tab");
            assert(await page.getByTestId("windows").getByRole("link").evaluate((el) => el === document.activeElement));
          }
          const layout = await page.evaluate(() => {
            const rect = (el) => { const box = el.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height }; };
            const metrics = (id) => {
              const section = document.querySelector(`[data-testid="${id}"]`);
              const origin = section.getBoundingClientRect().top;
              return [...section.querySelectorAll("h2,p")].map((el) => ({ ...rect(el), top: rect(el).top - origin, bottom: rect(el).bottom - origin }));
            };
            const heading = document.querySelector('[data-testid="installation"] h2');
            const button = document.querySelector('[data-testid="installation"] a');
            const paragraphs = document.querySelectorAll('[data-testid="installation"] p');
            const centered = document.querySelector('[data-testid="centered"] a');
            const centerHeading = document.querySelector('[data-testid="centered"] h2');
            const centeredLayout = (id) => {
              const section = document.querySelector(`[data-testid="${id}"]`);
              const container = section.querySelector(".container");
              const content = container.firstElementChild;
              const box = rect(container);
              const style = getComputedStyle(container);
              return {
                content: rect(content),
                left: box.left + parseFloat(style.paddingLeft),
                right: box.right - parseFloat(style.paddingRight),
              };
            };
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              emptyHeadings: [...document.querySelectorAll("h1,h2,h3")].some((el) => !el.textContent.trim()),
              fakeLinks: document.querySelectorAll('a[href="#"]').length,
              heading: rect(heading), button: rect(button), lastParagraph: rect(paragraphs[paragraphs.length - 1]),
              centered: rect(centered), centerHeading: rect(centerHeading),
              centeredNarrow: centeredLayout("centered"),
              centeredDefault: centeredLayout("centered-default"),
              installation: metrics("installation"), baseline: metrics("baseline"),
              downloadBoxes: [...document.querySelector('[data-testid="downloads"]').children].map(rect),
            };
          });
          assert.equal(layout.overflow, false);
          assert.equal(layout.emptyHeadings, false);
          assert.equal(layout.fakeLinks, 0);
          assert.deepEqual(layout.installation, layout.baseline);
          assert(Math.abs(layout.heading.left - layout.button.left) < 1);
          assert(Math.abs(layout.button.top - layout.lastParagraph.bottom - 40) < 1);
          assert(Math.abs((layout.centered.left + layout.centered.right) - (layout.centerHeading.left + layout.centerHeading.right)) < 2);
          for (const centered of [layout.centeredNarrow, layout.centeredDefault])
            assert(Math.abs((centered.content.left + centered.content.right) - (centered.left + centered.right)) < 2);
          assert(Math.abs(layout.centeredDefault.content.left - layout.centeredDefault.left) < 1);
          assert(Math.abs(layout.centeredDefault.content.width - (layout.centeredDefault.right - layout.centeredDefault.left)) < 1);
          assert(Math.abs(layout.centeredNarrow.content.width - Math.min(768, layout.centeredNarrow.right - layout.centeredNarrow.left)) < 1);
          layout.downloadBoxes.slice(1).forEach((box, i) => assert(box.top >= layout.downloadBoxes[i].bottom));
          await page.getByRole("link", { name: "Ir a requisitos" }).click();
          assert.equal(new URL(page.url()).hash, "#requisitos");
          const anchorY = (await page.locator("#requisitos").boundingBox()).y;
          assert(anchorY >= 0 && anchorY <= 81);
          assert.equal(await page.locator("#requisitos").evaluate((el) => getComputedStyle(el).scrollMarginTop), "80px");
          if (locale === "es" && !available) {
            await installation.screenshot({ path: `${output}/installation-${width}-${theme}.png` });
            await page.getByTestId("downloads").screenshot({ path: `${output}/downloads-${width}-${theme}.png` });
          }
          report.cases.push({ width, theme, locale, available });
        }
      }
    }
  }
  await page.getByTestId("installation").getByRole("link", { name: "Ver descargas" }).click();
  assert.equal(new URL(page.url()).pathname, "/en/downloads");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  console.log(`Download regression passed: ${report.cases.length} scenarios; no external requests.`);
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await server?.close();
}
