import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
}

test("Overview label opens a card, hides only its label, and Enter inspects without the hero", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const before = await page.evaluate(() => __campus.getState());
  const first = page.locator(".building-label:visible").first(),
    id = await first.getAttribute("data-building-id"),
    name = await first.innerText();
  const label = page.locator(`.building-label[data-building-id="${id}"]`);
  await label.click();
  const card = page.locator(".building-card");
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading")).toHaveText(name);
  await expect(card.locator("p")).toHaveText("to be fill");
  await expect(label).toBeHidden();
  await expect(page.locator("#selection")).toBeHidden();
  await page.getByRole("button", { name: "Close building card" }).click();
  await expect(label).toBeVisible();
  await expect(card).toBeHidden();
  await label.click();
  const hero = await page.evaluate(() => __campus.getState().player),
    requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await card.getByRole("button", { name: "Enter", exact: true }).click();
  await page.waitForFunction(() => window.__interior?.getState().ready);
  const indoor = await page.evaluate(() => __interior.getState());
  expect(indoor.buildingId).toBe(id);
  expect(indoor.view).toBe("aerial");
  expect(indoor.heroPresent).toBe(false);
  expect(indoor.player).toBeNull();
  expect(indoor.outsidePlayer).toEqual(hero);
  expect(requests.some((url) => /\/characters\//.test(url))).toBe(false);
  await page.keyboard.press("Digit1");
  expect((await page.evaluate(() => __interior.getState())).view).toBe(
    "aerial",
  );
  await page.getByRole("button", { name: /Return to campus/ }).click();
  await page.waitForFunction(() => window.__campus?.getState().ready);
  const after = await page.evaluate(() => __campus.getState());
  expect(after.player).toEqual(before.player);
  expect(after.view).toBe("aerial");
  for (let i = 0; i < 3; i++)
    expect(after.camera[i]).toBeCloseTo(before.camera[i], 3);
  expect(errors).toEqual([]);
});

test("model hover highlights without selecting, click opens card, mode change restores labels", async ({
  page,
}) => {
  await ready(page);
  // Focus a known model via search, then click the rendered roof below its label anchor.
  const name = await page
    .locator(".building-label:visible")
    .first()
    .innerText();
  await page.getByRole("combobox", { name: "Search buildings" }).fill(name);
  await page.getByRole("option").first().click();
  await page.waitForFunction(() => !__campus.getState().cameraTransition);
  const id = await page.evaluate(() => __campus.getState().selectedBuilding);
  await page.getByRole("button", { name: "Close building card" }).click();
  const point = await page.evaluate((id) => {
    const state = __campus.getState(),
      info = __campus.labelInfo(id),
      v = document.querySelector("#viewport"),
      d = state.cameraDirection;
    const length = Math.hypot(d[0], d[2]),
      right = [-d[2] / length, 0, d[0] / length];
    const up = [
      right[1] * d[2] - right[2] * d[1],
      right[2] * d[0] - right[0] * d[2],
      right[0] * d[1] - right[1] * d[0],
    ];
    const relative = info.anchor.map(
      (value, i) => value - (i === 1 ? 3.1 : 0) - state.camera[i],
    );
    const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0),
      depth = dot(relative, d),
      tan = Math.tan(Math.PI / 8);
    return {
      x:
        ((dot(relative, right) /
          ((depth * tan * v.clientWidth) / v.clientHeight) +
          1) *
          v.clientWidth) /
        2,
      y: ((1 - dot(relative, up) / (depth * tan)) * v.clientHeight) / 2,
    };
  }, id);

  await page.mouse.move(point.x, point.y);
  await expect
    .poll(() => page.evaluate(() => __campus.getState().hoveredBuilding))
    .toBe(id);
  expect(
    (await page.evaluate(() => __campus.getState())).selectedBuilding,
  ).toBeNull();
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(".building-card")).toBeVisible();
  expect(
    (await page.evaluate(() => __campus.getState())).selectedBuilding,
  ).toBe(id);
  await page.keyboard.press("Digit2");
  await expect(page.locator(".building-card")).toBeHidden();
  await page.getByRole("combobox", { name: "Search buildings" }).fill(name);
  await page.getByRole("option").first().click();
  await expect(
    page.locator(`.building-label[data-building-id="${id}"]`),
  ).toBeVisible();
  await page.mouse.move(1, 1);
  await expect
    .poll(() => page.evaluate(() => __campus.getState().hoveredBuilding))
    .toBeNull();
});

test("phone building card stays on-screen and taps Enter into hero-free Overview", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await ready(page);
  await page.locator(".building-label:visible").first().tap();
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await expect
      .poll(async () => {
        const r = await page.locator(".building-card").boundingBox();
        return (
          !!r &&
          r.x >= 0 &&
          r.y >= 0 &&
          r.x + r.width <= size.width &&
          r.y + r.height <= size.height
        );
      })
      .toBe(true);
  }
  await page.locator(".building-card-enter").tap();
  await page.waitForFunction(() => window.__interior?.getState().ready);
  expect((await page.evaluate(() => __interior.getState())).heroPresent).toBe(
    false,
  );
  expect((await page.evaluate(() => __interior.getState())).view).toBe(
    "aerial",
  );
  await context.close();
});
