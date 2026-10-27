import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const output = "output/playwright/split-editor";
mkdirSync(output, { recursive: true });
const report = { cases: [], errors: [], blockedRequests: [], localMocks: [] };
let server;
let browser;
let page;
try {
  server = await createServer({
    configFile: "tests/browser/split-editor/vite.config.mts",
  });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 1100 },
    reducedMotion: "reduce",
  });
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() === "GET" &&
      url.origin === "http://127.0.0.1:4177" &&
      /^\/api-disabled\/v[\d-]+\/projects\/localqa\/grants$/.test(url.pathname)
    ) {
      report.localMocks.push("project-grants");
      return route.fulfill({ json: {} });
    }
    if (
      request.method() === "GET" &&
      url.origin === "https://design-system-static.sanity.io" &&
      url.pathname.endsWith(".woff2")
    ) {
      report.localMocks.push("studio-font");
      return route.fulfill({
        path: "app/fonts/inter-latin.woff2",
        contentType: "font/woff2",
      });
    }
    if (
      url.origin === "http://127.0.0.1:4177" &&
      request.method() === "GET" &&
      !url.pathname.startsWith("/api-disabled")
    ) {
      return route.continue();
    }
    report.blockedRequests.push({ method: request.method(), url: url.href });
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  const documentValue = async () =>
    JSON.parse(await page.getByTestId("document").textContent());
  const errors = async (paths) => {
    await page.waitForFunction((expected) => {
      if (
        document
          .querySelector('[data-testid="validation"]')
          ?.getAttribute("data-ready") !== "true"
      )
        return false;
      const actual = JSON.parse(
        document.querySelector('[data-testid="errors"]').textContent,
      ).map(({ path }) => path.join("."));
      return JSON.stringify(actual.sort()) === JSON.stringify(expected.sort());
    }, paths);
  };
  const visit = async (query = "") => {
    await page.goto(`http://127.0.0.1:4177/${query}`, { timeout: 90000 });
    await page
      .getByRole("heading", { name: "Split Column · local form" })
      .waitFor({ timeout: 90000 });
  };
  const record = async (name) => {
    report.cases.push(name);
    await page.screenshot({
      path: `${output}/${String(report.cases.length).padStart(2, "0")}-${name}.png`,
      fullPage: true,
    });
  };
  const title = () => page.getByRole("textbox", { name: "Text", exact: true });
  const href = () => page.getByRole("textbox", { name: "URL", exact: true });
  const content = (value) =>
    Object.fromEntries(Object.entries(value).filter(([key]) => key !== "link"));
  const clearLink = async () => {
    await title().fill("");
    if (await href().count()) await href().fill("");
    await errors([]);
  };

  await visit();
  await errors([]);
  const baseline = await documentValue();
  assert(!baseline.link?.title && !baseline.link?.href);
  assert(await title().isVisible());
  assert(await href().isVisible());
  assert.equal(
    await page
      .getByRole("button", {
        name: /Agregar enlace|Quitar enlace|Add link|Remove link/i,
      })
      .count(),
    0,
  );
  await record("new-without-link");
  await page.reload();
  await errors([]);
  assert.deepEqual(await documentValue(), baseline);
  await record("reopened-without-link");

  await title().focus();
  await page.keyboard.type("Ver diseños");
  await errors(["link.href"]);
  await record("title-only-invalid");
  await title().fill("");
  await href().fill("/features#diseno");
  await errors(["link.title"]);
  await record("url-only-invalid");
  await title().fill("Ver diseños");
  await href().fill("javascript:alert(1)");
  await errors(["link.href"]);
  await record("invalid-url");
  await href().fill("/features#diseno");
  await errors([]);
  assert.equal((await documentValue()).link.href, "/features#diseno");
  await record("complete-link");

  await title().fill("Explorar diseños");
  await href().fill("https://example.com/disenos");
  await errors([]);
  const complete = await documentValue();
  await page.reload();
  await errors([]);
  assert.deepEqual(await documentValue(), complete);
  assert.equal(await title().inputValue(), "Explorar diseños");
  assert.equal(await href().inputValue(), "https://example.com/disenos");
  await record("edited-and-reopened");
  await clearLink();
  assert.deepEqual(content(await documentValue()), content(baseline));
  await page.reload();
  await errors([]);
  assert.deepEqual(content(await documentValue()), content(baseline));
  assert.equal(await title().inputValue(), "");
  assert.equal(await href().inputValue(), "");
  await record("cleared-and-reopened");

  await title().fill("Descargar");
  await page
    .getByRole("radio", { name: "SensaVision Desktop", exact: true })
    .check();
  await errors([]);
  assert.equal(await href().count(), 0);
  await record("desktop-without-url");
  await clearLink();
  assert.deepEqual(content(await documentValue()), content(baseline));

  await visit("?fixture=legacy");
  await errors([]);
  const { link: legacyLink, ...legacyContent } = await documentValue();
  assert.equal(legacyLink.title, undefined);
  assert.deepEqual(content(await documentValue()), legacyContent);
  await page.reload();
  await errors([]);
  assert.deepEqual(content(await documentValue()), legacyContent);
  assert.deepEqual((await documentValue()).link, legacyLink);
  await record("legacy-empty-link-valid");

  await visit("?fixture=complete");
  await errors([]);
  const { link: existingLink, ...existingContent } = await documentValue();
  assert.equal(existingLink.title, "Ver más");
  await clearLink();
  assert.deepEqual(content(await documentValue()), existingContent);
  await record("existing-link-fields-cleared");

  for (const fixture of ["new", "complete"]) {
    await visit(`?fixture=${fixture}&readonly`);
    await errors([]);
    const value = await documentValue();
    assert.equal(await title().isEditable(), false);
    assert.equal(await href().isEditable(), false);
    assert.deepEqual(await documentValue(), value);
    await record(`readonly-${fixture}`);
  }
  await visit("?fixture=legacy&controls");
  await errors([]);
  await record("column-controls");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.blockedRequests, []);
  console.log(
    `Split Studio: ${report.cases.length} escenarios aprobados; sin solicitudes al CMS.`,
  );
} catch (error) {
  report.failure = error.stack;
  if (page) {
    await page
      .screenshot({ path: `${output}/failure.png`, fullPage: true })
      .catch(() => {});
    writeFileSync(
      `${output}/failure.html`,
      await page.content().catch(() => ""),
    );
  }
  throw error;
} finally {
  writeFileSync(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await server?.close();
}
