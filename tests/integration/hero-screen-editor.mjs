import assert from "node:assert/strict";

export async function verifyStudio(context, origin, output) {
  const editor = await context.newPage();
  await editor.goto(`${origin}/studio.html`);
  const add = editor.getByRole("button", { name: "Add item" });
  await add.waitFor();
  await editor
    .getByRole("combobox", { name: "Default scene" })
    .selectOption({ label: "Pharmacy" });
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
    if (override)
      await editor
        .getByRole("combobox", { name: "Scene", exact: true })
        .selectOption({ label: override });
    await editor.getByRole("button", { name: "Close dialog" }).click();
    await editor.getByLabel("Test image").waitFor({ state: "hidden" });
    await editor.getByText("0 validation errors", { exact: true }).waitFor();
  }
  for (const label of labels) {
    await add.click();
    await editImage(label);
  }
  await editor
    .getByRole("button", { name: new RegExp(labels[0]) })
    .locator("img")
    .evaluate((img) => img.decode());
  await image(labels[0]).waitFor();
  await next.click();
  await image(labels[1]).waitFor();
  const startingKeys = (await doc()).slides.map((slide) => slide._key);

  // Use the same grab handles that an editor drags in Studio.
  await editor.bringToFront();
  const handles = editor.locator('button[aria-roledescription="sortable"]');
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
  assert.deepEqual((await doc()).slides, before);
  await preview.reload();
  await image("Café de la casa").waitFor();

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
}
