import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { getCliClient } from "sanity/cli";
import { createPreviewSecret } from "@sanity/preview-url-secret/create-secret";

process.loadEnvFile(".env.cache-qa.local");
const [origin] = process.argv.slice(2);
assert(new URL(origin).hostname.endsWith(".vercel.app"));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : "playwright");
const client = getCliClient({ apiVersion: "2026-10-01" }).withConfig({
  projectId: "e07b8hy0", dataset: "staging", useCdn: false, perspective: "published",
});
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "es-MX" });
await context.route(`${origin}/**`, async route => route.continue({ headers: {
  ...await route.request().allHeaders(), "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
} }));
const report = { origin, sessions: [], errors: [] };
const waitForMarker = (page, marker) => page.locator("header").filter({ hasText: marker }).waitFor({ timeout: 30_000 });
async function open(path) {
  const page = await context.newPage();
  page.on("pageerror", error => report.errors.push(error.name));
  let connected;
  const liveConnection = new Promise(resolve => { connected = resolve; });
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.hostname.endsWith("sanity.io") && url.pathname.includes("/live/events")) {
      console.log(JSON.stringify({ liveStatus: response.status(), drafts: url.searchParams.get("includeDrafts") === "true" }));
    }
  });
  page.on("console", message => {
    if (message.text().startsWith("<SanityLive") && message.text().includes("is connected")) {
      connected(200);
    }
  });
  await page.goto(new URL(path, origin).href);
  await page.locator("header").waitFor();
  const status = await Promise.race([liveConnection, new Promise(resolve => setTimeout(() => resolve("timeout"), 20_000))]);
  assert.equal(status, 200, "Sanity Live connection must be ready before publishing");
  return page;
}
const draftId = "drafts.qa-cache-settings-es";
const secretId = "sanity-preview-url-secret.qa-cache";
try {
  for (const paths of [["/es"], ["/es", "/es/descargas", "/es/blog/cache-qa"]]) {
    const pages = await Promise.all(paths.map(open));
    const marker = `QA-tabs-${paths.length}-${Date.now()}`;
    const started = performance.now();
    await client.patch("qa-cache-settings-es").set({ "headerNavigation[0].label": marker }).commit();
    await Promise.all(pages.map(page => waitForMarker(page, marker)));
    const elapsedMs = Math.round(performance.now() - started);
    assert(elapsedMs <= 30_000);
    report.sessions.push({ tabs: pages.length, elapsedMs, marker });
    console.log(JSON.stringify({ stage: "published", tabs: pages.length, elapsedMs }));
    await Promise.all(pages.map(page => page.close()));
  }

  const published = await client.getDocument("qa-cache-settings-es");
  const fields = Object.fromEntries(Object.entries(published).filter(([key]) => !["_rev", "_createdAt", "_updatedAt"].includes(key)));
  const marker = `QA-draft-${Date.now()}`;
  await client.createOrReplace({ ...fields, _id: draftId,
    headerNavigation: fields.headerNavigation.map((item, index) => index ? item : { ...item, label: marker }),
  });
  const { secret } = await createPreviewSecret(client, "cache-qa", `${origin}/studio`, undefined, secretId);
  const enable = new URL("/api/draft-mode/enable", origin);
  enable.searchParams.set("sanity-preview-secret", secret);
  enable.searchParams.set("sanity-preview-pathname", "/es");
  const draft = await open(`${enable.pathname}${enable.search}`);
  await waitForMarker(draft, marker);
  const updatedMarker = `${marker}-updated`;
  const started = performance.now();
  await client.patch(draftId).set({ "headerNavigation[0].label": updatedMarker }).commit();
  await waitForMarker(draft, updatedMarker);
  const draftElapsedMs = Math.round(performance.now() - started);
  const publicResponse = await fetch(`${origin}/es`, { headers: {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  } });
  const publicHtml = await publicResponse.text();
  assert(!publicHtml.includes(marker), "Draft leaked into a public response");
  assert(publicHtml.includes(published.headerNavigation[0].label));
  report.draft = { refreshed: true, elapsedMs: draftElapsedMs, publicIsolated: true };
  await draft.getByRole("button", { name: "Desactivar modo borrador" }).click();
  await waitForMarker(draft, published.headerNavigation[0].label);
  report.draft.manualExit = true;
  assert.equal(report.errors.length, 0);
  mkdirSync("output/playwright", { recursive: true });
  writeFileSync("output/playwright/cache-browser.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  mkdirSync("output/playwright", { recursive: true });
  writeFileSync("output/playwright/cache-browser-failure.json", JSON.stringify({ ...report, failure: error.name }, null, 2));
  throw error;
} finally {
  await browser.close();
  await client.delete(draftId);
  await client.delete(`drafts.${secretId}`);
}
