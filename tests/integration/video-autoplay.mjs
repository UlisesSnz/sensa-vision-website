import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";

const origin = "http://127.0.0.1:4184";
let browser;
let server;

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (!existsSync(edge)) throw error;
    return chromium.launch({ executablePath: edge, headless: true });
  }
}

async function createContext(options = {}) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    const events = [];
    const playing = new WeakMap();
    window.__videoAutoplayEvents = events;

    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() {
        return !playing.get(this);
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value() {
        playing.set(this, true);
        events.push("native:play");
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value() {
        if (!playing.get(this)) return;
        playing.set(this, false);
        events.push("native:pause");
        this.dispatchEvent(new Event("pause"));
      },
    });
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.href === "https://www.youtube.com/iframe_api") {
      return route.fulfill({
        contentType: "application/javascript",
        body: `
          window.YT = {
            Player: function (_element, options) {
              const player = {
                destroy() { window.__videoAutoplayEvents.push("youtube:destroy"); },
                mute() { window.__videoAutoplayEvents.push("youtube:mute"); },
                pauseVideo() {
                  window.__videoAutoplayEvents.push("youtube:pause");
                  options.events.onStateChange({ target: player, data: 2 });
                },
                playVideo() {
                  window.__videoAutoplayEvents.push("youtube:play");
                  options.events.onStateChange({ target: player, data: 1 });
                },
              };
              window.__videoAutoplayEvents.push("youtube:create");
              setTimeout(() => options.events.onReady({ target: player }), 0);
              return player;
            },
          };
          window.onYouTubeIframeAPIReady?.();
        `,
      });
    }
    if (url.hostname === "www.youtube-nocookie.com") {
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>YouTube fixture</title>",
      });
    }
    return route.abort();
  });
  return context;
}

async function events(page) {
  return page.evaluate(() => window.__videoAutoplayEvents);
}

async function waitForEvent(page, event, count = 1) {
  await page.waitForFunction(
    ([expected, required]) =>
      window.__videoAutoplayEvents.filter((entry) => entry === expected).length >=
      required,
    [event, count],
  );
}

try {
  server = await createServer({
    configFile: "tests/browser/video-autoplay/vite.config.mts",
  });
  await server.listen();
  browser = await launchBrowser();

  const context = await createContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(origin);
  await page.locator("#native video").waitFor();
  assert.deepEqual(await events(page), [], "Off-screen media does not start");

  await page.locator("#native").scrollIntoViewIfNeeded();
  await waitForEvent(page, "native:play");
  assert.equal(
    await page.locator("#native video").evaluate((video) => video.muted),
    true,
    "Native autoplay starts muted",
  );
  assert.equal(
    await page.locator("#native video").evaluate((video) => video.controls),
    true,
    "Native autoplay exposes playback controls",
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForEvent(page, "native:pause");
  await page.locator("#native").scrollIntoViewIfNeeded();
  await waitForEvent(page, "native:play", 2);

  await page.locator("#native video").evaluate((video) => {
    video.muted = false;
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForEvent(page, "native:pause", 2);
  await page.locator("#native").scrollIntoViewIfNeeded();
  await waitForEvent(page, "native:play", 3);
  assert.equal(
    await page.locator("#native video").evaluate((video) => video.muted),
    false,
    "A visitor can keep audio enabled after the initial muted start",
  );

  await page.locator("#native video").evaluate((video) => video.pause());
  await waitForEvent(page, "native:pause", 3);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("#native").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  assert.equal(
    (await events(page)).filter((event) => event === "native:play").length,
    3,
    "A manual pause is not overridden when the video re-enters the viewport",
  );

  await page.locator("#youtube").scrollIntoViewIfNeeded();
  await waitForEvent(page, "youtube:play");
  const youtubeEvents = await events(page);
  assert(
    youtubeEvents.indexOf("youtube:mute") < youtubeEvents.indexOf("youtube:play"),
    "YouTube is muted before playback starts",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForEvent(page, "youtube:pause");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#youtube").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  assert.equal(
    (await events(page)).filter((event) => event === "youtube:play").length,
    1,
    "Reduced motion prevents automatic YouTube resume",
  );
  await context.close();

  const reducedContext = await createContext({ reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.setViewportSize({ width: 1280, height: 720 });
  await reducedPage.goto(origin);
  await reducedPage.locator("#native").scrollIntoViewIfNeeded();
  await reducedPage.locator("#youtube").scrollIntoViewIfNeeded();
  await reducedPage.waitForTimeout(150);
  assert.deepEqual(
    await events(reducedPage),
    [],
    "Reduced motion leaves both sources manual",
  );
  await reducedContext.close();

  console.log(
    "Video autoplay regression passed: viewport, manual pause, mute order, and reduced motion.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
