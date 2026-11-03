import assert from "node:assert/strict";

export async function verifyStudio(context, origin, output) {
  const editor = await context.newPage();
  await editor.goto(`${origin}/studio.html`);
  const add = editor.getByRole("button", { name: "Add item" });
  await add.waitFor();
  const defaultScene = editor.getByRole("combobox", { name: "Default scene" });
  const scene = editor.getByRole("combobox", { name: "Scene", exact: true });
  assert.equal(await defaultScene.inputValue(), "office");
  const additions = ["Home", "Education", "Manufacturing", "Healthcare"];
  for (const label of additions)
    assert.equal(await defaultScene.getByRole("option", { name: label, exact: true }).count(), 1);
  await defaultScene.selectOption({ label: "Pharmacy" });
  const preview = await context.newPage();
  await preview.goto(`${origin}/?scenario=saved`);
  await preview.getByText("Pantalla en reposo").waitFor();
  const doc = async () =>
    JSON.parse(await editor.getByTestId("document").textContent());
  const image = (name) => preview.getByRole("img", { name, exact: true });
  const next = preview.getByRole("button", { name: "Plantilla siguiente" });
  const labels = [
    "Horario de la farmacia",
    "Turno de atención",
    "Servicios de la farmacia",
  ];
  async function editImage(name, override) {
    await editor.getByLabel("Test image").selectOption({ label: name });
    await editor.getByRole("textbox", { name: "Alt text" }).fill(name);
    assert.equal(await scene.locator("option:checked").textContent(), "Use default (Pharmacy)");
    if (override) await scene.selectOption({ label: override });
    await editor.getByRole("button", { name: "Close dialog" }).click();
    await editor.getByLabel("Test image").waitFor({ state: "hidden" });
    await editor.getByText("0 validation errors", { exact: true }).waitFor();
  }
  for (const label of labels) {
    await add.click();
    await editImage(label);
  }
  assert((await doc()).slides.every((slide) => !("scene" in slide)));
  await editor
    .getByRole("button", { name: new RegExp(labels[0]) })
    .locator("img")
    .evaluate((img) => img.decode());
  await image(labels[0]).waitFor();
  await preview.locator('[data-scene="pharmacy"]').waitFor();
  await preview.locator("[data-scene]").hover();
  await next.click();
  await image(labels[1]).waitFor();
  const startingKeys = (await doc()).slides.map((slide) => slide._key);

  const layout = editor.getByRole("radiogroup", { name: "Layout" });
  const sideBySide = layout.getByRole("radio", { name: "Side by side", exact: true });
  const textAbove = layout.getByRole("radio", { name: "Text above", exact: true });
  const waitForAlignment = (centered) =>
    preview.waitForFunction((expected) => {
      const heading = document.querySelector("h1");
      return heading && (getComputedStyle(heading).textAlign === "center") === expected;
    }, centered);
  assert(await sideBySide.isChecked());
  assert.equal((await doc()).layout, "horizontal");
  assert.equal(await layout.getByRole("radio").count(), 2);
  assert.equal(await layout.getByRole("button").count(), 0);
  await sideBySide.press("ArrowRight");
  await waitForAlignment(true);
  await textAbove.click();
  assert(await textAbove.isChecked(), "Clicking the selected layout keeps it selected");
  assert.equal((await doc()).layout, "vertical");
  await image(labels[1]).waitFor();

  // Use the same grab handles that an editor drags in Studio.
  await editor.bringToFront();
  const handles = editor.locator('button[aria-roledescription="sortable"]');
  await handles.nth(1).scrollIntoViewIfNeeded();
  const firstRow = await handles.nth(0).boundingBox();
  const secondRow = await handles.nth(1).boundingBox();
  const x = secondRow.x + secondRow.width / 2;
  await editor.mouse.move(x, secondRow.y + secondRow.height / 2);
  await editor.mouse.down();
  await editor.mouse.move(x, firstRow.y + 3, { steps: 18 });
  await editor.mouse.up();
  await editor.waitForFunction(
    (key) =>
      JSON.parse(localStorage.getItem("hero-screen-document")).slides[0]
        ._key === key,
    startingKeys[1],
  );
  await image(labels[1]).waitFor();
  await preview
    .getByRole("group", { name: "Plantilla 1 de 3", exact: true })
    .waitFor();

  await editor.getByText(labels[1], { exact: true }).click();
  await editImage("Café de la casa", "Restaurant or café");
  await image("Café de la casa").waitFor();
  assert.equal(
    await preview.locator("[data-scene]").getAttribute("data-scene"),
    "restaurant",
  );
  assert.equal((await doc()).slides[0]._key, startingKeys[1]);
  await editor.screenshot({ path: `${output}/studio.png` });
  const before = (await doc()).slides;
  await editor.reload();
  await editor.getByText("Café de la casa", { exact: true }).waitFor();
  assert(await textAbove.isChecked());
  assert.deepEqual((await doc()).slides, before);
  await preview.reload();
  await image("Café de la casa").waitFor();
  await defaultScene.selectOption({ label: "Store" });
  await preview.locator('[data-scene="restaurant"]').waitFor();
  await preview.locator("[data-scene]").hover();
  await next.click();
  await image(labels[0]).waitFor();
  await preview.locator('[data-scene="store"]').waitFor();
  await preview.getByRole("button", { name: "Plantilla anterior" }).click();
  await preview.locator('[data-scene="restaurant"]').waitFor();
  await editor.getByText("Café de la casa", { exact: true }).click();
  await scene.selectOption({ label: "Use default (Store)" });
  await editor.getByRole("button", { name: "Close dialog" }).click();
  await preview.locator('[data-scene="store"]').waitFor();
  await image("Café de la casa").waitFor();
  const reverted = (await doc()).slides;
  assert(!("scene" in reverted[0]));
  assert.deepEqual(reverted.map((slide) => slide.asset), before.map((slide) => slide.asset));
  await editor.reload();
  await editor.getByText("Café de la casa", { exact: true }).waitFor();
  assert.deepEqual((await doc()).slides, reverted);

  await editor.getByTestId("array-item-menu-button").first().click();
  await editor.getByRole("menuitem", { name: /remove/i }).click();
  await image(labels[0]).waitFor();
  assert.deepEqual(
    (await doc()).slides.map((slide) => slide._key),
    [startingKeys[0], startingKeys[2]],
  );
  await editor.reload();
  await editor.getByText(labels[0], { exact: true }).waitFor();
  assert.equal((await doc()).slides.length, 2);

  await editor.getByText(labels[0], { exact: true }).click();
  for (const label of additions)
    assert.equal(await scene.getByRole("option", { name: label, exact: true }).count(), 1);
  await scene.selectOption({ label: "Home" });
  await editor.getByRole("button", { name: "Close dialog" }).click();
  await preview.locator('[data-scene="home"]').waitFor();
  await preview.reload();
  await image(labels[0]).waitFor();
  await preview.locator('[data-scene="home"]').waitFor();
  await preview.locator("[data-scene]").hover();
  await next.click();
  await preview.locator('[data-scene="store"]').waitFor();

  await editor.goto(`${origin}/studio.html?hero=1`);
  await sideBySide.waitFor();
  await editor.evaluate(() => {
    const block = JSON.parse(localStorage.getItem("hero-image-document"));
    delete block.layout;
    localStorage.setItem("hero-image-document", JSON.stringify(block));
  });
  await editor.reload();
  await sideBySide.waitFor();
  assert(await sideBySide.isChecked());
  assert.equal((await doc()).layout, undefined, "Opening a legacy hero does not edit it");
  await preview.goto(`${origin}/?hero=1&scenario=saved`);
  await image("Café de la casa").waitFor();
  await textAbove.check();
  await waitForAlignment(true);
  await editor.reload();
  await textAbove.waitFor();
  assert(await textAbove.isChecked());
  await sideBySide.check();
  await waitForAlignment(false);
  await image("Café de la casa").waitFor();
}
