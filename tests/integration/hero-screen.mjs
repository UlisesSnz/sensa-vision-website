import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "vite";
import { verifyStudio } from "./hero-screen-editor.mjs";

const output = "output/playwright/hero-screen";
const origin = "http://127.0.0.1:4183";
mkdirSync(output, { recursive: true });
const errors = [];
const unexpected = [];
let server;
let browser;

async function context(options = {}) {
  const ctx = await browser.newContext(options);
  ctx.setDefaultNavigationTimeout(90000);
  ctx.on("page", (page) =>
    page.on("pageerror", (error) => errors.push(error.message)),
  );
  await ctx.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const thumbnail = url.pathname.match(
      /^\/api-disabled\/images\/localqa\/local\/(botica|turno|servicios|coffee)0+-960x540\.png$/,
    );
    if (url.origin === origin && thumbnail) {
      return route.fulfill({
        path: `tests/fixtures/hero-screen/${thumbnail[1]}.svg`,
        contentType: "image/svg+xml",
      });
    }
    if (url.origin === origin && !url.pathname.startsWith("/api-disabled"))
      return route.continue();
    if (
      url.origin === origin &&
      url.pathname.endsWith("/projects/localqa/grants")
    )
      return route.fulfill({ json: {} });
    if (
      url.origin === "https://design-system-static.sanity.io" &&
      url.pathname.endsWith(".woff2")
    )
      return route.fulfill({
        path: "app/fonts/inter-latin.woff2",
        contentType: "font/woff2",
      });
    unexpected.push(url.pathname);
    return route.abort();
  });
  return ctx;
}
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function image(page, name) {
  const active = page.getByRole("img", { name, exact: true });
  await active.waitFor();
  await active.evaluate((img) => img.decode());
  return active;
}
const first = "Horario de la farmacia";
const second = "Turno de atención";
const third = "Servicios de la farmacia";

async function copyMetrics(page) {
  await page.evaluate(() => document.fonts.ready);
  return page.getByRole("heading", { level: 1 }).evaluate((title) => {
    const intro = title.parentElement;
    const tagline = intro.querySelector("span");
    const top = tagline.getBoundingClientRect().top;
    return [tagline, title, intro.querySelector("p"), ...intro.querySelectorAll("a")].map((el) => {
      const css = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return [
        css.fontFamily, css.fontSize, css.fontWeight, css.lineHeight, css.color,
        css.textAlign, css.textWrap, box.x, box.width, box.height, box.top - top,
      ];
    });
  });
}

async function verifyHeroLayouts(page) {
  for (const [device, width] of [
    ["desktop", 1440], ["wide", 1920], ["mobile", 375], ["small", 320],
  ]) {
    await page.setViewportSize({ width, height: 850 });
    let classicCopy;
    for (const hero of [1, 2]) {
      await page.goto(`${origin}/?hero=${hero}&layout=vertical`);
      const img = await image(page, hero === 1 ? "Café de la casa" : first);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await copyMetrics(page);
      if (hero === 1) classicCopy = metrics;
      else assert.deepEqual(metrics, classicCopy, "Both stacked heroes share the original typography and spacing");
      assert(await img.evaluate((el) =>
        Number(new URL(el.currentSrc).searchParams.get("w")) >= el.clientWidth,
      ), "The browser requests an image large enough for this layout");
      const media = hero === 1 ? img : page.locator("[data-scene]");
      const box = await media.boundingBox();
      const heading = page.getByRole("heading", { level: 1 });
      const title = await heading.boundingBox();
      const container = await page.locator(".container").evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          left: rect.left + parseFloat(style.paddingLeft),
          right: rect.right - parseFloat(style.paddingRight),
        };
      });
      const center = (container.left + container.right) / 2;
      assert(Math.abs(box.x - container.left) < 1);
      assert(Math.abs(box.x + box.width - container.right) < 1);
      assert(Math.abs(title.x + title.width / 2 - center) < 1);
      assert.equal(await heading.evaluate((el) => getComputedStyle(el).textAlign), "center");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      const links = await page.getByRole("link").all();
      assert.equal(links.length, 2);
      const rows = new Map();
      for (const link of links) {
        const rect = await link.boundingBox();
        assert(rect.y + rect.height < box.y);
        const row = rows.get(rect.y) ?? [];
        row.push(rect);
        rows.set(rect.y, row);
      }
      for (const row of rows.values()) {
        const last = row.at(-1);
        assert(Math.abs((row[0].x + last.x + last.width) / 2 - center) < 1);
      }
      if (device === "desktop" || device === "mobile") {
        await page.locator("main").screenshot({
          path: `${output}/hero-${hero}-text-above-${device}.png`,
        });
      }
      if (hero === 2) {
        await button(page, "Plantilla siguiente").click();
        await image(page, second);
        const after = await media.boundingBox();
        assert.equal(after.x, box.x);
        assert.equal(after.width, box.width);
        assert.equal(after.height, box.height);
      }
    }
    if (device === "desktop" || device === "mobile") {
      await page.goto(`${origin}/?hero=1&theme=dark`);
      await image(page, "Café de la casa");
      const original = await copyMetrics(page);
      await page.goto(`${origin}/?scenario=tour&theme=dark`);
      await image(page, "Agenda de recepción");
      assert.deepEqual(await copyMetrics(page), original, "Both split heroes share the original typography and spacing");
      await page.locator("main").screenshot({ path: `${output}/office-dark-${device}.png` });
    }
  }
  await page.setViewportSize({ width: 1440, height: 850 });
  await page.goto(`${origin}/?hero=1`);
  const classic = await (await image(page, "Café de la casa")).boundingBox();
  const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
  assert(classic.x >= heading.x + heading.width, "An existing Hero 1 opens side by side");
}

try {
  server = await createServer({
    configFile: "tests/browser/hero-screen/vite.config.mts",
  });
  await server.listen();
  browser = await chromium.launch();

  const visual = await context({ reducedMotion: "reduce", hasTouch: true });
  const page = await visual.newPage();
  for (const [size, width, height] of [
    ["desktop", 1440, 850],
    ["mobile", 375, 800],
  ]) {
    await page.setViewportSize({ width, height });
    for (const locale of ["es", "en"])
      for (const theme of ["light", "dark"]) {
        await page.goto(`${origin}/?locale=${locale}&theme=${theme}`);
        const img = await image(page, first);
        await button(page, locale === "es" ? "Reproducir" : "Play").waitFor();
        await button(page, locale === "es" ? "Plantilla anterior" : "Previous template").waitFor();
        await page.evaluate(() => document.fonts.ready);
        const getLayout = async () => {
          const bounds = await page
            .locator("[data-scene] [data-visible=true]")
            .boundingBox();
          return [
            bounds,
            await page.getByRole("heading").boundingBox(),
            await page.getByRole("button").first().boundingBox(),
          ];
        };
        const before = await getLayout();
        assert(Math.abs(before[0].width / before[0].height - 16 / 9) < 0.01);
        assert.equal(
          await img.evaluate((el) => getComputedStyle(el).objectFit),
          "contain",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        if (size === "mobile")
          assert(before[0].y > before[1].y + before[1].height);
        else assert(before[0].x > before[1].x + before[1].width);
        assert(before[2].width >= 44 && before[2].height >= 44);
        await page
          .locator("main")
          .screenshot({ path: `${output}/${size}-${theme}-${locale}.png` });
        assert.equal(
          await page.locator("[data-scene]").getAttribute("data-scene"),
          "pharmacy",
        );
        assert.equal(
          await page
            .locator("[data-room=pharmacy]")
            .evaluate((el) => getComputedStyle(el).transitionDuration),
          "0s",
        );
        assert.equal(await page.locator("[data-room] > div > svg").count(), 0);
        assert.equal(
          await page.getByRole("link").first().getAttribute("href"),
          `/${locale}/features`,
        );
        await button(
          page,
          locale === "es" ? "Plantilla siguiente" : "Next template",
        ).tap();
        await image(page, second);
        assert.deepEqual(await getLayout(), before);
        assert((await page.getByRole("status").textContent()).includes(second));
        assert.equal(await page.getByRole("img").count(), 1);
      }
  }
  await verifyHeroLayouts(page);
  await page.goto(`${origin}/?scenario=tour`);
  const tour = [
    ["office", "Agenda de recepción"],
    ["store", "Frutas de temporada"],
    ["pharmacy", first],
    ["restaurant", "Café de la casa"],
    ["window", "Nueva colección de lino"],
  ];
  await image(page, tour[0][1]);
  await page.waitForFunction(
    () => document.querySelectorAll("[data-visible] img").length === 2,
  );
  assert.equal(
    await page.locator("[data-visible] img").count(),
    2,
    "Only the active and upcoming images load initially",
  );
  for (const [scene, alt] of tour) {
    await image(page, alt);
    assert.equal(
      await page.locator("[data-scene]").getAttribute("data-scene"),
      scene,
    );
    assert.equal(
      await page
        .locator(`[data-room=${scene}]`)
        .evaluate((el) => getComputedStyle(el).opacity),
      "1",
    );
    const carousel = page.getByRole("group", { name: "Plantillas de Sensa", exact: true });
    assert.equal(await carousel.getByText(/^(Recepción|Tienda|Farmacia|Cafetería|Escaparate)$/).count(), 0);
    if (scene === "office") {
      const inFront = await page.locator("[data-room=office] [data-room-poster] path[fill]").evaluate((leaves) => {
        const screen = document.querySelector("[data-visible=true]").getBoundingClientRect();
        const bounds = leaves.getBoundingClientRect();
        leaves.style.pointerEvents = "visiblePainted";
        try {
          for (let x = Math.max(bounds.left, screen.left) + 1; x < Math.min(bounds.right, screen.right); x++)
            for (let y = Math.max(bounds.top, screen.top) + 1; y < Math.min(bounds.bottom, screen.bottom); y++)
              if (document.elementFromPoint(x, y) === leaves) return true;
          return false;
        } finally {
          leaves.style.removeProperty("pointer-events");
        }
      });
      assert(inFront, "A leaf is painted in front of the lower-left corner of the screen");
    }
    await page
      .getByRole("group", { name: "Plantillas de Sensa", exact: true })
      .screenshot({ path: `${output}/scene-${scene}.png` });
    await button(page, "Plantilla siguiente").click();
  }
  await image(page, tour[0][1]);
  for (const scenario of ["empty", "single"]) {
    await page.goto(`${origin}/?scenario=${scenario}`);
    if (scenario === "empty")
      await page.getByText("Pantalla en reposo").waitFor();
    else await image(page, first);
    assert.equal(await page.getByRole("button").count(), 0);
  }
  await visual.close();

  const motion = await context();
  const rooms = await motion.newPage();
  await rooms.clock.install();
  await rooms.goto(`${origin}/?scenario=tour`);
  const drawing = (scene) =>
    rooms.locator(`[data-room=${scene}][data-animated=true] > div > svg`);
  await rooms.locator("[data-scene]").hover();
  for (const [scene, alt] of tour) {
    await image(rooms, alt);
    await drawing(scene).waitFor();
    await rooms.clock.runFor(4300);
    const before = await drawing(scene).innerHTML();
    await rooms.clock.runFor(650);
    assert.notEqual(
      await drawing(scene).innerHTML(),
      before,
      `${scene} keeps moving beyond the first animation cycle while its template is held`,
    );
    await image(rooms, alt);
    if (scene !== "window") await button(rooms, "Plantilla siguiente").click();
  }
  await button(rooms, "Pausar").click();
  const reflection = drawing("window");
  const paused = await reflection.innerHTML();
  await rooms.clock.runFor(500);
  assert.equal(await reflection.innerHTML(), paused);
  const ink = () =>
    reflection.locator("path[stroke]").first().evaluate((el) => getComputedStyle(el).stroke);
  const light = await ink();
  await rooms.evaluate(() => document.documentElement.classList.add("dark"));
  const dark = await ink();
  assert.notEqual(dark, light, "The stroke changes with the theme");
  assert.equal(
    dark,
    await rooms.locator("[data-room=window] > svg").evaluate((el) => getComputedStyle(el).stroke),
    "The animated reflection and static furniture share the same dark ink",
  );
  await button(rooms, "Reproducir").click();
  await rooms.clock.runFor(450);
  assert.notEqual(await reflection.innerHTML(), paused);
  await rooms.emulateMedia({ reducedMotion: "reduce" });
  await rooms.locator("[data-room=window][data-animated=false]").waitFor();
  await rooms.getByRole("button", { name: "Plantilla siguiente" }).click();
  await image(rooms, tour[0][1]);
  assert.equal(await rooms.locator("[data-animated=true]").count(), 0);
  await rooms.close();

  const only = await motion.newPage();
  await only.clock.install();
  await only.goto(`${origin}/?scenario=single`);
  const accent = only.locator("[data-room=pharmacy][data-animated=true] > div > svg");
  const startingPose = await accent.innerHTML();
  await only.clock.runFor(600);
  assert.notEqual(await accent.innerHTML(), startingPose);
  await only.clock.runFor(4100);
  const nextCycle = await accent.innerHTML();
  await only.clock.runFor(550);
  assert.notEqual(await accent.innerHTML(), nextCycle, "The scene loops with a single static template");
  assert.equal(await only.getByRole("button").count(), 1);
  await button(only, "Pausar animación").click();
  const pausedSingle = await accent.innerHTML();
  await only.clock.runFor(500);
  assert.equal(await accent.innerHTML(), pausedSingle);
  await button(only, "Reproducir animación").click();
  await only.clock.runFor(500);
  assert.notEqual(await accent.innerHTML(), pausedSingle);
  await image(only, first);
  await only.close();

  const missingArt = await motion.newPage();
  const failedArt = missingArt.waitForRequest((req) => req.url().includes("/motion/office.json"));
  await missingArt.route("**/motion/office.json*", (route) => route.abort());
  await missingArt.goto(`${origin}/?scenario=tour`);
  await failedArt;
  await image(missingArt, tour[0][1]);
  await missingArt.locator("[data-room=office][data-animated=false] [data-room-poster]").waitFor();
  await button(missingArt, "Plantilla siguiente").click();
  await image(missingArt, tour[1][1]);
  await missingArt.locator("[data-room=store][data-animated=true] > div > svg").waitFor();
  await missingArt.close();

  const player = await motion.newPage();
  await player.clock.install();
  await player.goto(origin);
  await image(player, first);
  await button(player, "Pausar").waitFor();
  assert.equal(
    await player
      .locator("[data-visible=true]")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0.45s",
  );
  await player.locator("[data-scene]").hover();
  await player.clock.fastForward(11000);
  await image(player, first);
  await button(player, "Pausar").click();
  await button(player, "Reproducir").click();
  await player.clock.fastForward(5100);
  await image(player, first);
  await player.mouse.move(0, 0);
  await player.clock.fastForward(5100);
  await image(player, second);
  assert.equal((await player.getByRole("status").textContent()).trim(), "");
  await player.getByRole("link", { name: "Descargar Sensa" }).focus();
  await player.keyboard.press("Tab");
  assert.equal(
    await button(player, "Reproducir").evaluate(
      (el) => el === document.activeElement,
    ),
    true,
  );
  await player.keyboard.press("Shift+Tab");
  await player.clock.fastForward(11000);
  await image(player, second);
  await player.keyboard.press("Tab");
  await player.keyboard.press("Enter");
  await player.clock.fastForward(5100);
  await image(player, third);
  await player.keyboard.press("Tab");
  await player.keyboard.press("Space");
  await image(player, second);
  assert.equal(
    await button(player, "Plantilla anterior").evaluate(
      (el) => el === document.activeElement,
    ),
    true,
  );
  await player.clock.fastForward(11000);
  await image(player, second);
  await button(player, "Plantilla siguiente").dblclick();
  await image(player, first);
  await player.clock.fastForward(11000);
  await image(player, first);
  await motion.close();

  const failure = await context({ reducedMotion: "reduce" });
  const delayed = await failure.newPage();
  let failNext;
  const held = new Promise((resolve) => {
    failNext = resolve;
  });
  await delayed.route("**/turno.svg*", async (route) => {
    await held;
    await route.abort();
  });
  await delayed.goto(origin, { waitUntil: "domcontentloaded" });
  await image(delayed, first);
  await button(delayed, "Plantilla siguiente").click();
  await image(delayed, first);
  failNext();
  await image(delayed, third);
  assert.equal(await delayed.locator("[data-visible=true]").count(), 1);
  const allFailed = await failure.newPage();
  await allFailed.route(/\.svg\?w=/, (route) => route.abort());
  await allFailed.goto(origin);
  await allFailed.getByText("Pantalla en reposo").waitFor();
  assert.equal(await allFailed.getByRole("button").count(), 0);
  const portrait = await failure.newPage();
  await portrait.route("**/botica.svg*", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640"><rect width="360" height="640" fill="teal"/></svg>',
    }),
  );
  await portrait.goto(`${origin}/?scenario=single`);
  const vertical = await image(portrait, first);
  const fit = await vertical.evaluate((img) => ({
    source: img.naturalWidth / img.naturalHeight,
    screen: img.clientWidth / img.clientHeight,
    fit: getComputedStyle(img).objectFit,
  }));
  assert(
    Math.abs(fit.source - 9 / 16) < 0.01 &&
      Math.abs(fit.screen - 16 / 9) < 0.02,
  );
  assert.equal(fit.fit, "contain");
  await failure.close();

  const studio = await context({ reducedMotion: "reduce" });
  await verifyStudio(studio, origin, output);
  await studio.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log(
    "Heroes OK: both layouts, responsive images, 8 visual combinations, 5 animated scenes, playback, asset failures and local Studio editing.",
  );
} catch (error) {
  if (errors.length || unexpected.length) console.error({ errors, unexpected });
  throw error;
} finally {
  await browser?.close();
  await server?.close();
}
