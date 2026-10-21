import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";
import { pricingCases } from "../fixtures/pricing-card.mjs";
import { assertPricingLayout } from "../browser/pricing/assert-layout.mjs";

const output = "output/playwright/pricing";
mkdirSync(output, { recursive: true });
const report = { cases: [], errors: [] };
let server;
let browser;
try {
  server = await createServer({ configFile: "tests/browser/pricing/vite.config.mts" });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  for (const width of [1180, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page.goto(`http://127.0.0.1:4174/?theme=${theme}`);
      await page.getByRole("heading", { name: "Pantallas adicionales", exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const scenario of pricingCases) {
        const section = page.getByTestId(scenario.id);
        await section.screenshot({ path: `${output}/${scenario.id}-${width}-${theme}.png` });
        const layout = await assertPricingLayout(page, section);
        scenario.cards.forEach((card, index) => {
          assert.equal(layout[index].title.text, card.title);
          assert.equal(layout[index].badge?.text ?? "", card.tagLine ?? "");
        });
        const links = await section.getByRole("link").evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
        assert.deepEqual(links, Array(3).fill(`/${scenario.locale}/contact`));
        report.cases.push({ scenario: scenario.id, width, theme });
      }
      // Short content should still share a row when it fits.
      const short = await assertPricingLayout(page, page.getByTestId("edge-cases"));
      assert(Math.abs(short[0].title.box.top - short[0].badge.box.top) <= 1);
      const billing = page.getByTestId("without-badge");
      await billing.getByRole("button", { name: "Anual", exact: true }).click();
      assert(await billing.getByText("$3,576 MXN", { exact: true }).isVisible());
      await billing.getByRole("button", { name: "Mensual", exact: true }).click();
      assert(await billing.getByText("$298 MXN", { exact: true }).isVisible());
    }
  }
  assert.deepEqual(report.errors, []);
  console.log(`Pricing regression passed: ${report.cases.length} layout scenarios, billing toggles and localized links.`);
} catch (error) {
  report.errors.push(error.message);
  throw error;
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await server?.close();
}
