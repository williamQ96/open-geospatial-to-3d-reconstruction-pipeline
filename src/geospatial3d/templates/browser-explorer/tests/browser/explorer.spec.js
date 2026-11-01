// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => !["127.0.0.1", "localhost"].includes(url.hostname),
    (route) => route.abort(),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__campus?.getState().ready);
});

test("standalone synthetic scene has the full explorer without campus-specific content", async ({
  page,
}) => {
  const state = () => page.evaluate(() => window.__campus.getState());
  expect((await state()).buildings).toBe(4);
  expect((await state()).roadSegments).toBe(2);
  await expect(page.locator("#brand-name")).toContainText(
    "Geospatial Explorer",
  );
  expect(await page.locator("body").innerText()).not.toMatch(
    /University of Oregon|Eugene|NOAA|OpenCampus/,
  );
  const heights = await page.evaluate(() =>
    window.__campus.terrainCheck(12.3, -7.1),
  );
  expect(Math.abs(heights.mesh - heights.sampled)).toBeLessThan(0.001);
  await page.keyboard.press("Digit1");
  const before = (await state()).player;
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () =>
      Math.hypot(
        (await state()).player[0] - before[0],
        (await state()).player[2] - before[2],
      ),
    )
    .toBeGreaterThan(0.4);
  await page.keyboard.up("KeyW");
  await page.keyboard.press("Space");
  await expect.poll(async () => (await state()).grounded).toBe(false);
  await expect.poll(async () => (await state()).grounded).toBe(true);
  await page.keyboard.press("Digit2");
  expect((await state()).view).toBe("first");
  await page.keyboard.press("Digit3");
  const search = page.getByRole("combobox", { name: "Search buildings" });
  const origin = (await state()).player;
  await search.fill("dl");
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("option", { name: /Demo Library/ }).click();
  await expect.poll(async () => (await state()).cameraTransition).toBe(false);
  const overview = await state();
  const delta = overview.camera.map(
    (value, i) => value - overview.orbitTarget[i],
  );
  expect(Math.atan2(delta[1], Math.hypot(delta[0], delta[2]))).toBeCloseTo(
    Math.PI / 4,
    3,
  );
  await expect(page.locator(".building-label.is-selected")).toContainText(
    "Demo Library",
  );
  await expect(page.locator(".building-label.is-selected")).toBeHidden();
  await expect(page.locator(".building-card")).toBeVisible();
  for (const mode of ["Digit1", "Digit2"]) {
    await page.keyboard.press(mode);
    expect((await state()).player).toEqual(origin);
    await expect(page.locator(".building-label.is-selected")).toBeVisible();
  }
  await page.getByRole("button", { name: "Settings / About" }).click();
  await page.getByRole("button", { name: "About", exact: true }).click();
  await expect(page.locator("#about-panel")).toContainText("synthetic");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "Clear building search" }).click();
  expect((await state()).selectedBuilding).toBeNull();
});

test("template layout and keyboard search work at narrow widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const search = page.getByRole("combobox", { name: "Search buildings" });
  await expect(search).toBeInViewport();
  await page.keyboard.press("Slash");
  await expect(search).toBeFocused();
  await search.fill("no matching place");
  await expect(page.locator(".search-status")).toContainText(
    "No buildings found",
  );
  await search.fill("Demo Studio");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page.locator(".building-label.is-selected")).toHaveText(
    "Demo Studio",
  );
  await expect(page.getByRole("button", { name: /Follow/ })).toBeInViewport();
});
