import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Read-only browser checks against the synthetic fixtures in staging.
const [origin = "http://localhost:3000"] = process.argv.slice(2);
const hostname = new URL(origin).hostname;
assert(["localhost", "127.0.0.1"].includes(hostname) || hostname.endsWith(".vercel.app"));
if (hostname.endsWith(".vercel.app")) process.loadEnvFile(".env.cache-qa.local");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : "playwright");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const report = { origin, cases: [], errors: [] };
mkdirSync("output/playwright", { recursive: true });
try {
  for (const locale of ["es", "en"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 },
      locale: locale === "es" ? "es-MX" : "en-US", permissions: ["clipboard-read", "clipboard-write"] });
    if (hostname.endsWith(".vercel.app")) await context.route(`${origin}/**`, async route => route.continue({
      headers: { ...await route.request().allHeaders(), "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET },
    }));
    const page = await context.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    await page.goto(`${origin}/${locale}/code-qa`);
    await page.locator(".portable-code").first().waitFor();
    await page.getByRole("button", { name: "FAQ con código", exact: true }).click();
    assert.equal(await page.locator(".portable-code").count(), 11);
    assert.equal(await page.locator("a .portable-code button").count(), 0);
    for (const filename of ["card.ts", "faq.ts", "video.ts", "lottie.ts", "timeline.ts", "cta.ts", "split.ts"]) {
      assert.equal(await page.locator(".portable-code").filter({ hasText: filename }).count(), 1, filename);
    }
    const first = page.locator(".portable-code").first();
    const copy = locale === "es" ? "Copiar código" : "Copy code";
    const copied = locale === "es" ? "Código copiado" : "Code copied";
    const code = await first.locator("pre code").textContent();
    await first.getByRole("button", { name: copy, exact: true }).click();
    await first.getByRole("button", { name: copied, exact: true }).waitFor();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"), code);
    const carousel = page.locator('[aria-roledescription="carousel"]');
    const region = carousel.locator(".portable-code-scroll").first();
    await region.scrollIntoViewIfNeeded();
    const before = await carousel.locator('[aria-roledescription="slide"]').first().boundingBox();
    await region.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector('[aria-roledescription="carousel"] .portable-code-scroll').scrollLeft > 0);
    const after = await carousel.locator('[aria-roledescription="slide"]').first().boundingBox();
    assert(Math.abs(before.x - after.x) < 1, "Code scrolling must not move the carousel");
    assert.equal(await carousel.locator(".line").first().evaluate(el => getComputedStyle(el.closest("figure").parentElement).webkitLineClamp), "none");
    await page.getByText("Timeline QA", { exact: true }).scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const title = [...document.querySelectorAll("h3 span")].find(el => el.textContent === "Timeline QA");
      return title && Number(getComputedStyle(title).opacity) === 1;
    });
    assert(await page.locator("canvas").count() > 0, "Lottie player remains mounted");
    assert(await page.locator('iframe[src*="youtube"]').count() > 0, "Video player remains mounted");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ["light", "dark"]) {
        // Apply the same root class used by next-themes; rendering must need no new code markup.
        await page.evaluate(value => document.documentElement.classList.toggle("dark", value === "dark"), theme);
        await first.scrollIntoViewIfNeeded();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale}/${width}/${theme}: page overflow`);
        const foreground = await first.locator("pre span[style]").first().evaluate(el => getComputedStyle(el).color);
        assert(foreground && foreground !== "rgba(0, 0, 0, 0)");
        await page.screenshot({ path: `output/playwright/code-${locale}-${width}-${theme}.png` });
        report.cases.push({ locale, width, theme, codeBlocks: 11, foreground });
      }
    }
    await page.goto(`${origin}/${locale}/blog/code-qa`);
    const unknown = page.locator(".portable-code").filter({ hasText: "literal.html" });
    await unknown.waitFor();
    assert((await unknown.locator("pre").textContent()).includes('<script>alert("literal")</script>'));
    assert.equal(await unknown.locator("script, img").count(), 0);
    assert(await page.locator(".portable-code .highlighted").count() > 0);
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true, value: () => Promise.reject(new Error("QA clipboard denied")),
    }); });
    await unknown.getByRole("button", { name: copy, exact: true }).click();
    const errorMessage = locale === "es" ? "No se pudo copiar" : "Could not copy";
    await unknown.getByRole("status").filter({ hasText: errorMessage }).waitFor();
    assert(await unknown.getByRole("status").isVisible());
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  writeFileSync("output/playwright/code-browser.json", JSON.stringify(report, null, 2));
  await browser.close();
}
