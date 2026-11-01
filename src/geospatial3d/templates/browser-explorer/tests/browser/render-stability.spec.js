import { test, expect } from "@playwright/test";

test("Overview increases empty-space depth precision and walking restores close-up clipping", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  await expect
    .poll(() => page.evaluate(() => __campus.getState().cameraNear))
    .toBeGreaterThan(0.08);
  expect(
    await page.evaluate(() => __campus.getState().frozenStaticNodes),
  ).toBeGreaterThan(0);
  const presentation = await page.evaluate(
    () => __campus.getState().presentation,
  );
  if (presentation?.hazeCache)
    expect(presentation.hazeCache.cachedVertices).toBe(0);
  for (const view of ["first", "third"]) {
    await page.evaluate((v) => __campus.setView(v), view);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().cameraNear))
      .toBe(0.08);
  }
  await page.evaluate(() => __campus.setView("aerial"));
  await expect
    .poll(() => page.evaluate(() => __campus.getState().cameraNear))
    .toBeGreaterThan(0.08);
  expect(errors).toEqual([]);
});
