import { test, expect } from "@playwright/test";
const state = (page) => page.evaluate(() => __campus.getState());

test("blue block-cloud sky and adjustable first-person comfort keep movement available", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  expect((await state(page)).sky).toMatchObject({
    blue: true,
    clouds: 18,
    roundedEdges: true,
  });
  expect((await state(page)).motionLevel).toBe(1);
  await page.locator("#settings-open").click();
  const slider = page.getByRole("slider", {
    name: "First-person motion",
    exact: true,
  });
  for (const [level, name] of ["No", "Low", "Mid", "High"].entries()) {
    await slider.fill(String(level));
    await expect(slider).toHaveAttribute("aria-valuetext", name);
    await expect(page.locator("#motion-value")).toHaveText(name);
  }
  await slider.fill("0");
  await page.locator("#settings-close").click();
  await page.evaluate(() => __campus.setView("first"));
  await page.locator("#viewport").focus();
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => (await state(page)).walkMotion.walking)
    .toBe(true);
  expect((await state(page)).walkMotion).toMatchObject({
    bobX: 0,
    bobY: 0,
    roll: 0,
  });
  await page.keyboard.up("KeyW");
});

test("death is centered above a 30 percent scene shade; restart reloads defaults and spawn", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  const spawn = (await state(page)).player;
  await page.locator("#settings-open").click();
  await page.locator("#motion-setting").fill("3");
  await page.locator("#about-tab").click();
  await page.locator("#developer-setting").check();
  await page.locator("#settings-close").click();
  await page.evaluate(() => __campus.setView("first"));
  await page.evaluate(async () => {
    const { createDeathFlow } = await import("/src/death.js");
    createDeathFlow().show();
  });
  await expect(
    page.getByRole("heading", { name: "You are dead", exact: true }),
  ).toBeVisible();
  const styles = await page.evaluate(() => {
    const dialog = document.querySelector("#death-dialog"),
      box = dialog.getBoundingClientRect();
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      w: innerWidth,
      h: innerHeight,
      shade: getComputedStyle(document.querySelector("#death-shade"))
        .backgroundColor,
      shadeZ: +getComputedStyle(document.querySelector("#death-shade")).zIndex,
      uiZ: +getComputedStyle(document.querySelector(".masthead")).zIndex,
      blur: getComputedStyle(dialog, "::backdrop").backdropFilter,
      sameSceneLayer:
        document.querySelector("#death-shade").parentElement ===
        document.querySelector(".label-layer").parentElement,
    };
  });
  expect(Math.abs(styles.x - styles.w / 2)).toBeLessThan(2);
  expect(Math.abs(styles.y - styles.h / 2)).toBeLessThan(2);
  expect(styles.shade).toBe("rgba(0, 0, 0, 0.3)");
  expect(styles.uiZ).toBeGreaterThan(styles.shadeZ);
  expect(styles.blur).toBe("none");
  expect(styles.sameSceneLayer).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#death-dialog")).toBeVisible();
  const paused = (await state(page)).player;
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(160);
  await page.keyboard.up("KeyW");
  expect((await state(page)).player).toEqual(paused);
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Restart", exact: true }).click(),
  ]);
  await page.waitForFunction(() => window.__campus?.getState().ready);
  const reset = await state(page);
  expect(reset).toMatchObject({
    dead: false,
    view: "aerial",
    motionLevel: 1,
    developerMode: false,
  });
  expect(reset.player).toEqual(spawn);
  expect(reset.zombies.active).toBe(false);
  await expect(page.locator("#death-shade")).toBeHidden();
});
