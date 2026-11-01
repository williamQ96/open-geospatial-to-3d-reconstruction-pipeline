import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

for (const mode of ["First person", "Follow"]) {
  test(`mobile ${mode} supports independent move/look fingers and cancels safely`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__campus?.getState().ready);
    await page.getByRole("button", { name: mode, exact: false }).click();
    const state = () => page.evaluate(() => window.__campus.getState());
    const cdp = await page.context().newCDPSession(page);
    const point = (id, x, y) => ({
      id,
      x,
      y,
      radiusX: 5,
      radiusY: 5,
      force: 1,
    });
    const touch = (type, touchPoints) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
    const initial = await state();
    await touch("touchStart", [point(1, 90, 600)]);
    await touch("touchMove", [point(1, 90, 548)]);
    await expect(page.locator(".touch-stick")).toBeVisible();
    await expect
      .poll(async () => {
        const p = (await state()).player;
        return Math.hypot(p[0] - initial.player[0], p[2] - initial.player[2]);
      })
      .toBeGreaterThan(0.15);
    const beforeLook = (await state()).cameraDirection;
    await touch("touchStart", [point(1, 90, 548), point(2, 250, 330)]);
    await touch("touchMove", [point(1, 90, 548), point(2, 305, 345)]);
    await expect
      .poll(async () =>
        Math.abs((await state()).cameraDirection[0] - beforeLook[0]),
      )
      .toBeGreaterThan(0.05);
    // Lifting the look finger leaves the movement finger active.
    await touch("touchEnd", [point(2, 305, 345)]);
    await expect(page.locator(".touch-stick")).toBeVisible();
    await touch("touchCancel", []);
    await expect(page.locator(".touch-stick")).toBeHidden();
    const stopped = (await state()).player;
    await page.waitForTimeout(350);
    const after = (await state()).player;
    expect(
      Math.hypot(after[0] - stopped[0], after[2] - stopped[2]),
    ).toBeLessThan(0.02);

    await touch("touchStart", [point(1, 90, 600)]);
    await touch("touchMove", [point(1, 90, 550)]);
    await page.getByRole("button", { name: "Settings / About" }).click();
    await expect(page.locator(".touch-stick")).toBeHidden();
    await touch("touchEnd", []);
    await page.getByRole("button", { name: "Close settings" }).click();

    for (const size of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);
      const layout = await page.evaluate(() => {
        const nav = document
          .querySelector(".view-switch")
          .getBoundingClientRect();
        const search = document
          .querySelector(".campus-search")
          .getBoundingClientRect();
        return {
          bottom: nav.bottom,
          left: nav.left,
          right: nav.right,
          searchBottom: search.bottom,
          navTop: nav.top,
          height: innerHeight,
          width: innerWidth,
          scroll: document.documentElement.scrollHeight,
        };
      });
      expect(layout.bottom).toBeLessThanOrEqual(layout.height);
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(layout.width);
      expect(layout.searchBottom).toBeLessThan(layout.navTop);
      expect(layout.scroll).toBeLessThanOrEqual(layout.height);
    }
  });
}

for (const mode of ["First person", "Follow"]) {
  test(`mobile ${mode} analog drag selects walking/running without a Run button`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__campus?.getState().ready);
    await page.getByRole("button", { name: mode, exact: false }).click();
    await expect(page.locator(".touch-run")).toHaveCount(0);
    const cdp = await page.context().newCDPSession(page);
    const point = (x, y) => ({ id: 1, x, y, radiusX: 4, radiusY: 4, force: 1 });
    const touch = (type, y) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: y === null ? [] : [point(90, y)],
      });
    await touch("touchStart", 600);
    await touch("touchMove", 581);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().touchSpeed))
      .toBeCloseTo((4.6 * 13) / 42, 2);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().walkMotion.running))
      .toBe(false);
    await touch("touchMove", 548);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().touchSpeed))
      .toBe(4.6);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().walkMotion.running))
      .toBe(true);
    await touch("touchMove", 581);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().walkMotion.running))
      .toBe(false);
    await touch("touchEnd", null);
    await expect
      .poll(() => page.evaluate(() => __campus.getState().touchSpeed))
      .toBe(0);
  });
}
