import { test, expect } from "@playwright/test";
test("standalone template exposes opt-in beta beside Settings/About and releases all experiment actors", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  await page.locator("#settings-open").click();
  await page.locator("#beta-tab").click();
  const toggle = page.getByRole("checkbox", {
    name: "ZOMBIE SCHOOL!!!",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  expect(await page.evaluate(() => __campus.getState().zombies.active)).toBe(
    true,
  );
  expect(
    await page.evaluate(() => __campus.getState().zombies.count),
  ).toBeGreaterThan(0);
  await toggle.uncheck();
  expect(await page.evaluate(() => __campus.getState().zombies.count)).toBe(0);
});
