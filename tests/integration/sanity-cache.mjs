import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { getCliClient } from "sanity/cli";

// Run through `sanity exec ... --with-user-token -- baseline|verify <preview-url>`.
// The destination dataset is intentionally not configurable.
process.loadEnvFile(".env.cache-qa.local");
const [mode, origin] = process.argv.slice(2);
assert(["baseline", "verify"].includes(mode));
assert(new URL(origin).hostname.endsWith(".vercel.app"));
const client = getCliClient({ apiVersion: "2026-10-01" }).withConfig({
  projectId: "e07b8hy0", dataset: "staging", useCdn: false, perspective: "published",
});
const headers = { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET };
const paths = ["/es", "/es/descargas", "/es/blog/cache-qa"];
async function read(path) {
  const response = await fetch(new URL(path, origin), { headers, signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, `Unexpected status on ${path}`);
  const html = await response.text();
  assert(!html.includes("<title>Deployment is building"), "Preview is not ready");
  assert(html.includes("SanityLive") || html.includes("sanity"), "Response is not the application");
  return { html, cache: response.headers.get("x-vercel-cache") };
}
const marker = `QA-${mode}-${Date.now()}`;
const before = await Promise.all(paths.map(read));
const englishBefore = await read("/en");
const settings = await client.getDocument("qa-cache-settings-es");
const padding = !settings.footerPadding.top;
const published = await client.patch(settings._id).set({
  "headerNavigation[0].label": marker, "footerPadding.top": padding,
}).commit();
const publishedAt = Date.parse(published._updatedAt);
const samples = [];
let updated = false;
while (Date.now() - publishedAt < 35_000) {
  const pages = await Promise.all(paths.map(read));
  updated = pages.every(({ html }) => html.includes(marker));
  samples.push({ elapsedMs: Date.now() - publishedAt, updated, cache: pages.map(page => page.cache) });
  if (updated) {
    const footerPattern = /<footer\b[^>]*class="([^"]*)"/;
    for (const [index, page] of pages.entries()) {
      assert.notEqual(page.html.match(footerPattern)?.[1], before[index].html.match(footerPattern)?.[1], "Footer did not update");
    }
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 1_000));
}
const englishAfter = await read("/en");
assert(!englishAfter.html.includes(marker), "Spanish content leaked into English");
const englishMarker = englishBefore.html.match(/QA-[\w-]+-en/)?.[0];
if (englishMarker) assert(englishAfter.html.includes(englishMarker));
const query = '*[_type == "siteSettings" && language == $locale][0]';
const { syncTags } = await client.fetch(query, { locale: "es" }, { filterResponse: false });
const report = { mode, origin, marker, publishedAt: published._updatedAt, syncTags, connectedBrowsers: 0, paths, samples };
mkdirSync("output/playwright", { recursive: true });
writeFileSync(`output/playwright/cache-${mode}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (mode === "verify") {
  assert(updated, "No fresh response within 35 seconds");
  assert(samples.at(-1).elapsedMs <= 30_000, "Publication exceeded 30 seconds");
} else {
  assert(!updated, "Baseline unexpectedly updated; investigate the reproduction");
}
